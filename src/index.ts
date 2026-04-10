/**
 * IAB Taxonomies — transparent access to Content, Ad Product, and Audience
 * taxonomies by type and version, formatted for OpenRTB.
 *
 * @example
 * ```ts
 * import { getTaxonomy, lookupCategory, getMapping, resolveCategories } from '@anthropic/iab-taxonomies';
 *
 * // Get all categories for a taxonomy
 * const content3 = getTaxonomy('content', '3.1');
 * console.log(content3.cattax); // 5
 * console.log(content3.categories.length); // ~750
 *
 * // Look up a single category by ID
 * const cat = lookupCategory('content', '3.1', 'JLBCU7');
 * console.log(cat?.name); // "Entertainment"
 *
 * // Translate category IDs between taxonomy versions
 * const mapping = getMapping('content', '1.0', 'ad_product', '2.0');
 * const matches = mapping?.filter(m => m.source.id === 'IAB1');
 *
 * // Resolve an OpenRTB cat[] array to full objects
 * const resolved = resolveCategories(['1002', '1007'], 6);
 * // [{ id: '1002', name: 'Alcohol', ... }, { id: '1007', name: 'Wine', ... }]
 * ```
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  TaxonomyCategory,
  TaxonomyMapping,
  TaxonomyIndex,
  TaxonomyType,
  TaxonomyVersion,
  CattaxValue,
} from './types.js';
import { findDescriptor, findMapping, resolveCattax, TAXONOMY_REGISTRY, MAPPING_REGISTRY } from './registry.js';

export type {
  TaxonomyCategory,
  TaxonomyMapping,
  TaxonomyIndex,
  TaxonomyType,
  TaxonomyVersion,
  CattaxValue,
  CategoryType,
  SegmentType,
  ContentVersion,
  AdProductVersion,
  AudienceVersion,
  TaxonomyDescriptor,
  MappingDescriptor,
} from './types.js';

export { resolveCattax, findDescriptor, findMapping, TAXONOMY_REGISTRY, MAPPING_REGISTRY } from './registry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

// ── Lazy-loading cache ──────────────────────────────────────────────────────

const taxonomyCache = new Map<string, TaxonomyIndex>();
const mappingCache = new Map<string, TaxonomyMapping[]>();
const lookupIndexCache = new Map<string, Map<string, TaxonomyCategory>>();

function cacheKey(type: TaxonomyType, version: TaxonomyVersion): string {
  return `${type}:${version}`;
}

function loadJsonFile<T>(relPath: string): T {
  const fullPath = join(DATA_DIR, relPath);
  const raw = readFileSync(fullPath, 'utf-8');
  return JSON.parse(raw) as T;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Get a full taxonomy by type and version.
 * Returns a `TaxonomyIndex` with the cattax value and all categories.
 *
 * @throws if the taxonomy type/version combination is unknown
 */
export function getTaxonomy(type: TaxonomyType, version: TaxonomyVersion): TaxonomyIndex {
  const key = cacheKey(type, version);
  const cached = taxonomyCache.get(key);
  if (cached) return cached;

  const desc = findDescriptor(type, version);
  if (!desc) {
    const available = TAXONOMY_REGISTRY.filter((d) => d.type === type)
      .map((d) => d.version)
      .join(', ');
    throw new Error(`Unknown taxonomy: ${type} v${version}. Available versions for ${type}: ${available}`);
  }

  const categories = loadJsonFile<TaxonomyCategory[]>(desc.dataFile);
  const index: TaxonomyIndex = {
    type: desc.type,
    version: desc.version,
    cattax: desc.cattax,
    categories,
  };

  taxonomyCache.set(key, index);
  return index;
}

/**
 * Get a taxonomy by its OpenRTB cattax value.
 * When a cattax covers multiple versions (e.g. cattax=2 covers 2.0/2.1/2.2),
 * returns the latest version.
 */
export function getTaxonomyByCattax(cattax: CattaxValue): TaxonomyIndex {
  const { type, versions } = resolveCattax(cattax);
  const latestVersion = versions[versions.length - 1];
  return getTaxonomy(type, latestVersion);
}

