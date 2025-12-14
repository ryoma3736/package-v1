# Ad Generator Service

OpenAI DALL-E 3 APIを使用した広告画像自動生成サービス

## 概要

商品分析結果を基に、各種広告プラットフォーム向けの画像を自動生成します。

## 機能

- **複数プラットフォーム対応**: Instagram, Twitter, Facebook, Web Banner
- **AI画像生成**: OpenAI DALL-E 3 APIによる高品質画像生成
- **テキストオーバーレイ**: ヘッドライン、CTAの自動合成
- **レイアウトエンジン**: プラットフォームに最適化されたレイアウト
- **バッチ生成**: 複数プラットフォーム向けに一括生成

## サポートプラットフォーム

| プラットフォーム | サイズ | アスペクト比 |
|-----------------|--------|-------------|
| Instagram Square | 1080x1080 | 1:1 |
| Instagram Story | 1080x1920 | 9:16 |
| Twitter Card | 1200x628 | 1.91:1 |
| Facebook Feed | 1200x630 | 1.91:1 |
| Web Banner Leaderboard | 728x90 | 8.09:1 |
| Web Banner Medium Rectangle | 300x250 | 1.2:1 |

## インストール

```bash
npm install openai sharp canvas
```

## 環境変数

```bash
OPENAI_API_KEY=your_openai_api_key
```

## 使用例

### 単一広告生成

```typescript
import { AdGeneratorService } from './services/ad-generator/index.js';
import type { ProductAnalysis } from './services/ad-generator/types.js';

const service = new AdGeneratorService();

const productAnalysis: ProductAnalysis = {
  primaryColor: '#FF5733',
  secondaryColors: ['#FFC300', '#DAF7A6'],
  colorPalette: [
    { color: '#FF5733', percentage: 40 },
    { color: '#FFC300', percentage: 30 },
    { color: '#DAF7A6', percentage: 30 },
  ],
  suggestedKeywords: ['modern', 'vibrant', 'premium'],
  category: 'electronics',
};

const result = await service.generateAd({
  productAnalysis,
  platform: 'instagram-square',
  headline: 'Premium Sound Quality',
  description: 'Experience music like never before',
  callToAction: 'Shop Now',
  brandName: 'AudioTech',
  style: 'vibrant',
});

console.log('Generated ad:', result.platform);
console.log('Image URL:', result.imageUrl);

// 画像を保存
import { writeFile } from 'fs/promises';
await writeFile(`ad-${result.platform}.png`, result.imageBuffer);
```

### バッチ生成

```typescript
const batchResult = await service.generateBatch({
  productAnalysis,
  platforms: ['instagram-square', 'twitter-card', 'facebook-feed'],
  commonConfig: {
    headline: 'Transform Your Workflow',
    description: 'Powerful tools for modern teams',
    callToAction: 'Start Free Trial',
    brandName: 'ProductivityPro',
    style: 'realistic',
  },
});

console.log(`Generated: ${batchResult.totalGenerated}`);
console.log(`Failed: ${batchResult.totalFailed}`);

for (const result of batchResult.results) {
  await writeFile(`batch-${result.platform}.png`, result.imageBuffer);
}
```

### カスタムレイアウト

```typescript
const result = await service.generateAd({
  productAnalysis,
  platform: 'instagram-square',
  headline: 'New Collection',
  layoutConfig: {
    template: 'overlay',
    backgroundColor: '#000000',
  },
  style: 'artistic',
});
```

## API

### AdGeneratorService

#### constructor(apiKey?: string)

サービスのインスタンスを作成します。

- `apiKey`: OpenAI APIキー（省略時は環境変数から取得）

#### generateAd(request: AdGenerationRequest): Promise<AdGenerationResult>

単一の広告画像を生成します。

