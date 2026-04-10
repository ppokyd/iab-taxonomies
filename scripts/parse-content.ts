/**
 * Parsers for IAB Content Taxonomy TSV files.
 *
 * Handles all format variations:
 *  - v1.0: 3-column flat (IAB Code, Tier, IAB Category)
 *  - v2.0–2.2: 7-column relational + optional SCD flag + extensions inline
 *  - v3.0–3.1: 7-column relational + SCD + Sensitive Topics (no inline extensions)
 *  - Descriptive Vectors: separate companion file for v3.0+
 */

import type { TaxonomyCategory, ContentVersion, CattaxValue, CategoryType } from '../src/types.js';
import { parseTsvRows, nonEmpty } from './tsv.js';

function cattaxFor(version: ContentVersion): CattaxValue {
  if (version === '1.0') return 1;
  if (version === '3.0' || version === '3.1') return 5;
  return 2;
}

// ── Content Taxonomy 1.0 ────────────────────────────────────────────────────

export function parseContent1(raw: string): TaxonomyCategory[] {
  const rows = parseTsvRows(raw).filter(nonEmpty);
  const categories: TaxonomyCategory[] = [];

  for (const row of rows) {
    const [code, tierLabel, name] = row;
    if (!code || code === 'IAB Code') continue;

    const tier = tierLabel === 'Tier 1' ? 1 : 2;
    const parentId = tier === 1 ? null : code.replace(/-\d+$/, '');
    const tierPath = tier === 1 ? [name] : [findTier1Name(categories, parentId!), name];

    categories.push({
      id: code,
      parentId,
      name,
      taxonomyType: 'content',
      taxonomyVersion: '1.0',
      cattax: 1,
      tier,
      tierPath,
      categoryType: 'content',
    });
  }

  return categories;
}

function findTier1Name(categories: TaxonomyCategory[], id: string): string {
  return categories.find((c) => c.id === id)?.name ?? id;
}

// ── Content Taxonomy 2.0+ ───────────────────────────────────────────────────

/**
 * Detects whether a category belongs to the "Sensitive Topics" or
 * "Brand Suitability and Risk" sections based on parent chain or known IDs.
 */
const SENSITIVE_TOPIC_ROOT = 'v9i3On';
const BRAND_SUITABILITY_ROOT = 'MRkz4Q';

function classifyCategory(id: string, parentId: string | null, parentMap: Map<string, string | null>): CategoryType {
  let cur: string | null = id;
  while (cur) {
    if (cur === SENSITIVE_TOPIC_ROOT) return 'sensitive_topic';
    if (cur === BRAND_SUITABILITY_ROOT) return 'brand_suitability';
    cur = parentMap.get(cur) ?? null;
  }
  return 'content';
}

export function parseContent2x(raw: string, version: ContentVersion): TaxonomyCategory[] {
  const rows = parseTsvRows(raw).filter(nonEmpty);
  const categories: TaxonomyCategory[] = [];
  const parentMap = new Map<string, string | null>();

  let headerSkipped = false;

  for (const row of rows) {
    // Skip the two header rows
    if (row[0]?.includes('Relational ID') || row[0]?.includes('New Relational') || row[0] === 'Unique ID') {
      headerSkipped = true;
      continue;
    }
    if (!headerSkipped) continue;

    const id = row[0];
    if (!id) continue;

    const parentId = row[1] || null;
    const name = row[2] || '';
    const tier1 = row[3] || '';
    const tier2 = row[4] || '';
    const tier3 = row[5] || '';
    const tier4 = row[6] || '';

    if (!name) continue;

    parentMap.set(id, parentId);

    const tierPath = [tier1, tier2, tier3, tier4].filter(Boolean);
    const tier = tierPath.length;

    const hasScd = row.some((cell) => cell === 'SCD');

    const isExtension = /^\d+$/.test(id) && parseInt(id, 10) >= 1000;

    let categoryType: CategoryType = isExtension ? 'descriptive_vector' : 'content';
    if (id === SENSITIVE_TOPIC_ROOT || parentId === SENSITIVE_TOPIC_ROOT) {
      categoryType = 'sensitive_topic';
    } else if (id === BRAND_SUITABILITY_ROOT || parentId === BRAND_SUITABILITY_ROOT) {
      categoryType = 'brand_suitability';
    } else if (!isExtension) {
      categoryType = classifyCategory(id, parentId, parentMap);
    }

    categories.push({
      id,
      parentId,
      name,
      taxonomyType: 'content',
      taxonomyVersion: version,
      cattax: cattaxFor(version),
      tier,
      tierPath,
      ...(hasScd ? { scd: true } : {}),
      categoryType,
    });
  }

  return categories;
}

// ── Descriptive Vectors (Content 3.0 companion) ────────────────────────────

export function parseDescriptiveVectors(raw: string, version: ContentVersion): TaxonomyCategory[] {
  const rows = parseTsvRows(raw).filter(nonEmpty);
  const categories: TaxonomyCategory[] = [];

  for (const row of rows) {
    if (row[0]?.includes('Relational ID') || row[0] === 'Unique ID') continue;

    const id = row[0];
    if (!id) continue;

    const parentId = row[1] || null;
    const name = row[2] || '';
    const tier1 = row[3] || '';
    const tier2 = row[4] || '';
    const tier3 = row[5] || '';
    const tier4 = row[6] || '';

    if (!name) continue;

    const tierPath = [tier1, tier2, tier3, tier4].filter(Boolean);
    const tier = tierPath.length;

    let categoryType: CategoryType = 'descriptive_vector';
    if (id === BRAND_SUITABILITY_ROOT || parentId === BRAND_SUITABILITY_ROOT) {
      categoryType = 'brand_suitability';
    }

    categories.push({
      id,
      parentId,
      name,
      taxonomyType: 'content',
      taxonomyVersion: version,
      cattax: cattaxFor(version),
      tier,
      tierPath,
      categoryType,
    });
  }

  return categories;
}
