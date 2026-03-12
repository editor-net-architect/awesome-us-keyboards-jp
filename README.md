# Awesome US Keyboards JP

[![Deploy to Pages](https://github.com/editor-net-architect/awesome-us-keyboards-jp/actions/workflows/deploy.yml/badge.svg)](https://github.com/editor-net-architect/awesome-us-keyboards-jp/actions/workflows/deploy.yml)

日本市場でUS配列（ANSI）キーボードを探すエンジニア・クリエイター向けの、「日本で買える・使える」モデル情報ポータル。

## サイト

https://editor-net-architect.github.io/awesome-us-keyboards-jp/

## 概要

JIS配列が主流の日本市場において、タイピング効率やカスタマイズ性を求めるユーザーのためにUS配列キーボードの情報をキュレーション。ブランド・レイアウト・スイッチ・接続方式・日本での入手性などでフィルタ・検索が可能。

## データ構造

各キーボードモデルは以下の情報を持つJSONで管理されます：

- **基本情報**：ID、製品名、ブランド
- **仕様**：レイアウトサイズ、スイッチ技術、プロファイル、ホットスワップ対応、接続方式、OS互換性、カスタマイズ方法、重量、発売日
- **日本コンテキスト**：日本での入手性、技適認証状態、購入リンク
- **タグ**：gaming、portable、wireless、split など

詳細は `schema/us-keyboard-inventory-schema.json` を参照。

## プロジェクトフェーズ

### Phase 1: ポータルサイト構築（現在）
- GitHub Pages でのサイト公開
- FILCOデータ（11モデル）の一覧表示
- ブランド・レイアウト・スイッチ・接続・入手性によるフィルタリング
- テキスト検索
- レスポンシブデザイン

### Phase 2・3（予定）
- 情報収集パイプラインの自動化
- 複数ブランドのデータ拡充
- ユーザーフィードバック機能

## ライセンス

MIT License

## 貢献

`CONTRIBUTING.md` を参照。
