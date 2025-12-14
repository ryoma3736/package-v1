/**
 * ECテキスト生成エンジン - メインエントリ
 *
 * 商品分析結果を基に、ECサイト用のテキストコンテンツを自動生成します。
 *
 * @example
 * ```typescript
 * import { generateProductTexts } from './services/text-generator';
 *
 * const texts = await generateProductTexts({
 *   apiKey: 'your-claude-api-key',
 *   productInfo: {
 *     name: 'オーガニックコーヒー',
 *     brand: 'CoffeeLab',
 *     price: 1980,
 *     category: '食品',
 *     targetAudience: 'コーヒー好きの30-40代',
 *   }
 * });
 *
 * console.log(texts.description.short);
 * console.log(texts.catchcopy.main);
 * console.log(texts.seo.title);
 * ```
 */

import type {
  GeneratedTexts,
  TextGenerationOptions,
  PromptContext,
  TextGenerationError,
} from './types.js';
import {
  generateDescription,
  validateDescriptionLength,
  type DescriptionResult,
} from './description-writer.js';
import {
  generateCatchcopy,
  validateCatchcopyQuality,
  type CatchcopyResult,
} from './catchcopy-creator.js';
import {
  generateSEO,
  validateSEOQuality,
  calculateSEOScore,
  type SEOResult,
} from './seo-optimizer.js';

/**
 * 商品テキストを総合的に生成
 *
 * @param options テキスト生成オプション
 * @returns 生成されたテキストコンテンツ
 * @throws {TextGenerationError} 生成に失敗した場合
 *
 * @example
 * ```typescript
 * const texts = await generateProductTexts({
 *   apiKey: process.env.CLAUDE_API_KEY,
 *   productInfo: {
 *     name: '有機栽培コーヒー豆',
 *     brand: 'エシカルコーヒー',
 *     price: 1680,
 *     category: '食品・飲料',
 *     targetAudience: '健康志向の30-50代',
 *     details: 'エチオピア産の高品質なアラビカ種を使用。フェアトレード認証済み。'
 *   },
 *   tone: 'professional',
 *   language: 'ja'
 * });
 * ```
 */
export async function generateProductTexts(
  options: TextGenerationOptions
): Promise<GeneratedTexts> {
  const {
    apiKey,
    productAnalysis,
    productInfo,
    tone = 'professional',
    language = 'ja',
    timeout = 30000,
    temperature = 0.7,
  } = options;

  if (!apiKey) {
    const error: Partial<TextGenerationError> = new Error(
      'Claude APIキーが指定されていません'
    );
    error.name = 'TextGenerationError';
    throw error;
  }

  // プロンプトコンテキストを構築
  const context: PromptContext = {
    analysis: productAnalysis,
    productInfo,
    tone,
    language,
  };

  try {
    // 並列処理で各テキスト生成を実行（高速化）
    const [descriptionResult, catchcopyResult, seoResult] = await Promise.all([
      generateDescription(context, apiKey, {}, timeout, temperature),
      generateCatchcopy(context, apiKey, {}, timeout, temperature * 1.1), // キャッチコピーは少し創造的に
      generateSEO(context, apiKey, {}, timeout, temperature * 0.7), // SEOは正確に
    ]);

    // 商品特徴を抽出（商品説明の箇条書きから）
    const features = extractFeatures(descriptionResult);

    const result: GeneratedTexts = {
      description: descriptionResult,
      catchcopy: catchcopyResult,
      seo: seoResult,
      features,
    };

    // 品質チェック（警告のみ、エラーは出さない）
    performQualityCheck(result);

    return result;
  } catch (error) {
    if (error instanceof Error && error.name === 'TextGenerationError') {
      throw error;
    }

    const unknownError: Partial<TextGenerationError> = new Error(
      'テキスト生成中にエラーが発生しました'
    );
    unknownError.name = 'TextGenerationError';
    throw unknownError;
  }
}

/**
 * 商品説明のみを生成
 *
 * @param options テキスト生成オプション
 * @returns 商品説明
 */
