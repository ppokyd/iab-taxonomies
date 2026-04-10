/**
 * Parser for IAB Ad Product Taxonomy TSV files.
 *
 * v1.0/1.1: 8 columns — Unique ID, Parent ID, Name, Tier 1–5
 * v2.0:     6 columns — Unique ID, Parent ID, Name, Tier 1–3
 */

import type { TaxonomyCategory, AdProductVersion, CattaxValue } from '../src/types.js';
import { parseTsvRows, nonEmpty } from './tsv.js';

function cattaxFor(version: AdProductVersion): CattaxValue {
  return version === '2.0' ? 6 : 3;
}

export function parseAdProduct(raw: string, version: AdProductVersion): TaxonomyCategory[] {
  const rows = parseTsvRows(raw).filter(nonEmpty);
  const categories: TaxonomyCategory[] = [];

  const maxTiers = version === '2.0' ? 3 : 5;

  for (const row of rows) {
    const id = row[0];
    if (!id || id === 'Unique ID') continue;

    const parentId = row[1] || null;
    const name = row[2] || '';
    if (!name) continue;

    const tierCols: string[] = [];
    for (let i = 3; i < 3 + maxTiers && i < row.length; i++) {
      if (row[i]) tierCols.push(row[i]);
    }

    const tier = tierCols.length || 1;

    categories.push({
      id,
      parentId,
      name,
      taxonomyType: 'ad_product',
      taxonomyVersion: version,
      cattax: cattaxFor(version),
      tier,
      tierPath: tierCols.length > 0 ? tierCols : [name],
    });
  }

  return categories;
}
