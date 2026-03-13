#!/usr/bin/env node
/**
 * build.js
 *
 * data/*.json を結合してスキーマ検証し、
 * site/all-keyboards.json を生成するビルドスクリプト。
 *
 * 使い方:
 *   npm install ajv          # 初回のみ
 *   node scripts/build.js
 *
 * GitHub Actions での使い方:
 *   - run: node scripts/build.js
 */

const fs   = require('fs');
const path = require('path');
const Ajv  = require('ajv');

// ── パス設定 ────────────────────────────────────────────
const ROOT        = path.resolve(__dirname, '..');
const DATA_DIR    = path.join(ROOT, 'data');
const SCHEMA_FILE = path.join(ROOT, 'schema', 'us-keyboard-inventory-schema.json');
const OUTPUT_FILE = path.join(ROOT, 'site', 'all-keyboards.json');

// ── 1. data/*.json を読み込んで結合 ─────────────────────
const jsonFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));

if (jsonFiles.length === 0) {
  console.error('❌  data/ に .json ファイルが見つかりません');
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
      console.error(`❌  重複した ID が検出されました: "${entry.id}" (${file})`);
      process.exit(1);
    }
    idSet.add(entry.id);
  }

  allKeyboards = allKeyboards.concat(entries);
  console.log(`✅  ${file}: ${entries.length} モデル読み込み`);
}

console.log(`\n📦  合計 ${allKeyboards.length} モデルを結合\n`);

// ── 2. スキーマ検証 ──────────────────────────────────────
const schema = JSON.parse(fs.readFileSync(SCHEMA_FILE, 'utf8'));
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);
const valid = validate(allKeyboards);

if (!valid) {
  console.error('❌  スキーマ検証エラー:');
  for (const error of validate.errors) {
    const loc = error.instancePath || '(root)';
    console.error(`   ${loc}: ${error.message}`);
  }
  process.exit(1);
}

console.log('✅  スキーマ検証: 全件通過\n');

// ── 3. ブランド・レイアウト順にソート ───────────────────
allKeyboards.sort((a, b) => {
  if (a.brand < b.brand) return -1;
  if (a.brand > b.brand) return  1;
  return a.id.localeCompare(b.id);
});

// ── 4. 出力 ──────────────────────────────────────────────
fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allKeyboards, null, 2), 'utf8');

console.log(`💾  出力完了: ${path.relative(ROOT, OUTPUT_FILE)}`);
console.log(`    ${allKeyboards.length} モデル / ${jsonFiles.length} ブランドファイル`);
