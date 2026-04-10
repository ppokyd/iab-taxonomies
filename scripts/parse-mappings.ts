/**
 * Parsers for IAB Taxonomy Mapping TSV files.
 *
 * Each mapping file has a unique column layout — this module handles all
 * known formats and produces a uniform TaxonomyMapping[] output.
 */

import type { TaxonomyMapping, MappingDescriptor } from '../src/types.js';
import { parseTsvRows, nonEmpty } from './tsv.js';

interface ColumnMap {
  srcId: number;
  srcName: number;
  tgtId: number;
  tgtName: number;
  imperfectMapping?: number;
  skipRows: number;
}

/**
 * Column layouts per mapping file. Derived from the analysis of each TSV.
 */
const COLUMN_MAPS: Record<string, ColumnMap> = {
  'ad_product:2.0->ad_product:1.1': {
    srcId: 1,
    srcName: 0,
    tgtId: 6,
    tgtName: 8,
    skipRows: 2,
  },
  'ad_product:2.0->content:1.0': {
    srcId: 1,
    srcName: 0,
    tgtId: 6,
    tgtName: 5,
    skipRows: 2,
  },
  'ad_product:2.0->content:2.1': {
    srcId: 1,
    srcName: 0,
    tgtId: 5,
    tgtName: 6,
    skipRows: 1,
  },
  'content:1.0->ad_product:2.0': {
    srcId: 0,
    srcName: 1,
    tgtId: 3,
    tgtName: 4,
    skipRows: 1,
  },
  'content:1.0->content:2.0': {
    srcId: 0,
    srcName: 1,
    tgtId: 3,
    tgtName: 5,
    imperfectMapping: 10,
    skipRows: 1,
  },
  'content:2.0->content:2.1': {
    srcId: 1,
    srcName: 2,
    tgtId: 0,
    tgtName: 3,
    skipRows: 1,
  },
  'content:2.1->ad_product:2.0': {
    srcId: 0,
    srcName: 2,
    tgtId: 8,
    tgtName: 9,
    skipRows: 1,
  },
  'content:ctv_genres->content:3.1': {
    srcId: 0,
    srcName: 0,
    tgtId: 1,
    tgtName: 2,
    skipRows: 1,
  },
  'content:podcast_genres->content:3.1': {
    srcId: 0,
    srcName: 0,
    tgtId: 1,
    tgtName: 2,
    skipRows: 1,
  },
};

export function parseMappingFile(raw: string, descriptor: MappingDescriptor): TaxonomyMapping[] {
  const colMap = COLUMN_MAPS[descriptor.id];
  if (!colMap) {
    throw new Error(`No column map defined for mapping: ${descriptor.id}`);
  }

  const rows = parseTsvRows(raw).filter(nonEmpty);
  const data = rows.slice(colMap.skipRows);
  const mappings: TaxonomyMapping[] = [];

  for (const row of data) {
    const srcId = row[colMap.srcId] || '';
    const srcName = row[colMap.srcName] || '';
    const tgtId = row[colMap.tgtId] || '';
    const tgtName = row[colMap.tgtName] || '';

    if (!srcId && !tgtId) continue;

    const imperfect =
      colMap.imperfectMapping != null ? (row[colMap.imperfectMapping] || '').trim() || undefined : undefined;

    const isUnmapped = !tgtId;

    mappings.push({
      source: {
        taxonomy: descriptor.sourceType,
        version: descriptor.sourceVersion,
        id: srcId,
        name: srcName,
      },
      target: {
        taxonomy: descriptor.targetType,
        version: descriptor.targetVersion,
        id: tgtId,
        name: tgtName,
      },
      ...(imperfect || isUnmapped
        ? {
            metadata: {
              ...(imperfect ? { imperfectMapping: imperfect } : {}),
              ...(isUnmapped ? { unmapped: true } : {}),
            },
          }
        : {}),
    });
  }

  return mappings;
}
