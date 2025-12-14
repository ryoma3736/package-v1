# Genie AI デザインアセット

## Nano Banana Pro プロンプト集

`nano-banana-prompts.yaml` には以下のプロンプトが定義されています：

### UI モックアップ

| ID | 名前 | 用途 |
|----|------|------|
| `system_overview_infographic` | システム概要図 | LP、プレゼン用 |
| `ui_upload_screen` | アップロード画面 | UI設計参考 |
| `ui_progress_screen` | 進捗画面 | UI設計参考 |
| `ui_result_screen` | 結果画面 | UI設計参考 |

### 商品画像サンプル

| ID | 名前 | 用途 |
|----|------|------|
| `product_sample_cosmetic` | 化粧品ボトル | デモ用商品画像 |
| `product_sample_food` | 食品パッケージ | デモ用商品画像 |

### インフォグラフィック

| ID | 名前 | 用途 |
|----|------|------|
| `data_flow_infographic` | データフロー図 | 技術説明用 |
| `value_proposition_infographic` | 価値提案（Before/After） | マーケティング用 |

## 使い方

### 1. Google AI Studio で生成

```bash
# プロンプトをコピーして入力
nano-banana-prompts.yaml から該当セクションをコピー

# 指示を追加
「上記のYAML構造に従って、手書き風インフォグラフィック画像を生成してください」
```

### 2. 生成した画像を保存

```
docs/design/images/
├── system-overview.png
├── ui-upload.png
├── ui-progress.png
├── ui-result.png
├── product-cosmetic.png
├── product-food.png
├── data-flow.png
└── value-proposition.png
```

### 3. フロントエンドで使用

```tsx
import systemOverview from '@/assets/design/system-overview.png';

<Image src={systemOverview} alt="Genie AI システム概要" />
```

## スタイルガイド

### カラーパレット

| 用途 | 色 | HEX |
|------|-----|-----|
| テキスト/輪郭 | 黒 | `#333333` |
| 強調/注目 | 黄/オレンジ | `#FFB800` |
| 構造/安全 | 青/緑 | `#4A90D9` |
| 警告/重要 | 赤 | `#E74C3C` |
| 背景 | 白/オフホワイト | `#FAFAFA` |

### フォント

- **見出し**: 手書き風フォント（Zen Maru Gothic, Kosugi Maru）
- **本文**: 読みやすいゴシック体

### トーン

- 親しみやすい
- 専門的すぎない
- 「一緒に考えよう」感
- 未完成感（変更可能という印象）

## クレジット

- **Nano Banana Pro YAML形式**: ハヤシ シュンスケ (@Ambitious AI)
- **プロンプト設計**: Genie AI Team
