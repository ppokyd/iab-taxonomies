import type { TaxonomyDescriptor, MappingDescriptor, TaxonomyType, TaxonomyVersion, CattaxValue } from './types.js';

const BASE_URL = 'https://raw.githubusercontent.com/InteractiveAdvertisingBureau/Taxonomies/main';

export const TAXONOMY_REGISTRY: TaxonomyDescriptor[] = [
  {
    type: 'content',
    version: '1.0',
    cattax: 1,
    deprecated: true,
    tsvFiles: [`${BASE_URL}/Content%20Taxonomies/Content%20Taxonomy%201.0.tsv`],
    dataFile: 'content/1.0.json',
  },
  {
    type: 'content',
    version: '2.0',
    cattax: 2,
    deprecated: false,
    tsvFiles: [`${BASE_URL}/Content%20Taxonomies/Content%20Taxonomy%202.0.tsv`],
    dataFile: 'content/2.0.json',
  },
  {
    type: 'content',
    version: '2.1',
    cattax: 2,
    deprecated: false,
    tsvFiles: [`${BASE_URL}/Content%20Taxonomies/Content%20Taxonomy%202.1.tsv`],
    dataFile: 'content/2.1.json',
  },
  {
    type: 'content',
    version: '2.2',
    cattax: 2,
    deprecated: false,
    tsvFiles: [`${BASE_URL}/Content%20Taxonomies/Content%20Taxonomy%202.2.tsv`],
    dataFile: 'content/2.2.json',
  },
  {
    type: 'content',
    version: '3.0',
    cattax: 5,
    deprecated: false,
    tsvFiles: [
      `${BASE_URL}/Content%20Taxonomies/Content%20Taxonomy%203.0.tsv`,
      `${BASE_URL}/Content%20Taxonomies/Content%20Taxonomy%203.0%20Descriptive%20Vectors.tsv`,
    ],
    dataFile: 'content/3.0.json',
  },
  {
    type: 'content',
    version: '3.1',
    cattax: 5,
    deprecated: false,
    tsvFiles: [
      `${BASE_URL}/Content%20Taxonomies/Content%20Taxonomy%203.1.tsv`,
      `${BASE_URL}/Content%20Taxonomies/Content%20Taxonomy%203.0%20Descriptive%20Vectors.tsv`,
    ],
    dataFile: 'content/3.1.json',
  },
  {
    type: 'ad_product',
    version: '1.0',
    cattax: 3,
    deprecated: false,
    tsvFiles: [`${BASE_URL}/Ad%20Product%20Taxonomies/Ad%20Product%20Taxonomy%201.0.tsv`],
    dataFile: 'ad-product/1.0.json',
  },
  {
    type: 'ad_product',
    version: '1.1',
    cattax: 3,
    deprecated: false,
    tsvFiles: [`${BASE_URL}/Ad%20Product%20Taxonomies/Ad%20Product%20Taxonomy%201.1.tsv`],
    dataFile: 'ad-product/1.1.json',
  },
  {
    type: 'ad_product',
    version: '2.0',
    cattax: 6,
    deprecated: false,
    tsvFiles: [`${BASE_URL}/Ad%20Product%20Taxonomies/Ad%20Product%20Taxonomy%202.0.tsv`],
    dataFile: 'ad-product/2.0.json',
  },
  {
    type: 'audience',
    version: '1.0',
    cattax: 4,
    deprecated: false,
    tsvFiles: [`${BASE_URL}/Audience%20Taxonomies/Audience%20Taxonomy%201.0.tsv`],
    dataFile: 'audience/1.0.json',
  },
  {
    type: 'audience',
    version: '1.1',
    cattax: 4,
    deprecated: false,
    tsvFiles: [`${BASE_URL}/Audience%20Taxonomies/Audience%20Taxonomy%201.1.tsv`],
    dataFile: 'audience/1.1.json',
  },
];

