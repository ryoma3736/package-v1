/**
 * 画像生成API統合モジュール
 * OpenAI DALL-E 3 と Stability AI に対応
 */

import {
  DesignPrompt,
  GeneratedPackageDesign,
  ImageProvider,
  OpenAIImageResponse,
  StabilityImageResponse,
  PackageGenerationError,
  GenerationError,
} from './types.js';

/**
 * OpenAI DALL-E 3 で画像を生成
 *
 * @param prompt デザインプロンプト
 * @param apiKey OpenAI APIキー
 * @param size 画像サイズ
 * @param quality 画質
 * @param timeout タイムアウト（ミリ秒）
 * @returns 生成されたデザイン
 * @throws {PackageGenerationError} 生成に失敗した場合
 */
export async function generateWithOpenAI(
  prompt: DesignPrompt,
  apiKey: string,
  size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024',
  quality: 'standard' | 'hd' = 'hd',
  timeout: number = 60000
): Promise<GeneratedPackageDesign> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt.text,
        n: 1,
        size,
        quality,
        response_format: 'url',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new PackageGenerationError(
        `OpenAI API エラー: ${response.status} ${response.statusText}`,
        'API_ERROR',
        errorData
      );
    }

    const data = (await response.json()) as OpenAIImageResponse;

    if (!data.data || data.data.length === 0) {
      throw new PackageGenerationError(
        'OpenAIから画像が返されませんでした',
        'API_ERROR',
        data
      );
    }

    const generationTime = (Date.now() - startTime) / 1000;
    const imageData = data.data[0];

    return {
      id: `openai-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      variationType: prompt.variationType,
      imageUrl: imageData.url,
      prompt,
      provider: 'openai',
      generatedAt: new Date(),
      metadata: {
        revisedPrompt: imageData.revised_prompt,
        generationTime,
      },
    };
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new PackageGenerationError(
        'OpenAI API タイムアウト',
        'TIMEOUT',
        { timeout }
      );
    }

    if (error instanceof PackageGenerationError) {
      throw error;
    }

    throw new PackageGenerationError(
      'OpenAI API 呼び出し中にエラーが発生しました',
      'NETWORK_ERROR',
      error
    );
  }
}

/**
 * Stability AI で画像を生生成
 *
 * @param prompt デザインプロンプト
 * @param apiKey Stability AI APIキー
 * @param style スタイルプリセット
 * @param width 画像幅
 * @param height 画像高さ
 * @param timeout タイムアウト（ミリ秒）
 * @returns 生成されたデザイン
 * @throws {PackageGenerationError} 生成に失敗した場合
 */
export async function generateWithStability(
  prompt: DesignPrompt,
  apiKey: string,
  style: 'photographic' | 'digital-art' | 'cinematic' = 'photographic',
  width: number = 1024,
  height: number = 1024,
  timeout: number = 60000
): Promise<GeneratedPackageDesign> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Stability AI の最新エンドポイント: stable-diffusion-xl-1024-v1-0
    const response = await fetch(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt.text,
              weight: 1,
            },
          ],
          cfg_scale: 7,
          height,
          width,
          samples: 1,
          steps: 30,
          style_preset: style,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new PackageGenerationError(
        `Stability AI API エラー: ${response.status} ${response.statusText}`,
        'API_ERROR',
        errorData
      );
    }

    const data = (await response.json()) as StabilityImageResponse;

    if (!data.artifacts || data.artifacts.length === 0) {
      throw new PackageGenerationError(
        'Stability AIから画像が返されませんでした',
        'API_ERROR',
        data
      );
    }

    const generationTime = (Date.now() - startTime) / 1000;
    const artifact = data.artifacts[0];

    // Base64画像をData URLに変換
    const imageUrl = `data:image/png;base64,${artifact.base64}`;

    return {
      id: `stability-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      variationType: prompt.variationType,
      imageUrl,
      prompt,
      provider: 'stability',
      generatedAt: new Date(),
      metadata: {
        generationTime,
        seed: artifact.seed,
      },
    };
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new PackageGenerationError(
        'Stability AI API タイムアウト',
        'TIMEOUT',
        { timeout }
      );
    }

    if (error instanceof PackageGenerationError) {
      throw error;
    }

    throw new PackageGenerationError(
      'Stability AI API 呼び出し中にエラーが発生しました',
      'NETWORK_ERROR',
      error
    );
  }
}

/**
 * プロバイダーを自動選択して画像を生成
 *
 * @param prompt デザインプロンプト
 * @param provider 画像生成プロバイダー
 * @param apiKey APIキー
 * @param options 生成オプション
 * @returns 生成されたデザイン
 */
