#!/usr/bin/env tsx
/**
 * Verification script — exercises the full public API to confirm correctness.
 */

import {
  getTaxonomy,
  getTaxonomyByCattax,
  lookupCategory,
  getMapping,
  resolveCategories,
  translateCategories,
  listTaxonomies,
  listMappings,
} from '../src/index.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

console.log('=== IAB Taxonomies Verification ===\n');

// ── 1. List all taxonomies ──────────────────────────────────────────────────

console.log('1. listTaxonomies()');
const taxonomies = listTaxonomies();
assert(taxonomies.length === 11, `Found ${taxonomies.length} taxonomy versions (expected 11)`);

console.log('\n   Available taxonomies:');
for (const t of taxonomies) {
  console.log(`     ${t.type.padEnd(12)} v${t.version}  cattax=${t.cattax}${t.deprecated ? '  (deprecated)' : ''}`);
}

// ── 2. Get taxonomy by type and version ─────────────────────────────────────

console.log('\n2. getTaxonomy()');

const content10 = getTaxonomy('content', '1.0');
assert(content10.cattax === 1, 'Content 1.0 -> cattax=1');
assert(content10.categories.length > 350, `Content 1.0 has ${content10.categories.length} categories`);
assert(content10.categories[0].id === 'IAB1', 'First category is IAB1');

const content31 = getTaxonomy('content', '3.1');
assert(content31.cattax === 5, 'Content 3.1 -> cattax=5');
assert(content31.categories.length > 700, `Content 3.1 has ${content31.categories.length} categories`);

const adProduct20 = getTaxonomy('ad_product', '2.0');
assert(adProduct20.cattax === 6, 'Ad Product 2.0 -> cattax=6');
assert(adProduct20.categories.length > 550, `Ad Product 2.0 has ${adProduct20.categories.length} categories`);

const audience11 = getTaxonomy('audience', '1.1');
assert(audience11.cattax === 4, 'Audience 1.1 -> cattax=4');
assert(audience11.categories.length > 1500, `Audience 1.1 has ${audience11.categories.length} categories`);

// ── 3. Get taxonomy by cattax ───────────────────────────────────────────────

console.log('\n3. getTaxonomyByCattax()');

const byCattax6 = getTaxonomyByCattax(6);
assert(byCattax6.type === 'ad_product', 'cattax=6 -> ad_product');
assert(byCattax6.version === '2.0', 'cattax=6 -> version 2.0');

const byCattax2 = getTaxonomyByCattax(2);
assert(byCattax2.type === 'content', 'cattax=2 -> content');
assert(byCattax2.version === '2.2', 'cattax=2 -> latest version 2.2');

// ── 4. Lookup individual categories ─────────────────────────────────────────

console.log('\n4. lookupCategory()');

const iab1 = lookupCategory('content', '1.0', 'IAB1');
assert(iab1?.name === 'Arts & Entertainment', 'Content 1.0 IAB1 = "Arts & Entertainment"');
assert(iab1?.tier === 1, 'IAB1 is Tier 1');
assert(iab1?.tierPath[0] === 'Arts & Entertainment', 'IAB1 tierPath[0] correct');

const alcohol = lookupCategory('ad_product', '2.0', '1002');
assert(alcohol?.name === 'Alcohol', 'Ad Product 2.0 ID 1002 = "Alcohol"');
assert(alcohol?.tier === 1, 'Alcohol is Tier 1');

const wine = lookupCategory('ad_product', '2.0', '1007');
assert(wine?.name === 'Wine', 'Ad Product 2.0 ID 1007 = "Wine"');
assert(wine?.parentId === '1002', 'Wine parent is 1002 (Alcohol)');

const sensitive = lookupCategory('content', '2.2', 'v9i3On');
assert(sensitive?.name === 'Sensitive Topics', 'Content 2.2 v9i3On = "Sensitive Topics"');
assert(sensitive?.categoryType === 'sensitive_topic', 'v9i3On is sensitive_topic type');

const ageRange = lookupCategory('audience', '1.1', '5');
assert(
  ageRange?.name?.includes('25-29') || ageRange?.tierPath?.includes('25-29'),
  'Audience 1.1 ID 5 = age range 25-29',
);
assert(ageRange?.segmentType === 'demographic', 'ID 5 is demographic segment');

const notFound = lookupCategory('content', '1.0', 'NONEXISTENT');
assert(notFound === undefined, 'Non-existent ID returns undefined');

// ── 5. SCD flags (Content 2.1+) ────────────────────────────────────────────

console.log('\n5. SCD flags');

