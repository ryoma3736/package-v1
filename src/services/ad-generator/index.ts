/**
 * Ad Generator Service
 * OpenAI DALL-E 3を使用した広告画像生成
 */

import OpenAI from 'openai';
import sharp from 'sharp';
import type {
  AdPlatform,
  AdGenerationRequest,
  AdGenerationResult,
  BatchAdGenerationRequest,
  BatchAdGenerationResult,
  PromptGenerationOptions,
  AdGenerationError,
} from './types.js';
import { getPlatformConfig } from './platform-configs.js';
import { applyTextOverlay, TEXT_OVERLAY_PRESETS } from './text-overlay.js';
import { applyLayout } from './layout-engine.js';

/**
 * 広告生成サービス
 */
export class AdGeneratorService {
  private openai: OpenAI;

  constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  /**
   * 広告画像を生成
   */
  async generateAd(request: AdGenerationRequest): Promise<AdGenerationResult> {
    try {
      const platformConfig = getPlatformConfig(request.platform);

      // プロンプト生成
      const prompt = this.buildPrompt({
        productAnalysis: request.productAnalysis,
        platform: request.platform,
        headline: request.headline,
        description: request.description,
        style: request.style,
      });

      console.log(`🎨 Generating ad for ${platformConfig.name}...`);
      console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);

      // DALL-E 3で画像生成
      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: this.mapSizeToDallE(platformConfig.size.width, platformConfig.size.height),
        quality: 'hd',
        style: request.style === 'artistic' ? 'vivid' : 'natural',
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No image data returned from DALL-E');
      }

      const imageUrl = response.data[0].url;
      if (!imageUrl) {
        throw new Error('No image URL returned from DALL-E');
      }

      // 画像をダウンロード
      const imageResponse = await fetch(imageUrl);
      const imageArrayBuffer = await imageResponse.arrayBuffer();
      let imageBuffer: Buffer = Buffer.from(imageArrayBuffer) as Buffer;

      // プラットフォームサイズに正確にリサイズ
      imageBuffer = (await sharp(imageBuffer)
        .resize(platformConfig.size.width, platformConfig.size.height, {
          fit: 'cover',
          position: 'center',
        })
        .toBuffer()) as Buffer;

      // レイアウト適用
      if (request.layoutConfig) {
        imageBuffer = (await applyLayout(
          imageBuffer,
          request.layoutConfig,
          platformConfig.size
        )) as Buffer;
      }

      // テキストオーバーレイ
      const textOverlays = [];

      if (request.headline) {
        textOverlays.push({
          text: request.headline,
          position: 'top' as const,
          ...TEXT_OVERLAY_PRESETS.headline,
        });
      }

      if (request.callToAction) {
        textOverlays.push({
          text: request.callToAction,
          position: 'bottom' as const,
          ...TEXT_OVERLAY_PRESETS.callToAction,
        });
      }

      if (textOverlays.length > 0) {
        imageBuffer = (await applyTextOverlay(
          imageBuffer,
          textOverlays,
          platformConfig.size
        )) as Buffer;
      }