export async function generateImage(
  prompt: DesignPrompt,
  provider: ImageProvider,
  apiKey: string,
  options: {
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'photographic' | 'digital-art' | 'cinematic';
    width?: number;
    height?: number;
    timeout?: number;
  } = {}
): Promise<GeneratedPackageDesign> {
  if (provider === 'openai') {
    return generateWithOpenAI(
      prompt,
      apiKey,
      options.size,
      options.quality,
      options.timeout
    );
  } else if (provider === 'stability') {
    return generateWithStability(
      prompt,
      apiKey,
      options.style,
      options.width,
      options.height,
      options.timeout
    );
  } else {
    throw new PackageGenerationError(
      `サポートされていないプロバイダー: ${provider}`,
      'INVALID_INPUT',
      { provider }
    );
  }
}

/**
 * 複数のプロンプトから並列で画像を生成
 *
 * @param prompts デザインプロンプトの配列
 * @param provider 画像生成プロバイダー
 * @param apiKey APIキー
 * @param options 生成オプション
 * @param concurrency 同時実行数（デフォルト: 2）
 * @returns 生成されたデザインとエラーの配列
 */
export async function generateMultipleImages(
  prompts: DesignPrompt[],
  provider: ImageProvider,
  apiKey: string,
  options: {
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'photographic' | 'digital-art' | 'cinematic';
    width?: number;
    height?: number;
    timeout?: number;
  } = {},
  concurrency: number = 2
): Promise<{
  designs: GeneratedPackageDesign[];
  errors: GenerationError[];
}> {
  const designs: GeneratedPackageDesign[] = [];
  const errors: GenerationError[] = [];

  // 並列処理のためのチャンク分割
  for (let i = 0; i < prompts.length; i += concurrency) {
    const chunk = prompts.slice(i, i + concurrency);

    const results = await Promise.allSettled(
      chunk.map((prompt) => generateImage(prompt, provider, apiKey, options))
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const prompt = chunk[j];

      if (result.status === 'fulfilled') {
        designs.push(result.value);
      } else {
        const error = result.reason as PackageGenerationError;
        errors.push({
          type: error.code === 'TIMEOUT' ? 'TIMEOUT' : 'API_ERROR',
          message: error.message,
          variationType: prompt.variationType,
          details: error.details,
        });
      }
    }

    // レート制限対策: チャンク間で少し待機
    if (i + concurrency < prompts.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return { designs, errors };
}

/**
 * 画像をローカルファイルとして保存
 *
 * @param design 生成されたデザイン
 * @param outputPath 出力ファイルパス
 * @returns 保存されたファイルパス
 */
export async function saveImageToFile(
  design: GeneratedPackageDesign,
  outputPath: string
): Promise<string> {
  try {
    if (design.provider === 'openai') {
      // URLから画像をダウンロード
      const response = await fetch(design.imageUrl);
      if (!response.ok) {
        throw new Error(`画像のダウンロードに失敗: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const { writeFile } = await import('fs/promises');
      await writeFile(outputPath, Buffer.from(buffer));
    } else if (design.provider === 'stability') {
      // Base64 Data URLから保存
      const base64Data = design.imageUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const { writeFile } = await import('fs/promises');
      await writeFile(outputPath, buffer);
    }

    return outputPath;
  } catch (error) {
    throw new PackageGenerationError(
      '画像の保存に失敗しました',
      'UNKNOWN',
      error
    );
  }
}

/**
 * 複数の画像を一括保存
 *
 * @param designs 生成されたデザインの配列
 * @param outputDir 出力ディレクトリ
 * @param filePrefix ファイル名プレフィックス
 * @returns 保存されたファイルパスの配列
 */
export async function saveMultipleImages(
  designs: GeneratedPackageDesign[],
  outputDir: string,
  filePrefix: string = 'design'
): Promise<string[]> {
  const { mkdir } = await import('fs/promises');
  const { join } = await import('path');

  // 出力ディレクトリを作成
  await mkdir(outputDir, { recursive: true });

  const savedPaths: string[] = [];

  for (let i = 0; i < designs.length; i++) {
    const design = designs[i];
    const filename = `${filePrefix}-${design.variationType}-${i + 1}.png`;
    const outputPath = join(outputDir, filename);

    try {
      await saveImageToFile(design, outputPath);
      savedPaths.push(outputPath);
    } catch (error) {
      console.error(`画像の保存に失敗: ${filename}`, error);
    }
  }

  return savedPaths;
}
