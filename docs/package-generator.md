# パッケージデザイン生成サービス

商品分析結果を基に、AIを使って複数のパッケージデザインバリエーションを自動生成するサービスです。

## 機能概要

- **AI画像生成**: OpenAI DALL-E 3 および Stability AI に対応
- **テンプレートシステム**: 3種類の標準パッケージテンプレート
- **自動バリエーション**: ミニマリスト、ビビッド、プレミアムの3スタイル
- **プロンプト最適化**: 商品カテゴリとカラー情報に基づく高度なプロンプト生成
- **バッチ処理**: 複数商品の一括デザイン生成
- **進捗監視**: リアルタイム進捗コールバック

## インストール

```bash
npm install
```

## 環境変数の設定

`.env` ファイルを作成し、以下のAPIキーを設定してください：

```bash
# 商品画像分析用 (Claude API)
ANTHROPIC_API_KEY=sk-ant-your_key_here

# 画像生成用 (OpenAI DALL-E 3)
OPENAI_API_KEY=sk-your_openai_key_here

# 画像生成用 (Stability AI - オプション)
STABILITY_API_KEY=sk-your_stability_key_here
```

### APIキーの取得

- **Anthropic Claude API**: https://console.anthropic.com/
- **OpenAI API**: https://platform.openai.com/api-keys
- **Stability AI API**: https://platform.stability.ai/account/keys

## 基本的な使い方

### 1. 商品画像の分析とデザイン生成

```typescript
import { analyzeProductImage } from './services/image-analyzer';
import { generatePackageDesigns } from './services/package-generator';

// 商品画像を分析
const analysis = await analyzeProductImage('./product.jpg', {
  apiKey: process.env.ANTHROPIC_API_KEY
});

// パッケージデザインを生成
const result = await generatePackageDesigns({
  productAnalysis: analysis,
  templateType: 'box-standard',
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  variationCount: 3,
  brandName: 'Natural Co.',
  productName: 'Organic Green Tea'
});

console.log(`${result.designs.length}個のデザインを生成しました`);
```

### 2. 自動テンプレート選択

テンプレートとバリエーションを自動で選択:

```typescript
import { generatePackageDesignsAuto } from './services/package-generator';

const result = await generatePackageDesignsAuto(
  analysis,
  'openai',
  process.env.OPENAI_API_KEY,
  {
    brandName: 'MyBrand',
    variationCount: 3
  }
);
```

### 3. 進捗監視付き生成

```typescript
import { generateWithProgress } from './services/package-generator';

const result = await generateWithProgress(
  {
    productAnalysis: analysis,
    templateType: 'bottle-cylinder',
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    variationCount: 3
  },
  (progress) => {
    console.log(`進捗: ${progress.current}/${progress.total}`);
    if (progress.design) {
      console.log(`✅ ${progress.design.variationType} 完了`);
    }
  }
);
```

### 4. 画像の保存

```typescript
import { saveMultipleImages } from './services/package-generator';

const savedPaths = await saveMultipleImages(
  result.designs,
  './output/designs',
  'package'
);

console.log('保存されたファイル:', savedPaths);
```

## テンプレート

### 利用可能なテンプレート

| テンプレート | タイプ | 推奨カテゴリ | アスペクト比 |
|------------|--------|------------|------------|
| Standard Box | `box-standard` | 電子機器、日用品、食品 | 4:3 |
| Stand Pouch | `pouch-stand` | 食品、スナック、調味料 | 3:4 |
| Cylindrical Bottle | `bottle-cylinder` | 飲料、化粧品、シャンプー | 3:4 |

### テンプレートの自動選択

商品カテゴリと形状に基づいて最適なテンプレートを自動選択:

```typescript
import { autoSelectTemplate } from './services/package-generator';

const templateType = autoSelectTemplate(
  '飲料',      // カテゴリ
  'cylindrical' // 形状
);
// => 'bottle-cylinder'
```

## デザインバリエーション

### 利用可能なスタイル

| スタイル | 説明 | キーワード |
|---------|------|-----------|
| `minimalist` | シンプルで洗練された無駄のないデザイン | clean, simple, minimal, modern |
| `vibrant` | 色鮮やかで活気のある目を引くデザイン | colorful, vibrant, energetic, bold |
| `premium` | 高級感のある品質を感じさせるデザイン | luxury, premium, sophisticated, elegant |

### バリエーションの自動選択

```typescript
import { autoSelectVariations } from './services/package-generator';

const variations = autoSelectVariations(analysis, 3);
// => ['minimalist', 'vibrant', 'premium']
```

## 画像生成プロバイダー

### OpenAI DALL-E 3

```typescript
const result = await generatePackageDesigns({
  productAnalysis: analysis,
  templateType: 'box-standard',
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  size: '1024x1024',      // または '1792x1024', '1024x1792'
  quality: 'hd',          // または 'standard'
  variationCount: 3
});
```

