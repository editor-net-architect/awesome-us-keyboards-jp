#!/usr/bin/env python3
"""
build.py

data/*.json（brands.json を除く）を brands.json のブランド順で結合し、
スキーマ検証のうえ site/keyboards.json を生成する。

使い方:
    pip install jsonschema   # 初回のみ（スキーマ検証が必要な場合）
    python scripts/build.py

GitHub Actions での使い方（deploy.yml のインラインスクリプトを置き換え）:
    - run: python scripts/build.py
"""

import json
import os
import sys

ROOT        = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR    = os.path.join(ROOT, "data")
BRANDS_FILE = os.path.join(DATA_DIR, "brands.json")
SCHEMA_FILE = os.path.join(ROOT, "schema", "us-keyboard-inventory-schema.json")
OUTPUT_FILE = os.path.join(ROOT, "site", "keyboards.json")

# ── 1. brands.json を読み込んでブランド順マップを作成 ───────────
with open(BRANDS_FILE, encoding="utf-8") as f:
    brands_data = json.load(f)

# brand["en"] → {"order": int, "category": str, "ja": str}
# brand["ja"] が省略されている場合は "en" と同じ値を使用
brand_order_map = {}
order = 0
for category in brands_data:
    for brand in category["brands"]:
        brand_order_map[brand["en"]] = {
            "order":    order,
            "category": category["category"],
            "ja":       brand.get("ja", brand["en"]),
        }
        order += 1

print(f"📋  brands.json: {len(brand_order_map)} ブランド / {len(brands_data)} カテゴリ\n")

# ── 2. data/*.json を結合（brands.json は除外） ─────────────────
json_files = sorted(
    f for f in os.listdir(DATA_DIR)
    if f.endswith(".json") and f != "brands.json"
)

if not json_files:
    print("❌  data/ にキーボードデータの .json ファイルが見つかりません", file=sys.stderr)
    sys.exit(1)

all_keyboards = []
seen_ids = set()

for filename in json_files:
    filepath = os.path.join(DATA_DIR, filename)
    try:
        with open(filepath, encoding="utf-8") as f:
            entries = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌  JSON パースエラー: {filename}\n   {e}", file=sys.stderr)
        sys.exit(1)

    if not isinstance(entries, list):
        print(f"❌  {filename} はルートが配列である必要があります", file=sys.stderr)
        sys.exit(1)

    # 重複 ID チェック
    for entry in entries:
        if entry.get("id") in seen_ids:
            print(f"❌  重複した ID: \"{entry['id']}\" ({filename})", file=sys.stderr)
            sys.exit(1)
        seen_ids.add(entry.get("id"))

    # brands.json 未登録ブランドを警告（エラーにはしない）
    for entry in entries:
        if entry.get("brand") not in brand_order_map:
            print(f"⚠️   brands.json 未登録のブランド: \"{entry.get('brand')}\" ({filename} / id: {entry.get('id')})")

    all_keyboards.extend(entries)
    print(f"✅  {filename}: {len(entries)} モデル")

print(f"\n📦  合計 {len(all_keyboards)} モデルを結合\n")

# ── 3. スキーマ検証（jsonschema がインストール済みの場合のみ） ──
try:
    import jsonschema
    with open(SCHEMA_FILE, encoding="utf-8") as f:
        schema = json.load(f)
    try:
        jsonschema.validate(instance=all_keyboards, schema=schema)
        print("✅  スキーマ検証: 全件通過\n")
    except jsonschema.ValidationError as e:
        print(f"❌  スキーマ検証エラー:\n   {e.message}", file=sys.stderr)
        sys.exit(1)
except ImportError:
    print("⚠️   jsonschema 未インストールのためスキーマ検証をスキップ\n"
          "    pip install jsonschema で有効化できます\n")

# ── 4. brands.json の順でソート ────────────────────────────────
UNKNOWN_ORDER = len(brand_order_map)

all_keyboards.sort(key=lambda kb: (
    brand_order_map.get(kb.get("brand"), {}).get("order", UNKNOWN_ORDER),
    kb.get("id", ""),
))

# ── 5. 出力 ────────────────────────────────────────────────────
os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(all_keyboards, f, ensure_ascii=False, indent=2)

rel_path = os.path.relpath(OUTPUT_FILE, ROOT)
print(f"💾  出力完了: {rel_path}")
print(f"    {len(all_keyboards)} モデル / {len(json_files)} ブランドファイル")
