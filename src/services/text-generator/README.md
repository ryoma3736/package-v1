# ECテキスト生成エンジン

商品分析結果を基に、ECサイト用のテキストコンテンツを自動生成するモジュールです。

## 機能

- **商品説明文生成**: 長文・短文・箇条書き形式の商品説明を自動生成
- **キャッチコピー生成**: 心に響くキャッチコピーと代替案を複数生成
- **SEO最適化**: 検索エンジン最適化されたタイトル、ディスクリプション、キーワードを生成
- **商品特徴抽出**: 箇条書きポイントから構造化された商品特徴を抽出
- **バッチ処理**: 複数商品のテキストを並列生成

## インストール

```bash
npm install @anthropic-ai/sdk
```

## 基本的な使い方

### 1. 総合的なテキスト生成

```typescript
import { generateProductTexts } from './services/text-generator';

const texts = await generateProductTexts({
  apiKey: process.env.CLAUDE_API_KEY,
  productInfo: {
    name: 'オーガニックコーヒー豆',
    brand: 'エシカルコーヒー',
    price: 1680,
    category: '食品・飲料',
    targetAudience: '健康志向の30-50代',
    details: 'エチオピア産の高品質なアラビカ種を使用。'
  },
  tone: 'professional',
  language: 'ja'
});

console.log(texts.description.short);  // 短文説明
console.log(texts.catchcopy.main);     // メインキャッチコピー
console.log(texts.seo.title);          // SEOタイトル
```

### 2. 画像分析結果と組み合わせる

```typescript
import { analyzeProductImage } from '../image-analyzer';
import { generateProductTexts } from './index';

// まず画像を分析
const analysis = await analyzeProductImage('./product.jpg', {
  apiKey: process.env.CLAUDE_API_KEY
});

// 分析結果を使ってテキスト生成
const texts = await generateProductTexts({
  apiKey: process.env.CLAUDE_API_KEY,
  productAnalysis: analysis,  // 画像分析結果を渡す
  productInfo: {
    name: '商品名',
    price: 1980
  }
});
```

### 3. 個別のテキスト生成

```typescript
// 商品説明のみ
const description = await generateDescriptionOnly({
  apiKey: process.env.CLAUDE_API_KEY,
  productInfo: { name: '商品名' }
});

// キャッチコピーのみ
const catchcopy = await generateCatchcopyOnly({
  apiKey: process.env.CLAUDE_API_KEY,
  productInfo: { name: '商品名' }
});

// SEO最適化テキストのみ
const seo = await generateSEOOnly({
  apiKey: process.env.CLAUDE_API_KEY,
  productInfo: { name: '商品名' }
});
```

### 4. バッチ処理

```typescript
const products = [
  { apiKey, productInfo: product1 },
  { apiKey, productInfo: product2 },
  { apiKey, productInfo: product3 },
];

const results = await generateBatch(products, 2); // 2件ずつ並列処理
```

## 出力形式

```typescript
interface GeneratedTexts {
  description: {
    long: string;           // 500-1000文字の詳細説明
    short: string;          // 100-200文字の簡潔な説明
    bullet_points: string[]; // 箇条書きポイント（3-5個）
  };
  catchcopy: {
    main: string;           // メインキャッチコピー
    sub: string;            // サブコピー
    variations: string[];   // 代替案（3-5個）
  };
  seo: {
    title: string;          // SEOタイトル（60文字以内）
    description: string;    // メタディスクリプション（160文字以内）
    keywords: string[];     // キーワード（5-10個）
  };
  features: {
    name: string;           // 特徴名
    value: string;          // 特徴値
  }[];
}
```

## オプション設定

### トーン設定

```typescript
const options = {
  tone: 'professional',  // プロフェッショナル（デフォルト）
  // tone: 'casual',     // カジュアル
  // tone: 'luxury',     // 高級感
  // tone: 'friendly',   // フレンドリー
};
```

### 言語設定

```typescript
const options = {
  language: 'ja',  // 日本語（デフォルト）
  // language: 'en',  // 英語
};
```

### 詳細オプション

```typescript
const options = {
  apiKey: 'your-api-key',
  timeout: 30000,        // タイムアウト（ミリ秒）
  temperature: 0.7,      // 生成の創造性（0.0-1.0）
};
```

## 品質チェック

生成されたテキストは自動的に品質チェックされます。