export async function generateDescriptionOnly(
  options: TextGenerationOptions
): Promise<DescriptionResult> {
  const {
    apiKey,
    productAnalysis,
    productInfo,
    tone = 'professional',
    language = 'ja',
    timeout = 30000,
    temperature = 0.7,
  } = options;

  const context: PromptContext = {
    analysis: productAnalysis,
    productInfo,
    tone,
    language,
  };

  return await generateDescription(context, apiKey, {}, timeout, temperature);
}

/**
 * キャッチコピーのみを生成
 *
 * @param options テキスト生成オプション
 * @returns キャッチコピー
 */
export async function generateCatchcopyOnly(
  options: TextGenerationOptions
): Promise<CatchcopyResult> {
  const {
    apiKey,
    productAnalysis,
    productInfo,
    tone = 'professional',
    language = 'ja',
    timeout = 30000,
    temperature = 0.8,
  } = options;

  const context: PromptContext = {
    analysis: productAnalysis,
    productInfo,
    tone,
    language,
  };

  return await generateCatchcopy(context, apiKey, {}, timeout, temperature);
}

/**
 * SEO最適化テキストのみを生成
 *
 * @param options テキスト生成オプション
 * @returns SEO最適化テキスト
 */
export async function generateSEOOnly(
  options: TextGenerationOptions
): Promise<SEOResult> {
  const {
    apiKey,
    productAnalysis,
    productInfo,
    tone = 'professional',
    language = 'ja',
    timeout = 30000,
    temperature = 0.5,
  } = options;

  const context: PromptContext = {
    analysis: productAnalysis,
    productInfo,
    tone,
    language,
  };

  return await generateSEO(context, apiKey, {}, timeout, temperature);
}

/**
 * バッチ処理: 複数の商品テキストを一括生成
 *
 * @param optionsList テキスト生成オプションの配列
 * @param concurrency 並列処理数（デフォルト: 3）
 * @returns 生成されたテキストの配列
 *
 * @example
 * ```typescript
 * const results = await generateBatch([
 *   { apiKey, productInfo: product1 },
 *   { apiKey, productInfo: product2 },
 *   { apiKey, productInfo: product3 },
 * ], 2);
 * ```
 */
