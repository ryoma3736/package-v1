/**
 * パッケージデザイン生成サービス - メインエントリ
 *
 * 商品分析結果を基に、複数のパッケージデザインバリエーションを自動生成します。
 *
 * @example
 * ```typescript
 * import { generatePackageDesigns } from './services/package-generator';
 * import { analyzeProductImage } from './services/image-analyzer';
 *
 * // 商品画像を分析
 * const analysis = await analyzeProductImage('./product.jpg', {
 *   apiKey: process.env.CLAUDE_API_KEY
 * });
 *
 * // パッケージデザインを生成
 * const result = await generatePackageDesigns({
 *   productAnalysis: analysis,
 *   templateType: 'box-standard',
 *   provider: 'openai',
 *   apiKey: process.env.OPENAI_API_KEY,
 *   variationCount: 3,
 *   brandName: 'Natural Co.',
 *   productName: 'Organic Green Tea'
 * });
 *
 * console.log(`${result.designs.length}個のデザインを生成しました`);
 * result.designs.forEach(design => {
 *   console.log(`${design.variationType}: ${design.imageUrl}`);
 * });
 * ```
 */

import {
  PackageGenerationOptions,
  PackageGenerationResult,
  PackageGenerationError,
  GeneratedPackageDesign,
  DesignPrompt,
  GenerationError,
} from './types.js';
import { loadTemplate, autoSelectTemplate } from './template-engine.js';
import {
  buildMultiplePrompts,
  autoSelectVariations,
  validatePrompt,
} from './prompt-builder.js';
import { generateMultipleImages } from './image-generator.js';

/**
 * パッケージデザインを生成（メイン関数）
 *
 * @param options 生成オプション
 * @returns 生成結果
 * @throws {PackageGenerationError} 生成に失敗した場合
 *
 * @example
 * ```typescript
 * const result = await generatePackageDesigns({
 *   productAnalysis,
 *   templateType: 'bottle-cylinder',
 *   provider: 'openai',
 *   apiKey: process.env.OPENAI_API_KEY,
 *   variationCount: 3
 * });
 * ```
 */
export async function generatePackageDesigns(
  options: PackageGenerationOptions
): Promise<PackageGenerationResult> {
  const startTime = Date.now();

  try {
    // 入力検証
    validateOptions(options);

    const {
      productAnalysis,
      templateType,
      provider,
      apiKey,
      variationCount = 3,
      variationTypes,
      brandName,
      productName,
      additionalRequirements,
      size,
      quality,
      style,
      timeout = 60000,
    } = options;

    // 1. テンプレートを読み込み
    const template = await loadTemplate(templateType);

    // 2. バリエーション種類を決定
    const selectedVariations =
      variationTypes ||
      autoSelectVariations(productAnalysis, variationCount);

    // 3. プロンプトを生成
    const prompts = buildMultiplePrompts(
      productAnalysis,
      template,
      selectedVariations.slice(0, variationCount),
      brandName,
      productName,
      additionalRequirements
    );

    // プロンプトを検証
    for (const prompt of prompts) {
      const validation = validatePrompt(prompt);
      if (!validation.valid) {
        throw new PackageGenerationError(
          `プロンプト検証エラー: ${validation.errors.join(', ')}`,
          'INVALID_INPUT',
          { errors: validation.errors, prompt }
        );
      }
    }

    // 4. 画像を生成（並列処理）
    const { designs, errors } = await generateMultipleImages(
      prompts,
      provider,
      apiKey,
      {
        size,
        quality,
        style,
        timeout,
      },
      2 // 同時実行数
    );

    // 5. 統計情報を計算
    const totalTime = (Date.now() - startTime) / 1000;
    const stats = {
      totalGenerated: prompts.length,
      successCount: designs.length,
      failureCount: errors.length,
      totalTime,
    };

    // 6. 結果を返す
    return {
      success: designs.length > 0,
      designs,
      template,
      productAnalysis,
      errors: errors.length > 0 ? errors : undefined,
      stats,
    };
  } catch (error) {
    if (error instanceof PackageGenerationError) {
      throw error;
    }

    throw new PackageGenerationError(
      'パッケージデザイン生成中にエラーが発生しました',
      'UNKNOWN',
      error
    );
  }
}

/**
 * 簡易生成（テンプレートとバリエーションを自動選択）
 *
 * @param productAnalysis 商品分析結果
 * @param provider 画像生成プロバイダー
 * @param apiKey APIキー
 * @param options 追加オプション
 * @returns 生成結果
 *
 * @example
 * ```typescript
 * const result = await generatePackageDesignsAuto(
 *   productAnalysis,
 *   'openai',
 *   process.env.OPENAI_API_KEY,
 *   { brandName: 'MyBrand' }
 * );
 * ```
 */
export async function generatePackageDesignsAuto(
  productAnalysis: Parameters<typeof generatePackageDesigns>[0]['productAnalysis'],
  provider: Parameters<typeof generatePackageDesigns>[0]['provider'],
  apiKey: string,
  options: {
    brandName?: string;
    productName?: string;
    variationCount?: number;
    additionalRequirements?: string;
  } = {}
): Promise<PackageGenerationResult> {
  // テンプレートを自動選択
  const templateType = autoSelectTemplate(
    productAnalysis.category,
    productAnalysis.shape.type
  );

  return generatePackageDesigns({
    productAnalysis,
    templateType,
    provider,
    apiKey,
    ...options,
  });
}

