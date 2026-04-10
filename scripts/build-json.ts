#!/usr/bin/env tsx
/**
 * Downloads all IAB Taxonomy TSV files from GitHub and converts them to JSON.
 * Output goes to data/ directory, organized by taxonomy type.
 *
 * Usage: npx tsx scripts/build-json.ts
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { TAXONOMY_REGISTRY, MAPPING_REGISTRY } from '../src/registry.js';
import { parseContent1, parseContent2x, parseDescriptiveVectors } from './parse-content.js';
import { parseAdProduct } from './parse-ad-product.js';
import { parseAudience } from './parse-audience.js';
import { parseMappingFile } from './parse-mappings.js';
import type { TaxonomyCategory, ContentVersion, AdProductVersion, AudienceVersion } from '../src/types.js';

const DATA_DIR = join(import.meta.dirname!, '..', 'data');

async function fetchTsv(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  return res.text();
}

function writeJson(relPath: string, data: unknown): void {
  const fullPath = join(DATA_DIR, relPath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, JSON.stringify(data, null, 2));
  const count = Array.isArray(data) ? data.length : 0;
  console.log(`  ✓ ${relPath} (${count} entries)`);
}

async function buildTaxonomies(): Promise<void> {
  console.log('Building taxonomy JSON files...\n');

  for (const desc of TAXONOMY_REGISTRY) {
    const label = `${desc.type}/${desc.version}`;
    console.log(`[${label}]  cattax=${desc.cattax}`);

    const tsvContents = await Promise.all(desc.tsvFiles.map(fetchTsv));

    let categories: TaxonomyCategory[] = [];

    if (desc.type === 'content') {
      const version = desc.version as ContentVersion;
      if (version === '1.0') {
        categories = parseContent1(tsvContents[0]);
      } else {
        categories = parseContent2x(tsvContents[0], version);
        // For v3.0/3.1, append the Descriptive Vectors companion file
        if (tsvContents.length > 1) {
          const vectors = parseDescriptiveVectors(tsvContents[1], version);
          categories = [...categories, ...vectors];
        }
      }
    } else if (desc.type === 'ad_product') {
      categories = parseAdProduct(tsvContents[0], desc.version as AdProductVersion);
    } else if (desc.type === 'audience') {
      categories = parseAudience(tsvContents[0], desc.version as AudienceVersion);
    }

    writeJson(desc.dataFile, categories);
  }
}

async function buildMappings(): Promise<void> {
  console.log('\nBuilding mapping JSON files...\n');

  for (const desc of MAPPING_REGISTRY) {
    console.log(`[${desc.id}]`);
    const raw = await fetchTsv(desc.tsvFile);
    const mappings = parseMappingFile(raw, desc);
    writeJson(desc.dataFile, mappings);
  }
}

async function buildIndex(): Promise<void> {
  console.log('\nBuilding index...\n');

  const index = {
    taxonomies: TAXONOMY_REGISTRY.map((d) => ({
      type: d.type,
      version: d.version,
      cattax: d.cattax,
      deprecated: d.deprecated,
      dataFile: d.dataFile,
    })),
    mappings: MAPPING_REGISTRY.map((d) => ({
      id: d.id,
      sourceType: d.sourceType,
      sourceVersion: d.sourceVersion,
      targetType: d.targetType,
      targetVersion: d.targetVersion,
      dataFile: d.dataFile,
    })),
  };

  writeJson('index.json', index);
}

async function main(): Promise<void> {
  const start = Date.now();
  await buildTaxonomies();
  await buildMappings();
  await buildIndex();
  console.log(`\nDone in ${((Date.now() - start) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