export async function generateBatch(
  optionsList: TextGenerationOptions[],
  concurrency: number = 3
): Promise<GeneratedTexts[]> {
  const results: GeneratedTexts[] = [];
  const errors: { index: number; error: Error }[] = [];

  // 並列処理のためのチャンク分割
  for (let i = 0; i < optionsList.length; i += concurrency) {
    const chunk = optionsList.slice(i, i + concurrency);
    const chunkResults = await Promise.allSettled(
      chunk.map((opts, idx) =>
        generateProductTexts(opts).catch((error) => {
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
      `${errors.length}件の商品テキスト生成に失敗しました:`,
      errors
    );
  }

  return results;
}

/**
 * 箇条書きポイントから商品特徴を抽出
 */
function extractFeatures(
  description: DescriptionResult
): GeneratedTexts['features'] {
  return description.bullet_points.map((point, index) => {
    // 箇条書きポイントを「名前: 値」形式に分割
    const colonIndex = point.indexOf('：') || point.indexOf(':');
    if (colonIndex > 0) {
      return {
        name: point.substring(0, colonIndex).trim(),
        value: point.substring(colonIndex + 1).trim(),
      };
    }

    // コロンがない場合は、そのまま特徴として扱う
    return {
      name: `特徴${index + 1}`,
      value: point.trim(),
    };
  });
}

/**
 * 品質チェックを実行（警告を出力）
 */
function performQualityCheck(result: GeneratedTexts): void {
  // 説明文の品質チェック
  const descValidation = validateDescriptionLength(result.description);
  if (!descValidation.valid) {
    console.warn('📝 説明文の品質チェック:');
    descValidation.warnings.forEach((warning) => {
      console.warn(`  ⚠️  ${warning}`);
    });
  }

  // キャッチコピーの品質チェック
  const catchcopyValidation = validateCatchcopyQuality(result.catchcopy);
  if (!catchcopyValidation.valid) {
    console.warn('✨ キャッチコピーの品質チェック:');
    catchcopyValidation.warnings.forEach((warning) => {
      console.warn(`  ⚠️  ${warning}`);
    });
  }

  // SEOの品質チェック
  const seoValidation = validateSEOQuality(result.seo);
  if (!seoValidation.valid) {
    console.warn('🔍 SEOの品質チェック:');
    seoValidation.warnings.forEach((warning) => {
      console.warn(`  ⚠️  ${warning}`);
    });
    console.warn(`  📊 SEOスコア: ${seoValidation.score}/100`);
  }

  // 全体のSEOスコアを計算
  const fullText =
    result.description.long +
    ' ' +
    result.catchcopy.main +
    ' ' +
    result.catchcopy.sub;
  const overallScore = calculateSEOScore(result.seo, fullText);
  if (overallScore < 70) {
    console.warn(`⚠️  総合SEOスコアが低いです: ${overallScore}/100`);
  } else {
    console.log(`✅ 総合SEOスコア: ${overallScore}/100`);
  }
}

/**
 * テキスト生成サービスクラス
 *
 * APIキーを保持し、複数回の呼び出しを効率化
 */
export class TextGeneratorService {
  private apiKey: string;
  private defaultTimeout: number;
  private defaultTemperature: number;

  constructor(
    apiKey: string,
    options: { timeout?: number; temperature?: number } = {}
  ) {
    this.apiKey = apiKey;
    this.defaultTimeout = options.timeout ?? 30000;
    this.defaultTemperature = options.temperature ?? 0.7;
  }

  /**
   * 全テキストを一括生成
   */
  async generateAll(
    params: {
      productAnalysis?: TextGenerationOptions['productAnalysis'];
      brandName?: string;
      productName?: string;
      tone?: string;
      targetAudience?: string;
    }
  ): Promise<GeneratedTexts> {
    const toneValue = params.tone as TextGenerationOptions['tone'];
    return generateProductTexts({
      apiKey: this.apiKey,
      productAnalysis: params.productAnalysis,
      productInfo: {
        name: params.productName || '',
        brand: params.brandName || '',
        targetAudience: params.targetAudience || '',
      },
      tone: toneValue || 'professional',
      timeout: this.defaultTimeout,
      temperature: this.defaultTemperature,
    });
  }

  /**
   * 商品説明のみを生成
   */
  async description(
    params: {
      productAnalysis?: TextGenerationOptions['productAnalysis'];
      productInfo?: TextGenerationOptions['productInfo'];
    }
  ): Promise<DescriptionResult> {
    return generateDescriptionOnly({
      apiKey: this.apiKey,
      productAnalysis: params.productAnalysis,
      productInfo: params.productInfo,
      timeout: this.defaultTimeout,
      temperature: this.defaultTemperature,
    });
  }

  /**
   * キャッチコピーのみを生成
   */
  async catchcopy(
    params: {
      productAnalysis?: TextGenerationOptions['productAnalysis'];
      productInfo?: TextGenerationOptions['productInfo'];
    }
  ): Promise<CatchcopyResult> {
    return generateCatchcopyOnly({
      apiKey: this.apiKey,
      productAnalysis: params.productAnalysis,
      productInfo: params.productInfo,
      timeout: this.defaultTimeout,
      temperature: this.defaultTemperature * 1.1,
    });
  }

  /**
   * SEO最適化テキストのみを生成
   */
  async seo(
    params: {
      productAnalysis?: TextGenerationOptions['productAnalysis'];
      productInfo?: TextGenerationOptions['productInfo'];
    }
  ): Promise<SEOResult> {
    return generateSEOOnly({
      apiKey: this.apiKey,
      productAnalysis: params.productAnalysis,
      productInfo: params.productInfo,
      timeout: this.defaultTimeout,
      temperature: this.defaultTemperature * 0.7,
    });
  }
}

// 型定義とエラークラスを再エクスポート
export * from './types.js';
export {
  generateDescription,
  validateDescriptionLength,
  type DescriptionResult,
} from './description-writer.js';
export {
  generateCatchcopy,
  validateCatchcopyQuality,
  type CatchcopyResult,
} from './catchcopy-creator.js';
export {
  generateSEO,
  validateSEOQuality,
  calculateSEOScore,
  type SEOResult,
} from './seo-optimizer.js';