export const MAPPING_REGISTRY: MappingDescriptor[] = [
  {
    id: 'ad_product:2.0->ad_product:1.1',
    sourceType: 'ad_product',
    sourceVersion: '2.0',
    targetType: 'ad_product',
    targetVersion: '1.1',
    tsvFile: `${BASE_URL}/Taxonomy%20Mappings/Ad%20Product%202.0%20to%201.1.tsv`,
    dataFile: 'mappings/ad-product-2.0--to--ad-product-1.1.json',
  },
  {
    id: 'ad_product:2.0->content:1.0',
    sourceType: 'ad_product',
    sourceVersion: '2.0',
    targetType: 'content',
    targetVersion: '1.0',
    tsvFile: `${BASE_URL}/Taxonomy%20Mappings/Ad%20Product%202.0%20to%20Content%201.0.tsv`,
    dataFile: 'mappings/ad-product-2.0--to--content-1.0.json',
  },
  {
    id: 'ad_product:2.0->content:2.1',
    sourceType: 'ad_product',
    sourceVersion: '2.0',
    targetType: 'content',
    targetVersion: '2.1',
    tsvFile: `${BASE_URL}/Taxonomy%20Mappings/Ad%20Product%202.0%20to%20Content%202.1.tsv`,
    dataFile: 'mappings/ad-product-2.0--to--content-2.1.json',
  },
  {
    id: 'content:1.0->ad_product:2.0',
    sourceType: 'content',
    sourceVersion: '1.0',
    targetType: 'ad_product',
    targetVersion: '2.0',
    tsvFile: `${BASE_URL}/Taxonomy%20Mappings/Content%201.0%20to%20Ad%20Product%202.0.tsv`,
    dataFile: 'mappings/content-1.0--to--ad-product-2.0.json',
  },
  {
    id: 'content:1.0->content:2.0',
    sourceType: 'content',
    sourceVersion: '1.0',
    targetType: 'content',
    targetVersion: '2.0',
    tsvFile: `${BASE_URL}/Taxonomy%20Mappings/Content%201.0%20to%20Content%202.0.tsv`,
    dataFile: 'mappings/content-1.0--to--content-2.0.json',
  },
  {
    id: 'content:2.0->content:2.1',
    sourceType: 'content',
    sourceVersion: '2.0',
    targetType: 'content',
    targetVersion: '2.1',
    tsvFile: `${BASE_URL}/Taxonomy%20Mappings/Content%202.0%20to%20Content%202.1.tsv`,
    dataFile: 'mappings/content-2.0--to--content-2.1.json',
  },
  {
    id: 'content:2.1->ad_product:2.0',
    sourceType: 'content',
    sourceVersion: '2.1',
    targetType: 'ad_product',
    targetVersion: '2.0',
    tsvFile: `${BASE_URL}/Taxonomy%20Mappings/Content%202.1%20to%20Ad%20Product%202.0.tsv`,
    dataFile: 'mappings/content-2.1--to--ad-product-2.0.json',
  },
  {
    id: 'content:ctv_genres->content:3.1',
    sourceType: 'content',
    sourceVersion: '3.1',
    targetType: 'content',
    targetVersion: '3.1',
    tsvFile: `${BASE_URL}/Taxonomy%20Mappings/CTV%20Genre%20Mapping.tsv`,
    dataFile: 'mappings/ctv-genres--to--content-3.1.json',
  },
  {
    id: 'content:podcast_genres->content:3.1',
    sourceType: 'content',
    sourceVersion: '3.1',
    targetType: 'content',
    targetVersion: '3.1',
    tsvFile: `${BASE_URL}/Taxonomy%20Mappings/Podcast%20Genre%20Mapping.tsv`,
    dataFile: 'mappings/podcast-genres--to--content-3.1.json',
  },
];

/**
 * Resolve cattax integer to taxonomy type and version range.
 */
export function resolveCattax(cattax: CattaxValue): { type: TaxonomyType; versions: TaxonomyVersion[] } {
  switch (cattax) {
    case 1:
      return { type: 'content', versions: ['1.0'] };
    case 2:
      return { type: 'content', versions: ['2.0', '2.1', '2.2'] };
    case 3:
      return { type: 'ad_product', versions: ['1.0', '1.1'] };
    case 4:
      return { type: 'audience', versions: ['1.0', '1.1'] };
    case 5:
      return { type: 'content', versions: ['3.0', '3.1'] };
    case 6:
      return { type: 'ad_product', versions: ['2.0'] };
  }
}

export function findDescriptor(type: TaxonomyType, version: TaxonomyVersion): TaxonomyDescriptor | undefined {
  return TAXONOMY_REGISTRY.find((d) => d.type === type && d.version === version);
}

export function findMapping(
  sourceType: TaxonomyType,
  sourceVersion: TaxonomyVersion,
  targetType: TaxonomyType,
  targetVersion: TaxonomyVersion,
): MappingDescriptor | undefined {
  return MAPPING_REGISTRY.find(
    (m) =>
      m.sourceType === sourceType &&
      m.sourceVersion === sourceVersion &&
      m.targetType === targetType &&
      m.targetVersion === targetVersion,
  );
}
