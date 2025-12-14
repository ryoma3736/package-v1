/**
 * パッケージデザイン生成サービスの型定義
 */

import type { ProductAnalysis as ImageAnalysisProductAnalysis } from '../image-analyzer/types.js';

// 再エクスポート
export type ProductAnalysis = ImageAnalysisProductAnalysis;

/**
 * パッケージテンプレート種類
 */
export type PackageTemplateType = 'box-standard' | 'pouch-stand' | 'bottle-cylinder';

/**
 * 画像生成プロバイダー
 */
export type ImageProvider = 'openai' | 'stability';

/**
 * パッケージテンプレート定義
 */
export interface PackageTemplate {
  /** テンプレート名 */
  name: string;
  /** テンプレートタイプ */
  type: PackageTemplateType;
  /** 説明 */
  description: string;
  /** 推奨される商品カテゴリ */
  recommendedCategories: string[];
  /** デザインパラメータ */
  designParams: {
    /** 主要な表示面 */
    primarySurface: 'front' | 'top' | 'label';
    /** アスペクト比（幅:高さ） */
    aspectRatio: string;
    /** 推奨サイズ（ピクセル） */
    recommendedSize: {
      width: number;
      height: number;
    };
    /** レイアウトゾーン */
    layoutZones: {
      /** ブランドロゴエリア */
      logo: { x: number; y: number; width: number; height: number };
      /** メインビジュアルエリア */
      visual: { x: number; y: number; width: number; height: number };
      /** 製品名エリア */
      productName: { x: number; y: number; width: number; height: number };
      /** 説明テキストエリア */
      description?: { x: number; y: number; width: number; height: number };
    };
  };
  /** プロンプトテンプレート */
  promptTemplate: string;
}

/**
 * デザインバリエーション種類
 */
export type DesignVariationType = 'minimalist' | 'vibrant' | 'premium';

/**
 * パッケージデザイン生成オプション
 */
export interface PackageGenerationOptions {
  /** 商品分析結果 */
  productAnalysis: ImageAnalysisProductAnalysis;
  /** テンプレートタイプ */
  templateType: PackageTemplateType;
  /** 画像生成プロバイダー */
  provider: ImageProvider;
  /** APIキー */
  apiKey: string;
  /** 生成バリエーション数（1-10、デフォルト: 3） */
  variationCount?: number;
  /** バリエーション種類（指定しない場合は自動選択） */
  variationTypes?: DesignVariationType[];
  /** ブランド名（オプション） */
  brandName?: string;
  /** 製品名（オプション） */
  productName?: string;
  /** 追加のデザイン要件（オプション） */
  additionalRequirements?: string;
  /** 生成画像のサイズ（OpenAI DALL-E 3用） */
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  /** 画質（OpenAI DALL-E 3用） */
  quality?: 'standard' | 'hd';
  /** スタイル（Stability AI用） */
  style?: 'photographic' | 'digital-art' | 'cinematic';
  /** タイムアウト（ミリ秒、デフォルト: 60000） */
  timeout?: number;
}

/**
 * デザインプロンプト
 */
export interface DesignPrompt {
  /** プロンプトテキスト */
  text: string;
  /** バリエーション種類 */
  variationType: DesignVariationType;
  /** 使用するテンプレート */
  template: PackageTemplate;
  /** デザインパラメータ */
  params: {
    /** 主要カラー */
    primaryColor: string;
    /** セカンダリカラー */
    secondaryColors: string[];
    /** カテゴリ */
    category: string;
    /** テクスチャ */
    texture: string;
    /** ブランド名 */
    brandName?: string;
    /** 製品名 */
    productName?: string;
  };
}

/**
 * 生成されたパッケージデザイン
 */
export interface GeneratedPackageDesign {
  /** デザインID */
  id: string;
  /** バリエーション種類 */
  variationType: DesignVariationType;
  /** 画像URL（ダウンロード可能なURL） */
  imageUrl: string;
  /** 使用したプロンプト */
  prompt: DesignPrompt;
  /** プロバイダー情報 */
  provider: ImageProvider;
  /** 生成日時 */
  generatedAt: Date;
  /** メタデータ */
  metadata: {
    /** 修正プロンプト（OpenAI） */
    revisedPrompt?: string;
    /** 生成時間（秒） */
    generationTime?: number;
    /** シード値（Stability AI） */
    seed?: number;
  };
}

/**
 * パッケージデザイン生成結果
 */
export interface PackageGenerationResult {
  /** 成功フラグ */
  success: boolean;
  /** 生成されたデザインの配列 */
  designs: GeneratedPackageDesign[];
  /** 使用したテンプレート */
  template: PackageTemplate;
  /** 商品分析結果 */
  productAnalysis: ImageAnalysisProductAnalysis;
  /** エラー情報（失敗時） */
  errors?: GenerationError[];
  /** 統計情報 */
  stats: {
    /** 総生成数 */
    totalGenerated: number;
    /** 成功数 */
    successCount: number;
    /** 失敗数 */
    failureCount: number;
    /** 総実行時間（秒） */
    totalTime: number;
  };
}

/**
 * 生成エラー情報
 */
export interface GenerationError {
  /** エラー種類 */
  type: 'API_ERROR' | 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'TIMEOUT' | 'RATE_LIMIT';
  /** エラーメッセージ */
  message: string;
  /** バリエーション種類（失敗したバリエーション） */
  variationType?: DesignVariationType;
  /** 詳細情報 */
  details?: unknown;
}

/**
 * パッケージデザイン生成エラー
 */
export class PackageGenerationError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_INPUT' | 'API_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT' | 'UNKNOWN',
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'PackageGenerationError';
  }
}

/**
 * OpenAI DALL-E 3 APIレスポンス
 */
export interface OpenAIImageResponse {
  created: number;
  data: Array<{
    url: string;
    revised_prompt?: string;
  }>;
}

/**
 * Stability AI APIレスポンス
 */
export interface StabilityImageResponse {
  artifacts: Array<{
    base64: string;
    seed: number;
    finishReason: string;
  }>;
}