/**
 * Look up a single category by ID within a specific taxonomy version.
 * Uses an in-memory hash index for O(1) lookups after first access.
 */
export function lookupCategory(
  type: TaxonomyType,
  version: TaxonomyVersion,
  categoryId: string,
): TaxonomyCategory | undefined {
  const key = cacheKey(type, version);

  let index = lookupIndexCache.get(key);
  if (!index) {
    const taxonomy = getTaxonomy(type, version);
    index = new Map(taxonomy.categories.map((c) => [c.id, c]));
    lookupIndexCache.set(key, index);
  }

  return index.get(categoryId);
}

/**
 * Get the mapping between two taxonomy versions.
 * Returns null if no mapping exists for the given source→target pair.
 */
export function getMapping(
  sourceType: TaxonomyType,
  sourceVersion: TaxonomyVersion,
  targetType: TaxonomyType,
  targetVersion: TaxonomyVersion,
): TaxonomyMapping[] | null {
  const desc = findMapping(sourceType, sourceVersion, targetType, targetVersion);
  if (!desc) return null;

  const cached = mappingCache.get(desc.id);
  if (cached) return cached;

  const mappings = loadJsonFile<TaxonomyMapping[]>(desc.dataFile);
  mappingCache.set(desc.id, mappings);
  return mappings;
}

/**
 * Resolve an OpenRTB `cat[]` array of ID strings to full category objects,
 * given a cattax value.
 *
 * Unknown IDs are silently skipped.
 */
export function resolveCategories(catIds: string[], cattax: CattaxValue): TaxonomyCategory[] {
  const { type, versions } = resolveCattax(cattax);
  const latestVersion = versions[versions.length - 1];

  return catIds.map((id) => lookupCategory(type, latestVersion, id)).filter((c): c is TaxonomyCategory => c != null);
}

/**
 * Translate category IDs from one taxonomy version to another.
 * Returns the target category IDs for each source ID that has a mapping.
 *
 * @example
 * ```ts
 * const translated = translateCategories(
 *   ['IAB1', 'IAB2'],
 *   'content', '1.0',
 *   'ad_product', '2.0'
 * );
 * // Map { 'IAB1' => ['1008'], 'IAB2' => ['1551'] }
 * ```
 */
export function translateCategories(
  sourceIds: string[],
  sourceType: TaxonomyType,
  sourceVersion: TaxonomyVersion,
  targetType: TaxonomyType,
  targetVersion: TaxonomyVersion,
): Map<string, string[]> {
  const mappings = getMapping(sourceType, sourceVersion, targetType, targetVersion);
  if (!mappings) {
    throw new Error(`No mapping available from ${sourceType}:${sourceVersion} to ${targetType}:${targetVersion}`);
  }

  const sourceSet = new Set(sourceIds);
  const result = new Map<string, string[]>();

  for (const m of mappings) {
    if (sourceSet.has(m.source.id) && m.target.id) {
      const existing = result.get(m.source.id) ?? [];
      existing.push(m.target.id);
      result.set(m.source.id, existing);
    }
  }

  return result;
}

/**
 * List all available taxonomy versions.
 */
export function listTaxonomies(): Array<{
  type: TaxonomyType;
  version: TaxonomyVersion;
  cattax: CattaxValue;
  deprecated: boolean;
}> {
  return TAXONOMY_REGISTRY.map((d) => ({
    type: d.type,
    version: d.version,
    cattax: d.cattax,
    deprecated: d.deprecated,
  }));
}

/**
 * List all available mappings.
 */
export function listMappings(): Array<{
  id: string;
  sourceType: TaxonomyType;
  sourceVersion: TaxonomyVersion;
  targetType: TaxonomyType;
  targetVersion: TaxonomyVersion;
}> {
  return MAPPING_REGISTRY.map((d) => ({
    id: d.id,
    sourceType: d.sourceType,
    sourceVersion: d.sourceVersion,
    targetType: d.targetType,
    targetVersion: d.targetVersion,
  }));
}
