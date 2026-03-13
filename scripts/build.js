#!/usr/bin/env node
/**
 * build.js
 *
 * data/*.json（brands.json を除く）を結合してスキーマ検証し、
 * brands.json で定義されたブランド順で site/all-keyboards.json を生成する。
 *
 * 使い方:
 *   npm install          # 初回のみ（ajv をインストール）
 *   npm run build
 *
 * GitHub Actions での使い方:
 *   - run: npm ci && npm run build
 */

const fs   = require('fs');
const path = require('path');
const Ajv  = require('ajv');

// ── パス設定 ────────────────────────────────────────────
const ROOT         = path.resolve(__dirname, '..');
const DATA_DIR     = path.join(ROOT, 'data');
const BRANDS_FILE  = path.join(DATA_DIR, 'brands.json');
const SCHEMA_FILE  = path.join(ROOT, 'schema', 'us-keyboard-inventory-schema.json');
const OUTPUT_FILE  = path.join(ROOT, 'site', 'all-keyboards.json');

// ── 1. brands.json を読み込んでブランド順マップを作成 ───
const brandsData = JSON.parse(fs.readFileSync(BRANDS_FILE, 'utf8'));

// brand.en → { order: number, category: string, ja: string } のマップ
// brand.ja が省略されている場合は en と同じ値を使用
const brandOrderMap = new Map();
let order = 0;
for (const category of brandsData) {
  for (const brand of category.brands) {
    brandOrderMap.set(brand.en, {
      order:    order++,
      category: category.category,
      ja:       brand.ja ?? brand.en,
    });
  }
}

console.log(`📋  brands.json: ${brandOrderMap.size} ブランド / ${brandsData.length} カテゴリ\n`);

// ── 2. data/*.json を読み込んで結合（brands.json は除外）─
const jsonFiles = fs
  .readdirSync(DATA_DIR)
  .filter(f => f.endsWith('.json') && f !== 'brands.json')
  .sort();

if (jsonFiles.length === 0) {
  console.error('❌  data/ に キーボードデータの .json ファイルが見つかりません');
  process.exit(1);
}

let allKeyboards = [];
const idSet = new Set();

for (const file of jsonFiles) {
  const filePath = path.join(DATA_DIR, file);
  let entries;

  try {
    entries = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`❌  JSON パースエラー: ${file}\n   ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(entries)) {
    console.error(`❌  ${file} はルートが配列である必要があります`);
    process.exit(1);
  }

  // 重複 ID チェック
  for (const entry of entries) {
    if (idSet.has(entry.id)) {
      console.error(`❌  重複した ID: "${entry.id}" (${file})`);
      process.exit(1);
    }
    idSet.add(entry.id);
  }

  // brands.json に未登録のブランドを警告
  for (const entry of entries) {
    if (!brandOrderMap.has(entry.brand)) {
      console.warn(`⚠️   brands.json 未登録のブランド: "${entry.brand}" (${file} / id: ${entry.id})`);
    }
  }

  allKeyboards = allKeyboards.concat(entries);
  console.log(`✅  ${file}: ${entries.length} モデル`);
}

console.log(`\n📦  合計 ${allKeyboards.length} モデルを結合\n`);

// ── 3. スキーマ検証 ──────────────────────────────────────
const schema = JSON.parse(fs.readFileSync(SCHEMA_FILE, 'utf8'));
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);

if (!validate(allKeyboards)) {
  console.error('❌  スキーマ検証エラー:');
  for (const error of validate.errors) {
    const loc = error.instancePath || '(root)';
    console.error(`   ${loc}: ${error.message}`);
  }
  process.exit(1);
}

console.log('✅  スキーマ検証: 全件通過\n');

// ── 4. brands.json の順でソート ──────────────────────────
// 未登録ブランドは末尾に追加し、ID順でサブソート
const UNKNOWN_ORDER = brandOrderMap.size;

allKeyboards.sort((a, b) => {
  const orderA = brandOrderMap.get(a.brand)?.order ?? UNKNOWN_ORDER;
  const orderB = brandOrderMap.get(b.brand)?.order ?? UNKNOWN_ORDER;
  if (orderA !== orderB) return orderA - orderB;
  return a.id.localeCompare(b.id);
});

// ── 5. 出力 ──────────────────────────────────────────────
fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allKeyboards, null, 2), 'utf8');

console.log(`💾  出力完了: ${path.relative(ROOT, OUTPUT_FILE)}`);
console.log(`    ${allKeyboards.length} モデル / ${jsonFiles.length} ブランドファイル`);
