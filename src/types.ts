export type TaxonomyType = 'content' | 'ad_product' | 'audience';

export type ContentVersion = '1.0' | '2.0' | '2.1' | '2.2' | '3.0' | '3.1';
export type AdProductVersion = '1.0' | '1.1' | '2.0';
export type AudienceVersion = '1.0' | '1.1';
export type TaxonomyVersion = ContentVersion | AdProductVersion | AudienceVersion;

export type CategoryType = 'content' | 'sensitive_topic' | 'brand_suitability' | 'descriptive_vector';
export type SegmentType = 'demographic' | 'interest' | 'purchase_intent';

/**
 * OpenRTB cattax values as defined in the AdCOM specification.
 * @see https://github.com/InteractiveAdvertisingBureau/AdCOM/blob/main/AdCOM%20v1.0%20FINAL.md
 */
export type CattaxValue = 1 | 2 | 3 | 4 | 5 | 6;

export interface TaxonomyCategory {
  /** Unique identifier — always a string. Format varies by version. */
  id: string;
  /** Parent category ID, null for top-level roots. */
  parentId: string | null;
  /** Human-readable category name at this node. */
  name: string;

  /** Taxonomy family. */
  taxonomyType: TaxonomyType;
  /** Specific version string. */
  taxonomyVersion: TaxonomyVersion;
  /** OpenRTB cattax value for bid request/response signaling. */
  cattax: CattaxValue;

  /** Depth in the hierarchy (1 = root). */
  tier: number;
  /** Full hierarchy path from root to this node. */
  tierPath: string[];

  /** Audience taxonomy only: segment classification. */
  segmentType?: SegmentType;

  /** Content 2.1+: Sensitive Category Data flag. */
  scd?: boolean;
  /** Content 2.2+: distinguishes core content from safety/vector categories. */
  categoryType?: CategoryType;

  /** Extension note (ISO references for geo/language in audience taxonomy). */
  extension?: string;
}

export interface TaxonomyMapping {
  source: {
    taxonomy: string;
    version: string;
    id: string;
    name: string;
  };
  target: {
    taxonomy: string;
    version: string;
    id: string;
    name: string;
  };
  metadata?: {
    imperfectMapping?: string;
    deprecated?: boolean;
    unmapped?: boolean;
  };
}

export interface TaxonomyIndex {
  type: TaxonomyType;
  version: TaxonomyVersion;
  cattax: CattaxValue;
  categories: TaxonomyCategory[];
}

/**
 * Descriptor for a taxonomy version in the registry.
 */
export interface TaxonomyDescriptor {
  type: TaxonomyType;
  version: TaxonomyVersion;
  cattax: CattaxValue;
  deprecated: boolean;
  /** GitHub raw URL path segments for the TSV source. */
  tsvFiles: string[];
  /** Filename for the generated JSON data file. */
  dataFile: string;
}

export interface MappingDescriptor {
  id: string;
  sourceType: TaxonomyType;
  sourceVersion: TaxonomyVersion;
  targetType: TaxonomyType;
  targetVersion: TaxonomyVersion;
  tsvFile: string;
  dataFile: string;
}
