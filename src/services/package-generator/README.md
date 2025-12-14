# Package Generator Service

商品分析結果を基に、パッケージデザインの複数バリエーションを自動生成するサービスです。

## ディレクトリ構成

```
src/services/package-generator/
├── index.ts              # メインエントリポイント
├── types.ts              # 型定義
├── prompt-builder.ts     # AIプロンプト生成ロジック
├── template-engine.ts    # テンプレート管理
├── image-generator.ts    # 画像生成API統合
├── example.ts            # 使用例
└── README.md            # このファイル

templates/packages/
├── box-standard.json     # 標準箱型テンプレート
├── pouch-stand.json      # スタンドパウチテンプレート
└── bottle-cylinder.json  # 円筒形ボトルテンプレート
```

## 実装済み機能

### 1. 型定義 (types.ts)

- `PackageTemplate`: テンプレート定義
- `DesignPrompt`: プロンプト構造
- `GeneratedPackageDesign`: 生成結果
- `PackageGenerationOptions`: 生成オプション
- `PackageGenerationResult`: 最終結果

### 2. プロンプト生成 (prompt-builder.ts)

- `buildDesignPrompt()`: 単一プロンプト生成
- `buildMultiplePrompts()`: 複数プロンプト一括生成
- `autoSelectVariations()`: バリエーション自動選択
- カテゴリ別デザイン要素マッピング
- スタイル別キーワード最適化

### 3. テンプレート管理 (template-engine.ts)

- `loadTemplate()`: テンプレート読み込み（キャッシュ付き）
- `loadAllTemplates()`: 全テンプレート読み込み
- `selectTemplateForCategory()`: カテゴリベース選択
- `selectTemplateForShape()`: 形状ベース選択
- `autoSelectTemplate()`: 自動選択

### 4. 画像生成 (image-generator.ts)

- `generateWithOpenAI()`: DALL-E 3統合
- `generateWithStability()`: Stability AI統合
- `generateMultipleImages()`: 並列生成
- `saveImageToFile()`: 画像保存
- `saveMultipleImages()`: 一括保存

### 5. メインロジック (index.ts)

- `generatePackageDesigns()`: メイン生成関数
- `generatePackageDesignsAuto()`: 自動選択版
- `generateWithProgress()`: 進捗監視版
- `generateBatch()`: バッチ処理

## クイックスタート

```typescript
import { analyzeProductImage } from '../image-analyzer';
import { generatePackageDesigns } from './index';

// 1. 商品画像を分析
const analysis = await analyzeProductImage('./product.jpg', {
  apiKey: process.env.ANTHROPIC_API_KEY
});

// 2. デザイン生成
const result = await generatePackageDesigns({
  productAnalysis: analysis,
  templateType: 'box-standard',
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  variationCount: 3,
  brandName: 'MyBrand',
  productName: 'MyProduct'
});

// 3. 結果を確認
console.log(`生成数: ${result.designs.length}`);
result.designs.forEach(design => {
  console.log(`${design.variationType}: ${design.imageUrl}`);
});
```

## テンプレート

### Box Standard (box-standard.json)

- **用途**: 電子機器、日用品、食品
- **形状**: 長方形の箱
- **アスペクト比**: 4:3
- **サイズ**: 1024x768px

### Pouch Stand (pouch-stand.json)

- **用途**: 食品、スナック、調味料
- **形状**: スタンドパウチ
- **アスペクト比**: 3:4
- **サイズ**: 768x1024px

### Bottle Cylinder (bottle-cylinder.json)

- **用途**: 飲料、化粧品、シャンプー
- **形状**: 円筒形ボトル
- **アスペクト比**: 3:4
- **サイズ**: 768x1024px

## デザインバリエーション

### Minimalist (ミニマリスト)

- **特徴**: シンプル、洗練、無駄なし
- **推奨**: 化粧品、電子機器

### Vibrant (ビビッド)

- **特徴**: カラフル、活気、目を引く
- **推奨**: 食品、飲料

### Premium (プレミアム)

- **特徴**: 高級感、品質感、洗練
- **推奨**: 化粧品、高級食品

## API プロバイダー

### OpenAI DALL-E 3

- **モデル**: dall-e-3
- **サイズ**: 1024x1024, 1792x1024, 1024x1792
- **品質**: standard, hd
- **料金**: $0.04-0.12/画像

### Stability AI

- **モデル**: stable-diffusion-xl-1024-v1-0
- **サイズ**: カスタマイズ可能
- **スタイル**: photographic, digital-art, cinematic
- **料金**: 約$0.002-0.01/画像

## パフォーマンス

- **生成時間**: 30-60秒/画像
- **並列処理**: デフォルト2並列
- **タイムアウト**: デフォルト60秒
- **キャッシュ**: テンプレートはメモリキャッシュ

## エラーハンドリング

```typescript
try {
  const result = await generatePackageDesigns(options);
} catch (error) {
  if (error.code === 'TIMEOUT') {
    // タイムアウト処理
  } else if (error.code === 'API_ERROR') {
    // API エラー処理
  }
}
```

## 環境変数

```bash
ANTHROPIC_API_KEY=sk-ant-xxx  # 商品分析用
OPENAI_API_KEY=sk-xxx         # DALL-E 3用
STABILITY_API_KEY=sk-xxx      # Stability AI用
```

## テスト

```bash
# ビルド
npm run build

# サンプル実行（example.tsのコメントアウトを解除）
npm run dev
```

## 今後の拡張予定

- [ ] より多くのテンプレート追加
- [ ] カスタムテンプレート作成機能
- [ ] デザイン編集・微調整機能
- [ ] A/Bテスト機能
- [ ] デザイン評価・スコアリング

## 技術スタック

- TypeScript
- OpenAI API (DALL-E 3)
- Stability AI API
- Node.js Fetch API
- ESM モジュール

## ライセンス

MIT