/**
 * バッチ処理: 複数の商品分析からデザインを一括生成
 *
 * @param analysisArray 商品分析結果の配列
 * @param provider 画像生成プロバイダー
 * @param apiKey APIキー
 * @param options 生成オプション
 * @returns 生成結果の配列
 *
 * @example
 * ```typescript
 * const results = await generateBatch(
 *   [analysis1, analysis2, analysis3],
 *   'openai',
 *   process.env.OPENAI_API_KEY
 * );
 * ```
 */
export async function generateBatch(
  analysisArray: Array<
    Parameters<typeof generatePackageDesigns>[0]['productAnalysis']
  >,
  provider: Parameters<typeof generatePackageDesigns>[0]['provider'],
  apiKey: string,
  options: {
    brandName?: string;
    productName?: string;
    variationCount?: number;
  } = {}
): Promise<PackageGenerationResult[]> {
  const results: PackageGenerationResult[] = [];

  // 順次処理（API制限対策）
  for (const analysis of analysisArray) {
    try {
      const result = await generatePackageDesignsAuto(
        analysis,
        provider,
        apiKey,
        options
      );
      results.push(result);

      // API制限対策: 少し待機
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('バッチ生成エラー:', error);
      // エラーが発生しても続行
      results.push({
        success: false,
        designs: [],
        template: {} as never,
        productAnalysis: analysis,
        errors: [
          {
            type: 'API_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
        stats: {
          totalGenerated: 0,
          successCount: 0,
          failureCount: 1,
          totalTime: 0,
        },
      });
    }
  }

  return results;
}

/**
 * デザイン生成の進捗を監視
 *
 * @param options 生成オプション
 * @param onProgress 進捗コールバック
 * @returns 生成結果
 *
 * @example
 * ```typescript
 * const result = await generateWithProgress(options, (progress) => {
 *   console.log(`進捗: ${progress.current}/${progress.total}`);
 * });
 * ```
 */
export async function generateWithProgress(
  options: PackageGenerationOptions,
  onProgress?: (progress: {
    current: number;
    total: number;
    design?: GeneratedPackageDesign;
    error?: GenerationError;
  }) => void
): Promise<PackageGenerationResult> {
  const startTime = Date.now();

  try {
    validateOptions(options);

    const {
      productAnalysis,
      templateType,
      provider,
      apiKey,
      variationCount = 3,
      variationTypes,
      brandName,
      productName,
      additionalRequirements,
      size,
      quality,
      style,
      timeout = 60000,
    } = options;

    const template = await loadTemplate(templateType);

    const selectedVariations =
      variationTypes ||
      autoSelectVariations(productAnalysis, variationCount);

    const prompts = buildMultiplePrompts(
      productAnalysis,
      template,
      selectedVariations.slice(0, variationCount),
      brandName,
      productName,
      additionalRequirements
    );

    const designs: GeneratedPackageDesign[] = [];
    const errors: GenerationError[] = [];

    // 順次生成（進捗通知のため）
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];

      try {
        const { generateImage } = await import('./image-generator.js');
        const design = await generateImage(prompt, provider, apiKey, {
          size,
          quality,
          style,
          timeout,
        });

        designs.push(design);

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: prompts.length,
            design,
          });
        }
      } catch (error) {
        const genError: GenerationError = {
          type: 'API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          variationType: prompt.variationType,
          details: error,
        };

        errors.push(genError);

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: prompts.length,
            error: genError,
          });
        }
      }

      // レート制限対策
      if (i < prompts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const totalTime = (Date.now() - startTime) / 1000;

    return {
      success: designs.length > 0,
      designs,
      template,
      productAnalysis,
      errors: errors.length > 0 ? errors : undefined,
      stats: {
        totalGenerated: prompts.length,
        successCount: designs.length,
        failureCount: errors.length,
        totalTime,
      },
    };
  } catch (error) {
    if (error instanceof PackageGenerationError) {
      throw error;
    }

    throw new PackageGenerationError(
      'パッケージデザイン生成中にエラーが発生しました',
      'UNKNOWN',
      error
    );
  }
}

/**
 * オプションを検証
 */
function validateOptions(options: PackageGenerationOptions): void {
  const errors: string[] = [];

  if (!options.productAnalysis) {
    errors.push('商品分析結果が必要です');
  }

  if (!options.templateType) {
    errors.push('テンプレートタイプが必要です');
  }

  if (!options.provider) {
    errors.push('プロバイダーが必要です');
  }

  if (!options.apiKey || options.apiKey.trim().length === 0) {
    errors.push('APIキーが必要です');
  }

  if (options.variationCount && options.variationCount < 1) {
    errors.push('バリエーション数は1以上である必要があります');
  }

  if (options.variationCount && options.variationCount > 10) {
    errors.push('バリエーション数は10以下である必要があります');
  }

  if (errors.length > 0) {
    throw new PackageGenerationError(
      `入力検証エラー: ${errors.join(', ')}`,
      'INVALID_INPUT',
      { errors }
    );
  }
}

// 型定義とユーティリティを再エクスポート
export * from './types.js';
export * from './template-engine.js';
export * from './prompt-builder.js';
export * from './image-generator.js';