```typescript
import { validateDescriptionLength, validateCatchcopyQuality, validateSEOQuality } from './index';

// 説明文の検証
const descValidation = validateDescriptionLength(texts.description);
console.log(descValidation.warnings);

// キャッチコピーの検証
const catchValidation = validateCatchcopyQuality(texts.catchcopy);
console.log(catchValidation.warnings);

// SEOの検証
const seoValidation = validateSEOQuality(texts.seo);
console.log(seoValidation.score);  // 0-100のスコア
```

## 実行例

```bash
# 基本的な使用例を実行
npm run dev -- src/services/text-generator/example.ts

# または直接実行
npx tsx src/services/text-generator/example.ts
```

## API仕様

### generateProductTexts(options)

総合的な商品テキストを生成します。

**パラメータ:**
- `options.apiKey` (string, 必須): Claude APIキー
- `options.productInfo` (object, オプション): 商品情報
  - `name` (string): 商品名
  - `brand` (string): ブランド名
  - `price` (number): 価格
  - `category` (string): カテゴリ
  - `targetAudience` (string): ターゲット層
  - `details` (string): 詳細説明
- `options.productAnalysis` (ProductAnalysis, オプション): 画像分析結果
- `options.tone` (string, デフォルト: 'professional'): トーン
- `options.language` (string, デフォルト: 'ja'): 言語
- `options.timeout` (number, デフォルト: 30000): タイムアウト
- `options.temperature` (number, デフォルト: 0.7): 温度設定

**戻り値:** `Promise<GeneratedTexts>`

### generateDescriptionOnly(options)

商品説明のみを生成します。

**戻り値:** `Promise<DescriptionResult>`

### generateCatchcopyOnly(options)

キャッチコピーのみを生成します。

**戻り値:** `Promise<CatchcopyResult>`

### generateSEOOnly(options)

SEO最適化テキストのみを生成します。

**戻り値:** `Promise<SEOResult>`

### generateBatch(optionsList, concurrency)

複数商品のテキストを並列生成します。

**パラメータ:**
- `optionsList` (TextGenerationOptions[]): 生成オプションの配列
- `concurrency` (number, デフォルト: 3): 並列処理数

**戻り値:** `Promise<GeneratedTexts[]>`

## エラーハンドリング

```typescript
try {
  const texts = await generateProductTexts(options);
} catch (error) {
  if (error.name === 'TextGenerationError') {
    console.error('生成エラー:', error.message);
    console.error('エラーコード:', error.code);
  }
}
```

**エラーコード:**
- `INVALID_INPUT`: 入力が不正
- `API_ERROR`: API呼び出しエラー
- `NETWORK_ERROR`: ネットワークエラー
- `TIMEOUT`: タイムアウト
- `UNKNOWN`: 不明なエラー

## パフォーマンス

- **並列処理**: 説明文、キャッチコピー、SEOテキストを並列生成
- **バッチ処理**: 複数商品を効率的に処理
- **平均生成時間**: 約10-15秒/商品（3つのテキストを並列生成）

## ベストプラクティス

1. **商品情報を充実させる**: `productInfo`に詳細な情報を提供すると、より精度の高いテキストが生成されます

2. **画像分析と組み合わせる**: `productAnalysis`を渡すことで、視覚情報を活かしたテキストが生成されます

3. **適切なトーンを選択**: ターゲット層やブランドイメージに合わせてトーンを選択しましょう

4. **バッチ処理を活用**: 複数商品がある場合は、`generateBatch`で効率的に処理できます

5. **品質チェックを実施**: 生成後は品質チェック関数で検証しましょう

## 制限事項

- Claude API利用量の制限に注意してください
- 生成されたテキストは必ずレビューしてから使用してください
- 法的・倫理的な問題がないか確認してください

## トラブルシューティング

### APIキーエラー

```bash
export CLAUDE_API_KEY="your-api-key-here"
```

### タイムアウトエラー

```typescript
const texts = await generateProductTexts({
  ...options,
  timeout: 60000  // タイムアウトを延長
});
```

### 品質が低い場合

```typescript
const texts = await generateProductTexts({
  ...options,
  productInfo: {
    // より詳細な情報を提供
    name: '商品名',
    details: '詳細な説明を追加...',
    targetAudience: '具体的なターゲット層...'
  }
});
```

## ライセンス

MIT

## 関連モジュール

- [image-analyzer](../image-analyzer/README.md) - 商品画像分析エンジン
