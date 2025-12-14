/**
 * 商品画像分析エンジン - メインエントリ
 *
 * 商品画像を総合的に分析し、カテゴリ、カラー、形状、テクスチャを抽出します。
 *
 * @example
 * ```typescript
 * import { analyzeProductImage } from './services/image-analyzer';
 *
 * const result = await analyzeProductImage('./product.jpg', {
 *   apiKey: 'your-claude-api-key'
 * });
 *
 * console.log(result.category);  // "食品"
 * console.log(result.colors.primary);  // "#FF5733"
 * console.log(result.shape.type);  // "cylindrical"
 * ```
 */

import {
  ProductAnalysis,
  AnalysisOptions,
  ImageAnalysisError,
} from './types.js';
import { extractColors, formatColors } from './color-extractor.js';
import { analyzeShape, formatShape } from './shape-analyzer.js';
import { detectCategory, detectTexture } from './category-detector.js';

/**
 * 商品画像を総合的に分析
 *
 * @param imagePath 画像ファイルのパスまたはBuffer
 * @param options 分析オプション
 * @returns 商品分析結果
 * @throws {ImageAnalysisError} 分析に失敗した場合
 *
 * @example
 * ```typescript
 * const analysis = await analyzeProductImage('./bottle.jpg', {
 *   apiKey: process.env.CLAUDE_API_KEY,
 *   paletteSize: 5,
 *   timeout: 30000
 * });
 * ```
 */
export async function analyzeProductImage(
  imagePath: string | Buffer,
  options: AnalysisOptions
): Promise<ProductAnalysis> {
  const {
    apiKey,
    paletteSize = 5,
    timeout = 30000,
  } = options;

  if (!apiKey) {
    throw new ImageAnalysisError(
      'Claude APIキーが指定されていません',
      'API_ERROR',
      { reason: 'Missing API key' }
    );
  }

  try {
    // 並列処理で各分析を実行（高速化）
    const [colorInfo, shapeInfo, categoryInfo, textureInfo] = await Promise.all([
      extractColors(imagePath, paletteSize),
      analyzeShape(imagePath),
      detectCategory(imagePath, apiKey, timeout),
      detectTexture(imagePath, apiKey, timeout),
    ]);

    // カラー情報を整形
    const colors = formatColors(colorInfo);

    // 形状情報を整形
    const shape = formatShape(shapeInfo);

    // 総合的な信頼度を計算（各要素の信頼度の加重平均）
    const overallConfidence =
      (categoryInfo.confidence * 0.4 + // カテゴリの信頼度: 40%
        shapeInfo.confidence * 0.3 + // 形状の信頼度: 30%
        textureInfo.confidence * 0.3) / // テクスチャの信頼度: 30%
      1.0;

    const result: ProductAnalysis = {
      category: categoryInfo.category,
      colors,
      shape,
      texture: textureInfo.type,
      confidence: Math.round(overallConfidence * 100) / 100,
    };

    return result;
  } catch (error) {
    if (error instanceof ImageAnalysisError) {
      throw error;
    }

    throw new ImageAnalysisError(
      '商品画像の分析中にエラーが発生しました',
      'UNKNOWN',
      error
    );
  }
}

/**
 * 個別のカラー分析のみを実行
 *
 * @param imagePath 画像ファイルのパスまたはBuffer
 * @param paletteSize パレットのサイズ（デフォルト: 5）
 * @returns カラー情報
 */
export async function analyzeColors(
  imagePath: string | Buffer,
  paletteSize: number = 5
) {
  const colorInfo = await extractColors(imagePath, paletteSize);
  return formatColors(colorInfo);
}

/**
 * 個別の形状分析のみを実行
 *
 * @param imagePath 画像ファイルのパスまたはBuffer
 * @returns 形状情報
 */
export async function analyzeShapeOnly(imagePath: string | Buffer) {
  const shapeInfo = await analyzeShape(imagePath);
  return formatShape(shapeInfo);
}

/**
 * 個別のカテゴリ検出のみを実行
 *
 * @param imagePath 画像ファイルのパスまたはBuffer
 * @param apiKey Claude APIキー
 * @param timeout タイムアウト（ミリ秒）
 * @returns カテゴリ情報
 */
export async function analyzeCategoryOnly(
  imagePath: string | Buffer,
  apiKey: string,
  timeout: number = 30000
) {
  return await detectCategory(imagePath, apiKey, timeout);
}

/**
 * バッチ処理: 複数の画像を一括で分析
 *
 * @param imagePaths 画像ファイルのパスまたはBufferの配列
 * @param options 分析オプション
 * @param concurrency 並列処理数（デフォルト: 3）
 * @returns 商品分析結果の配列
 *
 * @example
 * ```typescript
 * const results = await analyzeBatch(
 *   ['./product1.jpg', './product2.jpg', './product3.jpg'],
 *   { apiKey: process.env.CLAUDE_API_KEY },
 *   2 // 2つずつ並列処理
 * );
 * ```
 */
export async function analyzeBatch(
  imagePaths: (string | Buffer)[],
  options: AnalysisOptions,
  concurrency: number = 3
): Promise<ProductAnalysis[]> {
  const results: ProductAnalysis[] = [];
  const errors: { index: number; error: Error }[] = [];

  // 並列処理のためのチャンク分割
  for (let i = 0; i < imagePaths.length; i += concurrency) {
    const chunk = imagePaths.slice(i, i + concurrency);
    const chunkResults = await Promise.allSettled(
      chunk.map((path, idx) =>
        analyzeProductImage(path, options).catch((error) => {
          errors.push({ index: i + idx, error });
          throw error;
        })
      )
    );

    for (const result of chunkResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }
  }

  // エラーがある場合は警告を出力
  if (errors.length > 0) {
    console.warn(
      `${errors.length}件の画像の分析に失敗しました:`,
      errors
    );
  }

  return results;
}

// 型定義とエラークラスを再エクスポート
export * from './types.js';
export { extractColors } from './color-extractor.js';
export { analyzeShape, detectEdges } from './shape-analyzer.js';
export { detectCategory, detectTexture } from './category-detector.js';
