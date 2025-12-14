# 商品画像分析エンジン

商品画像を分析し、カテゴリ、カラー、形状、テクスチャを抽出するTypeScript製のエンジンです。

## 機能

- **カテゴリ検出**: Claude APIを使用して商品のカテゴリを推定
- **カラー抽出**: K-meansクラスタリングでカラーパレットを抽出
- **形状分析**: アスペクト比から形状タイプを推定
- **テクスチャ検出**: 表面の質感を分析

## インストール

```bash
npm install @anthropic-ai/sdk sharp
```

## 使用方法

### 基本的な使い方

```typescript
import { analyzeProductImage } from './services/image-analyzer';

const result = await analyzeProductImage('./product.jpg', {
  apiKey: process.env.CLAUDE_API_KEY,
  paletteSize: 5,
  timeout: 30000
});

console.log(result);
// {
//   category: "食品",
//   colors: {
//     primary: "#FF5733",
//     secondary: ["#33FF57", "#3357FF"],
//     palette: ["#FF5733", "#33FF57", "#3357FF", "#F5A623", "#8B572A"]
//   },
//   shape: {
//     type: "cylindrical",
//     dimensions: { width: 60, height: 100 }
//   },
//   texture: "glossy",
//   confidence: 0.89
// }
```

### 個別の分析機能

#### カラーのみを抽出

```typescript
import { analyzeColors } from './services/image-analyzer';

const colors = await analyzeColors('./product.jpg', 5);
console.log(colors.primary); // "#FF5733"
console.log(colors.palette); // ["#FF5733", "#33FF57", ...]
```

#### 形状のみを分析

```typescript
import { analyzeShapeOnly } from './services/image-analyzer';

const shape = await analyzeShapeOnly('./product.jpg');
console.log(shape.type); // "cylindrical"
console.log(shape.dimensions); // { width: 60, height: 100 }
```

#### カテゴリのみを検出

```typescript
import { analyzeCategoryOnly } from './services/image-analyzer';

const category = await analyzeCategoryOnly(
  './product.jpg',
  process.env.CLAUDE_API_KEY
);
console.log(category.category); // "食品"
console.log(category.subcategory); // "飲料"
console.log(category.confidence); // 0.95
```

### バッチ処理

複数の画像を一括で分析できます：

```typescript
import { analyzeBatch } from './services/image-analyzer';

const results = await analyzeBatch(
  ['./product1.jpg', './product2.jpg', './product3.jpg'],
  { apiKey: process.env.CLAUDE_API_KEY },
  2 // 2つずつ並列処理
);

console.log(results.length); // 3
```

## API リファレンス

### `analyzeProductImage(imagePath, options)`

商品画像を総合的に分析します。

**パラメータ:**
- `imagePath`: `string | Buffer` - 画像ファイルのパスまたはBuffer
- `options`: `AnalysisOptions` - 分析オプション
  - `apiKey`: `string` - Claude APIキー（必須）
  - `paletteSize?`: `number` - カラーパレットのサイズ（デフォルト: 5）
  - `timeout?`: `number` - タイムアウト（ミリ秒、デフォルト: 30000）

**戻り値:** `Promise<ProductAnalysis>`

```typescript
interface ProductAnalysis {
  category: string;           // "食品", "化粧品", "電子機器" etc.
  colors: {
    primary: string;          // "#FF5733"
    secondary: string[];
    palette: string[];
  };
  shape: {
    type: string;             // "rectangular", "cylindrical"
    dimensions: { width: number; height: number };
  };
  texture: string;            // "glossy", "matte", "metallic"
  confidence: number;         // 0.0 - 1.0
}
```

### `analyzeColors(imagePath, paletteSize?)`

カラーパレットのみを抽出します。

**パラメータ:**
- `imagePath`: `string | Buffer`
- `paletteSize?`: `number` - デフォルト: 5

**戻り値:** `Promise<{ primary: string; secondary: string[]; palette: string[] }>`

### `analyzeShapeOnly(imagePath)`

形状のみを分析します。

**パラメータ:**
- `imagePath`: `string | Buffer`

**戻り値:** `Promise<{ type: string; dimensions: { width: number; height: number } }>`

### `analyzeCategoryOnly(imagePath, apiKey, timeout?)`

カテゴリのみを検出します。

**パラメータ:**
- `imagePath`: `string | Buffer`
- `apiKey`: `string`
- `timeout?`: `number` - デフォルト: 30000

**戻り値:** `Promise<CategoryDetection>`

### `analyzeBatch(imagePaths, options, concurrency?)`

複数の画像を一括で分析します。

**パラメータ:**
- `imagePaths`: `(string | Buffer)[]`
- `options`: `AnalysisOptions`
- `concurrency?`: `number` - 並列処理数（デフォルト: 3）

**戻り値:** `Promise<ProductAnalysis[]>`

## エラーハンドリング

```typescript
import { analyzeProductImage, ImageAnalysisError } from './services/image-analyzer';

try {
  const result = await analyzeProductImage('./product.jpg', {
    apiKey: process.env.CLAUDE_API_KEY
  });
} catch (error) {
  if (error instanceof ImageAnalysisError) {
    console.error('エラーコード:', error.code);
    console.error('詳細:', error.details);

    switch (error.code) {
      case 'INVALID_IMAGE':
        console.log('画像が不正です');
        break;
      case 'API_ERROR':
        console.log('APIエラーが発生しました');
        break;
      case 'TIMEOUT':
        console.log('タイムアウトしました');
        break;
      case 'NETWORK_ERROR':
        console.log('ネットワークエラーです');
        break;
    }
  }
}
```

## テスト

```bash
npm test
```

## 技術詳細

### カラー抽出アルゴリズム

K-meansクラスタリングを使用してカラーパレットを抽出します：

1. 画像を200x200にリサイズ（高速化）
2. 全ピクセルのRGB値を取得
3. K-meansで指定数のクラスタに分類
4. 出現頻度でソート

### 形状分析

アスペクト比から形状タイプを推定：

- `0.9 - 1.1`: spherical（球形・正方形）
- `0.4 - 0.9`: cylindrical（円筒形・縦長）
- `1.1 - 2.5`: rectangular（長方形・横長）
- その他: irregular（不規則）

### カテゴリ検出

Claude 3.5 Sonnetを使用して画像から以下を抽出：

- カテゴリ（食品、化粧品、電子機器など）
- サブカテゴリ
- 検出された特徴
- 信頼度

## ライセンス

MIT

## 開発者

Issue #4「商品画像分析エンジン」