      return {
        platform: request.platform,
        imageUrl,
        imageBuffer,
        size: platformConfig.size,
        prompt,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'dall-e-3',
          revisedPrompt: response.data[0].revised_prompt,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw this.handleError(error, request.platform);
      }
      throw error;
    }
  }

  /**
   * 複数プラットフォーム向けに一括生成
   */
  async generateBatch(request: BatchAdGenerationRequest): Promise<BatchAdGenerationResult> {
    const results: AdGenerationResult[] = [];
    const errors: Array<{ platform: AdPlatform; error: string }> = [];

    console.log(`🚀 Batch generation for ${request.platforms.length} platforms...`);

    for (const platform of request.platforms) {
      try {
        const adRequest: AdGenerationRequest = {
          productAnalysis: request.productAnalysis,
          platform,
          headline: request.commonConfig.headline,
          description: request.commonConfig.description,
          callToAction: request.commonConfig.callToAction,
          brandName: request.commonConfig.brandName,
          style: request.commonConfig.style,
        };

        const result = await this.generateAd(adRequest);
        results.push(result);
        console.log(`✅ Generated ad for ${platform}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ platform, error: errorMessage });
        console.error(`❌ Failed to generate ad for ${platform}: ${errorMessage}`);
      }
    }

    return {
      results,
      errors,
      totalGenerated: results.length,
      totalFailed: errors.length,
    };
  }

  /**
   * プロンプトを構築
   */
  private buildPrompt(options: PromptGenerationOptions): string {
    const { productAnalysis, platform, headline: _headline, description, style } = options;

    const platformConfig = getPlatformConfig(platform);

    const parts: string[] = [];

    // ベースプロンプト
    parts.push('Create a professional advertising image for a product.');

    // スタイル指定
    if (style) {
      const styleDescriptions: Record<string, string> = {
        realistic: 'photorealistic, high-quality product photography',
        artistic: 'artistic, creative, with unique visual style',
        minimalist: 'minimalist, clean, simple design with lots of white space',
        vibrant: 'vibrant, colorful, energetic, eye-catching',
      };
      parts.push(`Style: ${styleDescriptions[style] || style}.`);
    }

    // カラーパレット
    if (productAnalysis.primaryColor) {
      parts.push(
        `Use ${productAnalysis.primaryColor} as the primary color.`
      );
    }

    if (productAnalysis.secondaryColors && productAnalysis.secondaryColors.length > 0) {
      parts.push(
        `Incorporate these accent colors: ${productAnalysis.secondaryColors.join(', ')}.`
      );
    }

    // キーワード
    if (productAnalysis.suggestedKeywords && productAnalysis.suggestedKeywords.length > 0) {
      parts.push(
        `Key themes: ${productAnalysis.suggestedKeywords.slice(0, 3).join(', ')}.`
      );
    }

    // カテゴリとスタイル
    if (productAnalysis.category) {
      parts.push(`Product category: ${productAnalysis.category}.`);
    }

    if (productAnalysis.style) {
      parts.push(`Visual style: ${productAnalysis.style}.`);
    }

    // ヘッドラインと説明（テキストは後でオーバーレイするのでここでは含めない）
    if (description) {
      parts.push(`Context: ${description}.`);
    }

    // プラットフォーム特有の要件
    parts.push(this.getPlatformSpecificInstructions(platform));

    // 技術要件
    parts.push(
      `Image size: ${platformConfig.size.width}x${platformConfig.size.height}px.`
    );
    parts.push('High quality, professional, suitable for advertising.');

    return parts.join(' ');
  }

  /**
   * プラットフォーム別の指示を取得
   */
  private getPlatformSpecificInstructions(platform: AdPlatform): string {
    const instructions: Record<AdPlatform, string> = {
      'instagram-square':
        'Optimized for Instagram feed, square format, visually engaging for social media.',
      'instagram-story':
        'Vertical format for Instagram Stories, eye-catching, mobile-first design.',
      'twitter-card':
        'Optimized for Twitter card, landscape format, clear focal point.',
      'facebook-feed':
        'Designed for Facebook feed, attention-grabbing, suitable for news feed.',
      'web-banner-leaderboard':
        'Horizontal web banner, compact design, clear call-to-action area.',
      'web-banner-medium-rectangle':
        'Medium rectangle banner, balanced composition, suitable for sidebar placement.',
    };

    return instructions[platform] || '';
  }

  /**
   * DALL-Eサイズマッピング
   */
  private mapSizeToDallE(
    width: number,
    height: number
  ): '1024x1024' | '1024x1792' | '1792x1024' {
    const aspectRatio = width / height;

    if (aspectRatio > 1.5) {
      return '1792x1024'; // 横長
    } else if (aspectRatio < 0.7) {
      return '1024x1792'; // 縦長
    } else {
      return '1024x1024'; // 正方形
    }
  }

  /**
   * エラーハンドリング
   */
  private handleError(error: Error, platform?: AdPlatform): AdGenerationError {
    if (error.message.includes('rate_limit')) {
      return {
        name: 'AdGenerationError',
        message: 'OpenAI API rate limit exceeded. Please try again later.',
        code: 'API_ERROR',
        platform,
      } as AdGenerationError;
    }

    if (error.message.includes('insufficient_quota')) {
      return {
        name: 'AdGenerationError',
        message: 'OpenAI API quota exceeded. Please check your billing.',
        code: 'API_ERROR',
        platform,
      } as AdGenerationError;
    }

    if (error.message.includes('invalid_api_key')) {
      return {
        name: 'AdGenerationError',
        message: 'Invalid OpenAI API key. Please check your configuration.',
        code: 'API_ERROR',
        platform,
      } as AdGenerationError;
    }

    return {
      name: 'AdGenerationError',
      message: error.message,
      code: 'PROCESSING_ERROR',
      platform,
    } as AdGenerationError;
  }
}

// エクスポート
export * from './types.js';
export * from './platform-configs.js';
export * from './text-overlay.js';
export * from './layout-engine.js';