### Stability AI

```typescript
const result = await generatePackageDesigns({
  productAnalysis: analysis,
  templateType: 'bottle-cylinder',
  provider: 'stability',
  apiKey: process.env.STABILITY_API_KEY,
  style: 'photographic',  // または 'digital-art', 'cinematic'
  width: 1024,
  height: 1024,
  variationCount: 2
});
```

## 高度な使い方

### カスタムプロンプト要件

```typescript
const result = await generatePackageDesigns({
  productAnalysis: analysis,
  templateType: 'box-standard',
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  variationTypes: ['minimalist', 'premium'],
  brandName: 'EcoTech',
  productName: 'Smart Device',
  additionalRequirements: `
    - Include sustainability messaging
    - Emphasize eco-friendly materials
    - Use recycled paper texture
    - Add certification badges (FSC, Carbon Neutral)
  `
});
```

### バッチ処理

複数の商品分析から一括でデザインを生成:

```typescript
import { generateBatch } from './services/package-generator';

const analyses = [analysis1, analysis2, analysis3];

const results = await generateBatch(
  analyses,
  'openai',
  process.env.OPENAI_API_KEY,
  { variationCount: 2 }
);
```

## API リファレンス

### `generatePackageDesigns(options)`

パッケージデザインを生成します。

**パラメータ:**

```typescript
interface PackageGenerationOptions {
  productAnalysis: ProductAnalysis;     // 商品分析結果（必須）
  templateType: PackageTemplateType;    // テンプレート種類（必須）
  provider: 'openai' | 'stability';     // 画像生成プロバイダー（必須）
  apiKey: string;                       // APIキー（必須）
  variationCount?: number;              // バリエーション数（デフォルト: 3）
  variationTypes?: DesignVariationType[]; // バリエーション種類
  brandName?: string;                   // ブランド名
  productName?: string;                 // 製品名
  additionalRequirements?: string;      // 追加要件
  size?: '1024x1024' | '1792x1024' | '1024x1792'; // 画像サイズ（OpenAI）
  quality?: 'standard' | 'hd';          // 画質（OpenAI）
  style?: 'photographic' | 'digital-art' | 'cinematic'; // スタイル（Stability）
  timeout?: number;                     // タイムアウト（ミリ秒）
}
```

**戻り値:**

```typescript
interface PackageGenerationResult {
  success: boolean;
  designs: GeneratedPackageDesign[];
  template: PackageTemplate;
  productAnalysis: ProductAnalysis;
  errors?: GenerationError[];
  stats: {
    totalGenerated: number;
    successCount: number;
    failureCount: number;
    totalTime: number;
  };
}
```

### `generatePackageDesignsAuto(productAnalysis, provider, apiKey, options?)`

テンプレートとバリエーションを自動選択してデザインを生成します。

### `generateWithProgress(options, onProgress?)`

進捗コールバック付きでデザインを生成します。

### `saveMultipleImages(designs, outputDir, filePrefix?)`

生成された画像を一括保存します。

## エラーハンドリング

```typescript
import { PackageGenerationError } from './services/package-generator';

try {
  const result = await generatePackageDesigns(options);
} catch (error) {
  if (error instanceof PackageGenerationError) {
    console.error('エラーコード:', error.code);
    console.error('メッセージ:', error.message);
    console.error('詳細:', error.details);
  }
}
```

### エラーコード

- `INVALID_INPUT`: 入力パラメータが不正
- `API_ERROR`: API呼び出しエラー
- `NETWORK_ERROR`: ネットワークエラー
- `TIMEOUT`: タイムアウト
- `UNKNOWN`: 不明なエラー

## パフォーマンス

- **生成時間**: 1デザインあたり約30-60秒
- **同時実行数**: デフォルト2（レート制限対策）
- **タイムアウト**: デフォルト60秒

## 料金

### OpenAI DALL-E 3

- Standard quality (1024x1024): $0.040/画像
- HD quality (1024x1024): $0.080/画像
- HD quality (1024x1792 or 1792x1024): $0.120/画像

### Stability AI

- 1024x1024: 約$0.002-0.01/画像（プランによる）

## トラブルシューティング

### API Rate Limit エラー

```typescript
// 同時実行数を減らす
const result = await generateMultipleImages(
  prompts,
  provider,
  apiKey,
  options,
  1 // 同時実行数を1に
);
```

### タイムアウトエラー

```typescript
// タイムアウトを延長
const result = await generatePackageDesigns({
  ...options,
  timeout: 120000 // 120秒
});
```

## サンプルコード

詳細な使用例は `src/services/package-generator/example.ts` を参照してください。

## ライセンス

MIT

## サポート

問題が発生した場合は、GitHubのIssueで報告してください。
