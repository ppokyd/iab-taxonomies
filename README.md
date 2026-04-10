# @anthropic/iab-taxonomies

IAB Tech Lab Content, Ad Product, and Audience taxonomies as structured JSON with a TypeScript API and first-class OpenRTB `cattax` support.

## Install

```bash
npm install @anthropic/iab-taxonomies
```

## Quick start

```ts
import { getTaxonomy, lookupCategory, resolveCategories, translateCategories } from '@anthropic/iab-taxonomies';

// Load a full taxonomy
const content = getTaxonomy('content', '3.1');
console.log(content.cattax); // 5
console.log(content.categories.length); // ~750

// Look up a single category by ID
const cat = lookupCategory('content', '3.1', 'JLBCU7');
console.log(cat?.name); // "Entertainment"

// Resolve an OpenRTB cat[] array to full category objects
const resolved = resolveCategories(['1002', '1007'], 6);
// [{ id: '1002', name: 'Alcohol', ... }, { id: '1007', name: 'Wine', ... }]

// Translate IDs between taxonomy versions
const translated = translateCategories(['IAB1', 'IAB2'], 'content', '1.0', 'ad_product', '2.0');
// Map { 'IAB1' => ['1008'], 'IAB2' => ['1551'] }
```

## Included taxonomies

| Type         | Version | `cattax` | Deprecated |
| ------------ | ------- | -------- | ---------- |
| `content`    | 1.0     | 1        | Yes        |
| `content`    | 2.0     | 2        | No         |
| `content`    | 2.1     | 2        | No         |
| `content`    | 2.2     | 2        | No         |
| `content`    | 3.0     | 5        | No         |
| `content`    | 3.1     | 5        | No         |
| `ad_product` | 1.0     | 3        | No         |
| `ad_product` | 1.1     | 3        | No         |
| `ad_product` | 2.0     | 6        | No         |
| `audience`   | 1.0     | 4        | No         |
| `audience`   | 1.1     | 4        | No         |

The `cattax` column corresponds to the OpenRTB / AdCOM `cattax` integer used in bid requests and responses.

## API

### `getTaxonomy(type, version)`

Returns a `TaxonomyIndex` containing `type`, `version`, `cattax`, and `categories[]`.

```ts
const adProduct = getTaxonomy('ad_product', '2.0');
console.log(adProduct.cattax); // 6
```

Throws if the type/version combination is unknown.

### `getTaxonomyByCattax(cattax)`

Resolves an OpenRTB `cattax` integer to a `TaxonomyIndex`. When a `cattax` covers multiple versions (e.g. `2` covers content 2.0/2.1/2.2), returns the latest version.

```ts
const taxonomy = getTaxonomyByCattax(2);
console.log(taxonomy.version); // "2.2"
```

### `lookupCategory(type, version, categoryId)`

O(1) category lookup by ID within a specific taxonomy. Returns `undefined` if the ID is not found.

```ts
const cat = lookupCategory('ad_product', '2.0', '1002');
console.log(cat?.name); // "Alcohol"
console.log(cat?.tier); // 2
console.log(cat?.tierPath); // ["Sensitive Topics", "Alcohol"]
```

### `resolveCategories(catIds, cattax)`

Resolves an OpenRTB `cat[]` string array to full `TaxonomyCategory` objects. Unknown IDs are silently skipped.

```ts
const categories = resolveCategories(['1002', '1007', 'INVALID'], 6);
// Returns 2 results — INVALID is skipped
```

### `translateCategories(sourceIds, sourceType, sourceVersion, targetType, targetVersion)`

Maps category IDs from one taxonomy to another using IAB-provided mappings. Returns a `Map<string, string[]>`.

```ts
const result = translateCategories(['IAB1', 'IAB8-5'], 'content', '1.0', 'ad_product', '2.0');
```

Throws if no mapping exists for the source-target pair. Use `listMappings()` to discover available pairs.

**Available mappings:**

| Source           | Target                         |
| ---------------- | ------------------------------ |
| `ad_product 2.0` | `ad_product 1.1`               |
| `ad_product 2.0` | `content 1.0`                  |
| `ad_product 2.0` | `content 2.1`                  |
| `content 1.0`    | `ad_product 2.0`               |
| `content 1.0`    | `content 2.0`                  |
| `content 2.0`    | `content 2.1`                  |
| `content 2.1`    | `ad_product 2.0`               |
| `content 3.1`    | `content 3.1` (CTV genres)     |
| `content 3.1`    | `content 3.1` (Podcast genres) |

### `getMapping(sourceType, sourceVersion, targetType, targetVersion)`

Returns the raw `TaxonomyMapping[]` between two taxonomy versions, or `null` if no mapping exists.

```ts
const mapping = getMapping('content', '1.0', 'content', '2.0');
const matches = mapping?.filter((m) => m.source.id === 'IAB1');
```

### `listTaxonomies()`

Returns metadata for all registered taxonomy versions.

```ts
const taxonomies = listTaxonomies();
// [{ type: 'content', version: '1.0', cattax: 1, deprecated: true }, ...]
```

### `listMappings()`

Returns metadata for all available cross-version mappings.

```ts
const mappings = listMappings();
const fromContent1 = mappings.filter((m) => m.sourceType === 'content' && m.sourceVersion === '1.0');
```

## Types

All types are exported from the package entry point:

```ts
import type {
  TaxonomyType, // 'content' | 'ad_product' | 'audience'
  TaxonomyVersion, // '1.0' | '2.0' | '2.1' | '2.2' | '3.0' | '3.1' | '1.1'
  CattaxValue, // 1 | 2 | 3 | 4 | 5 | 6
  TaxonomyCategory,
  TaxonomyIndex,
  TaxonomyMapping,
  CategoryType, // 'content' | 'sensitive_topic' | 'brand_suitability' | 'descriptive_vector'
  SegmentType, // 'demographic' | 'interest' | 'purchase_intent'
  ContentVersion,
  AdProductVersion,
  AudienceVersion,
  TaxonomyDescriptor,
  MappingDescriptor,
} from '@anthropic/iab-taxonomies';
```

## Data source

Taxonomy data is sourced from the official [IAB Tech Lab Taxonomies](https://github.com/InteractiveAdvertisingBureau/Taxonomies) repository and converted to JSON during the build. A monthly sync workflow keeps the data up to date.

## License

Apache-2.0
