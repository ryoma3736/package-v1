/**
 * Ad Generator Types
 * 広告画像生成に関する型定義
 */

/**
 * サポートされる広告プラットフォーム
 */
export type AdPlatform =
  | 'instagram-square'
  | 'instagram-story'
  | 'twitter-card'
  | 'facebook-feed'
  | 'web-banner-leaderboard'
  | 'web-banner-medium-rectangle';

/**
 * 画像サイズ定義
 */
export interface ImageSize {
  width: number;
  height: number;
  aspectRatio?: string;
}

/**
 * プラットフォーム設定
 */
export interface PlatformConfig {
  name: string;
  platform: AdPlatform;
  size: ImageSize;
  description: string;
  recommendedDPI: number;
  maxFileSize?: number; // in KB
}

/**
 * 商品分析結果（image-analyzerとの連携用）
 */
export interface ProductAnalysis {
  primaryColor: string;
  secondaryColors: string[];
  colorPalette: Array<{ color: string; percentage: number }>;
  dominantEmotion?: string;
  suggestedKeywords: string[];
  category?: string;
  style?: string;
}

/**
 * テキストオーバーレイ設定
 */
export interface TextOverlayConfig {
  text: string;
  position: 'top' | 'center' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  opacity?: number;
  padding?: number;
  maxWidth?: number;
}

/**
 * レイアウト設定
 */
export interface LayoutConfig {
  template: 'simple' | 'split' | 'overlay' | 'grid';
  textOverlays?: TextOverlayConfig[];
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  padding?: number;
  backgroundColor?: string;
}

/**
 * 広告生成リクエスト
 */
export interface AdGenerationRequest {
  productAnalysis: ProductAnalysis;
  platform: AdPlatform;
  headline?: string;
  description?: string;
  callToAction?: string;
  brandName?: string;
  logoUrl?: string;
  layoutConfig?: LayoutConfig;
  style?: 'realistic' | 'artistic' | 'minimalist' | 'vibrant';
}

/**
 * 広告生成結果
 */
export interface AdGenerationResult {
  platform: AdPlatform;
  imageUrl: string;
  imageBuffer?: Buffer;
  size: ImageSize;
  prompt: string;
  metadata: {
    generatedAt: string;
    model: string;
    revisedPrompt?: string;
  };
}

/**
 * プロンプト生成オプション
 */
export interface PromptGenerationOptions {
  productAnalysis: ProductAnalysis;
  platform: AdPlatform;
  headline?: string;
  description?: string;
  style?: string;
  additionalInstructions?: string;
}

/**
 * バッチ生成リクエスト
 */
export interface BatchAdGenerationRequest {
  productAnalysis: ProductAnalysis;
  platforms: AdPlatform[];
  commonConfig: {
    headline?: string;
    description?: string;
    callToAction?: string;
    brandName?: string;
    style?: 'realistic' | 'artistic' | 'minimalist' | 'vibrant';
  };
}

/**
 * バッチ生成結果
 */
export interface BatchAdGenerationResult {
  results: AdGenerationResult[];
  errors: Array<{ platform: AdPlatform; error: string }>;
  totalGenerated: number;
  totalFailed: number;
}

/**
 * エラー型
 */
export class AdGenerationError extends Error {
  constructor(
    message: string,
    public code: 'API_ERROR' | 'VALIDATION_ERROR' | 'PROCESSING_ERROR' | 'NETWORK_ERROR',
    public platform?: AdPlatform
  ) {
    super(message);
    this.name = 'AdGenerationError';
  }
}
