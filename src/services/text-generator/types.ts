/**
 * ECテキスト生成エンジンの型定義
 */

import type { ProductAnalysis } from '../image-analyzer/types.js';

/**
 * 生成されたテキストコンテンツ
 */
export interface GeneratedTexts {
  /** 商品説明 */
  description: {
    /** 長文説明（500-1000文字） */
    long: string;
    /** 短文説明（100-200文字） */
    short: string;
    /** 箇条書きポイント */
    bullet_points: string[];
  };

  /** キャッチコピー */
  catchcopy: {
    /** メインコピー */
    main: string;
    /** サブコピー */
    sub: string;
    /** 代替案（3-5個） */
    variations: string[];
  };

  /** SEO最適化テキスト */
  seo: {
    /** SEOタイトル（60文字以内） */
    title: string;
    /** メタディスクリプション（160文字以内） */
    description: string;
    /** キーワード */
    keywords: string[];
  };

  /** 商品特徴リスト */
  features: {
    /** 特徴名 */
    name: string;
    /** 特徴値 */
    value: string;
  }[];
}

/**
 * テキスト生成オプション
 */
export interface TextGenerationOptions {
  /** Claude APIキー */
  apiKey: string;

  /** 商品分析結果（オプション、より精度の高い生成のため） */
  productAnalysis?: ProductAnalysis;

  /** 商品の追加情報 */
  productInfo?: {
    /** 商品名 */
    name?: string;
    /** ブランド名 */
    brand?: string;
    /** 価格 */
    price?: number;
    /** 商品詳細 */
    details?: string;
    /** ターゲット層（例: "20代女性", "ビジネスパーソン"） */
    targetAudience?: string;
    /** カテゴリ（例: "食品", "化粧品", "電子機器"） */
    category?: string;
  };

  /** トーン（デフォルト: "professional"） */
  tone?: 'professional' | 'casual' | 'luxury' | 'friendly';

  /** 言語（デフォルト: "ja"） */
  language?: 'ja' | 'en';

  /** タイムアウト（ミリ秒、デフォルト: 30000） */
  timeout?: number;

  /** 温度設定（0.0-1.0、デフォルト: 0.7） */
  temperature?: number;
}

/**
 * 商品説明生成オプション
 */
export interface DescriptionOptions {
  /** 文字数の目安 */
  length?: 'short' | 'medium' | 'long';

  /** 強調するポイント */
  emphasize?: string[];

  /** スタイル */
  style?: 'informative' | 'persuasive' | 'storytelling';
}

/**
 * キャッチコピー生成オプション
 */
export interface CatchcopyOptions {
  /** 最大文字数 */
  maxLength?: number;

  /** 生成する代替案の数 */
  variationCount?: number;

  /** キーワード */
  keywords?: string[];
}

/**
 * SEO最適化オプション
 */
export interface SEOOptions {
  /** フォーカスキーワード */
  focusKeyword?: string;

  /** 追加キーワード */
  additionalKeywords?: string[];

  /** 地域情報（例: "日本", "東京"） */
  location?: string;
}

/**
 * テキスト生成エラー
 */
export class TextGenerationError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_INPUT' | 'API_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT' | 'UNKNOWN',
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'TextGenerationError';
  }
}

/**
 * Claude APIレスポンス型
 */
export interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * プロンプトコンテキスト
 */
export interface PromptContext {
  /** 商品分析情報 */
  analysis?: ProductAnalysis;

  /** 商品情報 */
  productInfo?: TextGenerationOptions['productInfo'];

  /** トーン */
  tone: string;

  /** 言語 */
  language: string;
}