**パラメータ:**
- `productAnalysis`: 商品分析結果
- `platform`: ターゲットプラットフォーム
- `headline`: ヘッドライン（オプション）
- `description`: 説明文（オプション）
- `callToAction`: CTA（オプション）
- `brandName`: ブランド名（オプション）
- `layoutConfig`: レイアウト設定（オプション）
- `style`: スタイル - 'realistic' | 'artistic' | 'minimalist' | 'vibrant'

**戻り値:**
```typescript
{
  platform: AdPlatform;
  imageUrl: string;
  imageBuffer: Buffer;
  size: ImageSize;
  prompt: string;
  metadata: {
    generatedAt: string;
    model: string;
    revisedPrompt?: string;
  };
}
```

#### generateBatch(request: BatchAdGenerationRequest): Promise<BatchAdGenerationResult>

複数プラットフォーム向けに一括生成します。

**パラメータ:**
- `productAnalysis`: 商品分析結果
- `platforms`: ターゲットプラットフォームの配列
- `commonConfig`: 共通設定
  - `headline`: ヘッドライン
  - `description`: 説明文
  - `callToAction`: CTA
  - `brandName`: ブランド名
  - `style`: スタイル

**戻り値:**
```typescript
{
  results: AdGenerationResult[];
  errors: Array<{ platform: AdPlatform; error: string }>;
  totalGenerated: number;
  totalFailed: number;
}
```

## レイアウトテンプレート

### simple
画像のリサイズと余白追加

```typescript
layoutConfig: {
  template: 'simple',
  padding: 40,
  backgroundColor: '#FFFFFF',
}
```

### overlay
グラデーションオーバーレイ

```typescript
layoutConfig: {
  template: 'overlay',
  backgroundColor: '#000000',
}
```

### split
左右分割レイアウト

```typescript
layoutConfig: {
  template: 'split',
  padding: 30,
  backgroundColor: '#F5F5F5',
}
```

### grid
グリッドレイアウト

```typescript
layoutConfig: {
  template: 'grid',
  padding: 20,
  backgroundColor: '#FAFAFA',
}
```

## テキストオーバーレイプリセット

```typescript
import { TEXT_OVERLAY_PRESETS } from './text-overlay.js';

// 利用可能なプリセット
TEXT_OVERLAY_PRESETS.headline     // 大見出し用
TEXT_OVERLAY_PRESETS.subheadline  // 小見出し用
TEXT_OVERLAY_PRESETS.callToAction // CTA用
TEXT_OVERLAY_PRESETS.caption      // キャプション用
```

## エラーハンドリング

```typescript
import { AdGenerationError } from './types.js';

try {
  const result = await service.generateAd(request);
} catch (error) {
  if (error instanceof AdGenerationError) {
    console.error('Error code:', error.code);
    console.error('Platform:', error.platform);
    console.error('Message:', error.message);
  }
}
```

### エラーコード

- `API_ERROR`: OpenAI APIエラー（レート制限、クォータ超過等）
- `VALIDATION_ERROR`: 入力バリデーションエラー
- `PROCESSING_ERROR`: 画像処理エラー
- `NETWORK_ERROR`: ネットワークエラー

## プラットフォーム設定

```typescript
import { getPlatformConfig, getAllPlatforms } from './platform-configs.js';

// 特定プラットフォームの設定取得
const config = getPlatformConfig('instagram-square');
console.log(config.size.width);  // 1080

// 全プラットフォーム一覧
const platforms = getAllPlatforms();
```

## サンプル実行

```bash
# サンプルコードを実行
tsx src/services/ad-generator/example.ts single

# バッチ生成サンプル
tsx src/services/ad-generator/example.ts batch
```

## テンプレート

事前定義されたテンプレートが `templates/ads/` に用意されています。

- `instagram-square.json`
- `twitter-card.json`
- `facebook-feed.json`
- `web-banner-leaderboard.json`

## 技術スタック

- **OpenAI DALL-E 3**: AI画像生成
- **Sharp**: 画像処理・リサイズ
- **Canvas**: テキストレンダリング
- **TypeScript**: 型安全な開発

## ライセンス

MIT