const content21 = getTaxonomy('content', '2.1');
const scdCategories = content21.categories.filter((c) => c.scd === true);
assert(scdCategories.length > 50, `Content 2.1 has ${scdCategories.length} SCD-flagged categories`);

// ── 6. Category types in Content 2.2 ───────────────────────────────────────

console.log('\n6. Category types (Content 2.2)');

const content22 = getTaxonomy('content', '2.2');
const sensitiveTopics = content22.categories.filter((c) => c.categoryType === 'sensitive_topic');
const brandSuitability = content22.categories.filter((c) => c.categoryType === 'brand_suitability');
const descriptiveVectors = content22.categories.filter((c) => c.categoryType === 'descriptive_vector');
const coreContent = content22.categories.filter((c) => c.categoryType === 'content');

assert(sensitiveTopics.length >= 11, `${sensitiveTopics.length} sensitive topic categories`);
assert(brandSuitability.length >= 4, `${brandSuitability.length} brand suitability categories`);
assert(descriptiveVectors.length > 100, `${descriptiveVectors.length} descriptive vector categories`);
assert(coreContent.length > 600, `${coreContent.length} core content categories`);

// ── 7. Content 3.1 with Descriptive Vectors ─────────────────────────────────

console.log('\n7. Descriptive Vectors (Content 3.1)');

const vectors31 = content31.categories.filter((c) => c.categoryType === 'descriptive_vector');
assert(vectors31.length > 20, `Content 3.1 includes ${vectors31.length} descriptive vector entries`);

const podcast = content31.categories.find((c) => c.name === 'Podcast');
assert(podcast != null, 'Content 3.1 has a "Podcast" vector category');

// ── 8. Mappings ─────────────────────────────────────────────────────────────

console.log('\n8. getMapping()');

const allMappings = listMappings();
assert(allMappings.length === 9, `Found ${allMappings.length} mappings (expected 9)`);

const c1ToAp2 = getMapping('content', '1.0', 'ad_product', '2.0');
assert(c1ToAp2 != null, 'Content 1.0 -> Ad Product 2.0 mapping exists');
assert(c1ToAp2!.length > 300, `Mapping has ${c1ToAp2!.length} entries`);

const ap2ToC1 = getMapping('ad_product', '2.0', 'content', '1.0');
assert(ap2ToC1 != null, 'Ad Product 2.0 -> Content 1.0 mapping exists');

const noMapping = getMapping('audience', '1.0', 'content', '1.0');
assert(noMapping === null, 'Non-existent mapping returns null');

// ── 9. Resolve OpenRTB cat[] arrays ─────────────────────────────────────────

console.log('\n9. resolveCategories()');

const resolved = resolveCategories(['1002', '1007', 'INVALID'], 6);
assert(resolved.length === 2, `Resolved 2 of 3 IDs (1 invalid skipped)`);
assert(resolved[0].name === 'Alcohol', 'First resolved = Alcohol');
assert(resolved[1].name === 'Wine', 'Second resolved = Wine');

const resolvedContent = resolveCategories(['IAB1', 'IAB1-5'], 1);
assert(resolvedContent.length === 2, 'Resolved Content 1.0 categories');
assert(resolvedContent[0].name === 'Arts & Entertainment', 'IAB1 resolved');

// ── 10. Translate categories between versions ───────────────────────────────

console.log('\n10. translateCategories()');

const translated = translateCategories(['IAB1', 'IAB2', 'IAB8-5'], 'content', '1.0', 'ad_product', '2.0');
assert(translated.size >= 2, `Translated ${translated.size} categories`);

const iab1Targets = translated.get('IAB1');
assert(iab1Targets != null && iab1Targets.length > 0, `IAB1 maps to ${iab1Targets?.join(', ')}`);

const iab85Targets = translated.get('IAB8-5');
assert(iab85Targets != null && iab85Targets.length > 0, `IAB8-5 maps to ${iab85Targets?.join(', ')}`);

// ── 11. Audience taxonomy segment types ─────────────────────────────────────

console.log('\n11. Audience segment types');

const demographics = audience11.categories.filter((c) => c.segmentType === 'demographic');
const interests = audience11.categories.filter((c) => c.segmentType === 'interest');
const purchaseIntent = audience11.categories.filter((c) => c.segmentType === 'purchase_intent');

assert(demographics.length > 150, `${demographics.length} demographic segments`);
assert(interests.length > 400, `${interests.length} interest segments`);
assert(purchaseIntent.length > 800, `${purchaseIntent.length} purchase intent segments`);

// ── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${'='.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('\nAll checks passed!');
}
