/**
 * 商品画像分析エンジンの型定義
 */

/**
 * 商品分析結果
 */
export interface ProductAnalysis {
  /** カテゴリ（例: "食品", "化粧品", "電子機器"） */
  category: string;

  /** カラー情報 */
  colors: {
    /** メインカラー（HEX形式） */
    primary: string;
    /** サブカラー（HEX形式配列） */
    secondary: string[];
    /** カラーパレット（HEX形式配列） */
    palette: string[];
  };

  /** 形状情報 */
  shape: {
    /** 形状タイプ（例: "rectangular", "cylindrical", "spherical"） */
    type: string;
    /** 寸法（相対値） */
    dimensions: {
      width: number;
      height: number;
    };
  };

  /** テクスチャ（例: "glossy", "matte", "metallic"） */
  texture: string;

  /** 信頼度スコア（0.0 - 1.0） */
  confidence: number;
}

/**
 * カラー情報
 */
export interface ColorInfo {
  /** HEX形式のカラーコード */
  hex: string;
  /** RGB値 */
  rgb: [number, number, number];
  /** 出現頻度（0.0 - 1.0） */
  population: number;
}

/**
 * 形状分析結果
 */
export interface ShapeAnalysis {
  /** 形状タイプ */
  type: 'rectangular' | 'cylindrical' | 'spherical' | 'irregular' | 'unknown';
  /** アスペクト比 */
  aspectRatio: number;
  /** 相対的な寸法 */
  dimensions: {
    width: number;
    height: number;
  };
  /** 信頼度 */
  confidence: number;
}

/**
 * カテゴリ検出結果
 */
export interface CategoryDetection {
  /** カテゴリ名 */
  category: string;
  /** サブカテゴリ */
  subcategory?: string;
  /** 信頼度 */
  confidence: number;
  /** 検出された特徴のリスト */
  features: string[];
}

/**
 * テクスチャ分析結果
 */
export interface TextureAnalysis {
  /** テクスチャタイプ */
  type: 'glossy' | 'matte' | 'metallic' | 'rough' | 'smooth' | 'unknown';
  /** 信頼度 */
  confidence: number;
  /** 詳細説明 */
  description?: string;
}

/**
 * 画像分析オプション
 */
export interface AnalysisOptions {
  /** Claude APIキー */
  apiKey: string;
  /** 分析の詳細レベル（1-3、デフォルト: 2） */
  detailLevel?: number;
  /** カラーパレットのサイズ（デフォルト: 5） */
  paletteSize?: number;
  /** タイムアウト（ミリ秒、デフォルト: 30000） */
  timeout?: number;
}

/**
 * エラー型
 */
export class ImageAnalysisError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_IMAGE' | 'API_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT' | 'UNKNOWN',
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ImageAnalysisError';
  }
}
