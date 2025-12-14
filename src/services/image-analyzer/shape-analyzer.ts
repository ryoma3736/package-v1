/**
 * 形状分析モジュール
 * sharpを使用して画像の形状を分析
 */

import sharp from 'sharp';
import { ShapeAnalysis, ImageAnalysisError } from './types.js';

/**
 * 画像のメタデータを取得
 */
async function getImageMetadata(imagePath: string | Buffer) {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    return metadata;
  } catch (error) {
    throw new ImageAnalysisError(
      '画像メタデータの取得に失敗しました',
      'INVALID_IMAGE',
      error
    );
  }
}

/**
 * アスペクト比から形状タイプを推定
 */
function inferShapeFromAspectRatio(
  aspectRatio: number
): ShapeAnalysis['type'] {
  // 正方形に近い（0.9 - 1.1）
  if (aspectRatio >= 0.9 && aspectRatio <= 1.1) {
    return 'spherical'; // 球形または正方形
  }

  // 縦長（0.4 - 0.9）
  if (aspectRatio >= 0.4 && aspectRatio < 0.9) {
    return 'cylindrical'; // 円筒形またはボトル型
  }

  // 横長（1.1 - 2.5）
  if (aspectRatio > 1.1 && aspectRatio <= 2.5) {
    return 'rectangular'; // 長方形
  }

  // 極端な比率
  if (aspectRatio < 0.4 || aspectRatio > 2.5) {
    return 'irregular'; // 不規則な形状
  }

  return 'unknown';
}

/**
 * 信頼度を計算
 * アスペクト比が典型的な形状に近いほど高い信頼度を返す
 */
function calculateShapeConfidence(aspectRatio: number): number {
  // 正方形（1.0）に近い
  if (Math.abs(aspectRatio - 1.0) < 0.1) {
    return 0.95;
  }

  // 縦長の典型的な比率（0.6-0.7）
  if (aspectRatio >= 0.6 && aspectRatio <= 0.7) {
    return 0.9;
  }

  // 横長の典型的な比率（1.5-1.6）
  if (aspectRatio >= 1.5 && aspectRatio <= 1.6) {
    return 0.9;
  }

  // 一般的な範囲内
  if (aspectRatio >= 0.5 && aspectRatio <= 2.0) {
    return 0.75;
  }

  // 極端な比率
  return 0.5;
}

/**
 * 画像から形状を分析
 * @param imagePath 画像ファイルのパスまたはBuffer
 * @returns 形状分析結果
 */
export async function analyzeShape(
  imagePath: string | Buffer
): Promise<ShapeAnalysis> {
  try {
    const metadata = await getImageMetadata(imagePath);

    if (!metadata.width || !metadata.height) {
      throw new ImageAnalysisError(
        '画像の寸法を取得できませんでした',
        'INVALID_IMAGE'
      );
    }

    // アスペクト比を計算
    const aspectRatio = metadata.width / metadata.height;

    // 形状タイプを推定
    const type = inferShapeFromAspectRatio(aspectRatio);

    // 信頼度を計算
    const confidence = calculateShapeConfidence(aspectRatio);

    // 相対的な寸法（最大値を100として正規化）
    const maxDimension = Math.max(metadata.width, metadata.height);
    const dimensions = {
      width: Math.round((metadata.width / maxDimension) * 100),
      height: Math.round((metadata.height / maxDimension) * 100),
    };

    return {
      type,
      aspectRatio: Math.round(aspectRatio * 100) / 100,
      dimensions,
      confidence: Math.round(confidence * 100) / 100,
    };
  } catch (error) {
    if (error instanceof ImageAnalysisError) {
      throw error;
    }
    throw new ImageAnalysisError(
      '形状分析中にエラーが発生しました',
      'UNKNOWN',
      error
    );
  }
}

/**
 * エッジ検出による形状の詳細分析
 * @param imagePath 画像ファイルのパスまたはBuffer
 * @returns エッジの強度（0-1）
 */
export async function detectEdges(
  imagePath: string | Buffer
): Promise<number> {
  try {
    const image = sharp(imagePath);

    // グレースケールに変換してエッジ検出
    const { data, info } = await image
      .greyscale()
      .normalise()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // 簡易的なエッジ強度の計算（隣接ピクセルとの差分）
    let edgeStrength = 0;
    const pixelCount = info.width * info.height;

    for (let i = 0; i < data.length - 1; i++) {
      const diff = Math.abs(data[i] - data[i + 1]);
      edgeStrength += diff;
    }

    // 正規化（0-1の範囲）
    const normalizedStrength = edgeStrength / (pixelCount * 255);
    return Math.min(1, Math.round(normalizedStrength * 100) / 100);
  } catch (error) {
    // エッジ検出に失敗した場合はデフォルト値を返す
    return 0.5;
  }
}

/**
 * 形状情報を整形して返す
 * @param analysis 形状分析結果
 * @returns 整形された形状情報
 */
export function formatShape(analysis: ShapeAnalysis): {
  type: string;
  dimensions: { width: number; height: number };
} {
  return {
    type: analysis.type,
    dimensions: analysis.dimensions,
  };
}
