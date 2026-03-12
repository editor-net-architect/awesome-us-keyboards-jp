# 貢献ガイド

Awesome US Keyboards JP へのご協力ありがとうございます。

## データ追加の手順

### 1. 新しいブランドのデータを追加する場合

`data/` ディレクトリ配下にブランド名の JSON ファイルを作成します。

例：`data/keychron.json`

```json
[
  {
    "id": "keychron-k3-pro-us",
    "name": "Keychron K3 Pro (US ASCII)",
    "brand": "Keychron",
    "specs": {
      "layout_size": "75%",
      "profile": "Low-Profile",
      "switch_technology": "Mechanical",
      "switch_feels_available": ["Linear", "Tactile"],
      "switch_hotswap": true,
      "backlight": "RGB",
      "connectivity": ["USB-C", "Bluetooth", "2.4GHz Dongle"],
      "os_compatibility": ["Windows", "macOS", "iOS/iPadOS", "Android"],
      "customization_method": "QMK/VIA",
      "weight_g": 380,
      "release_date": "2023-06"
    },
    "japan_context": {
      "availability": "Available",
      "giteki": "Certified",
      "purchase_urls": [
        "https://www.amazon.co.jp/dp/...",
        "https://www.rakuten.co.jp/..."
      ]
    },
    "tags": ["portable", "wireless"]
  }
]
```

### 2. スキーマに準拠する

すべてのデータは `schema/us-keyboard-inventory-schema.json` に定義されているスキーマに準拠する必要があります。

#### 重要なフィールド：

| フィールド | 形式 | 説明 |
|-----------|------|------|
| `id` | string | ユニークな識別子（例：`brand-model-us`） |
| `brand` | enum | 指定のブランド名のみ許可 |
| `layout_size` | enum | 40%, 60%, 65%, 75%, 80% (TKL), 100% (Full), Split |
| `switch_technology` | enum | Mechanical, Topre (Capacitive), Hall Effect (Magnetic), Optical |
| `connectivity` | array | USB-A, USB-C, Mini USB, Bluetooth, 2.4GHz Dongle |
| `japan_context.giteki` | enum | Certified, Wired Only, No/Unknown |
| `japan_context.availability` | enum | Available, Import Only, Unavailable |
| `tags` | array | gaming, portable, silent, wireless, split, budget, aluminum, gasket-mount |

### 3. テストと検証

JSON がスキーマに準拠しているか、以下で検証してください：

```bash
python3 -m jsonschema -i data/your-brand.json schema/us-keyboard-inventory-schema.json
```

## Issue と Pull Request

### Issue の作成

以下の場合に Issue を作成してください：

- データの誤り・古い情報の報告
- 新しいキーボードモデルの提案
- サイト機能の要望・バグ報告

### Pull Request の作成

1. このリポジトリをフォーク
2. フィーチャーブランチを作成：`git checkout -b feature/add-brand-xxx`
3. データファイルを追加・修正
4. コミット：`git commit -am 'Add/Update XXX keyboards data'`
5. プッシュ：`git push origin feature/add-brand-xxx`
6. GitHub で Pull Request を作成

## 行動規範

- 敬意を持って接する
- 建設的なフィードバックを心がける
- スパムや不適切な投稿は禁止

ご不明な点や質問があれば、Issue でお気軽にお問い合わせください。

よろしくお願いします！
