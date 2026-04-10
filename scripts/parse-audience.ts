/**
 * Parser for IAB Audience Taxonomy TSV files.
 *
 * Both v1.0 and v1.1 share the same 11-column structure:
 *   Col 0: (empty/marker)
 *   Col 1: Unique ID
 *   Col 2: Parent ID
 *   Col 3: Condensed Name (pipe-delimited path)
 *   Col 4–9: Tier 1 through Tier 6
 *   Col 10: *Extension Notes
 */

import type { TaxonomyCategory, AudienceVersion, SegmentType } from '../src/types.js';
import { parseTsvRows, nonEmpty } from './tsv.js';

function resolveSegmentType(tier1: string): SegmentType | undefined {
  const t = tier1.toLowerCase();
  if (t === 'demographic') return 'demographic';
  if (t === 'interest') return 'interest';
  if (t.startsWith('purchase intent')) return 'purchase_intent';
  return undefined;
}

export function parseAudience(raw: string, version: AudienceVersion): TaxonomyCategory[] {
  const rows = parseTsvRows(raw).filter(nonEmpty);
  const categories: TaxonomyCategory[] = [];

  for (const row of rows) {
    const id = row[1];
    if (!id || id === 'Unique ID') continue;

    const parentId = row[2] || null;
    const name = row[3] || '';
    if (!name) continue;

    const tierCols: string[] = [];
    for (let i = 4; i <= 9 && i < row.length; i++) {
      if (row[i]) tierCols.push(row[i]);
    }

    const tier = tierCols.length || 1;
    const tier1 = row[4] || '';
    const segmentType = resolveSegmentType(tier1);
    const extension = (row[10] || '').trim() || undefined;

    categories.push({
      id,
      parentId,
      name,
      taxonomyType: 'audience',
      taxonomyVersion: version,
      cattax: 4,
      tier,
      tierPath: tierCols.length > 0 ? tierCols : [name],
      ...(segmentType ? { segmentType } : {}),
      ...(extension ? { extension } : {}),
    });
  }

  return categories;
}
