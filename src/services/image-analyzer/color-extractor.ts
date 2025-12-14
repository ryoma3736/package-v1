/**
 * カラー抽出モジュール
 * sharpとカスタムアルゴリズムで画像からカラーパレットを抽出
 */

import sharp from 'sharp';
import { ColorInfo, ImageAnalysisError } from './types.js';

/**
 * RGB値をHEX形式に変換
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * K-meansアルゴリズムを使用してカラークラスタリング
 */
function kMeansClustering(
  pixels: [number, number, number][],
  k: number,
  maxIterations: number = 10
): [number, number, number][] {
  if (pixels.length === 0) return [];

  // ランダムに初期中心を選択
  const centers: [number, number, number][] = [];
  const step = Math.floor(pixels.length / k);
  for (let i = 0; i < k; i++) {
    centers.push(pixels[Math.min(i * step, pixels.length - 1)]);
  }

  for (let iter = 0; iter < maxIterations; iter++) {
    // 各ピクセルを最も近い中心に割り当て
    const clusters: [number, number, number][][] = Array.from(
      { length: k },
      () => []
    );

    for (const pixel of pixels) {
      let minDist = Infinity;
      let closestCenter = 0;

      for (let i = 0; i < k; i++) {
        const dist = Math.sqrt(
          Math.pow(pixel[0] - centers[i][0], 2) +
            Math.pow(pixel[1] - centers[i][1], 2) +
            Math.pow(pixel[2] - centers[i][2], 2)
        );
        if (dist < minDist) {
          minDist = dist;
          closestCenter = i;
        }
      }

      clusters[closestCenter].push(pixel);
    }

    // 新しい中心を計算
    let changed = false;
    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) continue;

      const newCenter: [number, number, number] = [0, 0, 0];
      for (const pixel of clusters[i]) {
        newCenter[0] += pixel[0];
        newCenter[1] += pixel[1];
        newCenter[2] += pixel[2];
      }
      newCenter[0] = Math.round(newCenter[0] / clusters[i].length);
      newCenter[1] = Math.round(newCenter[1] / clusters[i].length);
      newCenter[2] = Math.round(newCenter[2] / clusters[i].length);

      if (
        newCenter[0] !== centers[i][0] ||
        newCenter[1] !== centers[i][1] ||
        newCenter[2] !== centers[i][2]
      ) {
        changed = true;
        centers[i] = newCenter;
      }
    }

    if (!changed) break;
  }

  return centers;
}

/**
 * 画像からカラーパレットを抽出
 * @param imagePath 画像ファイルのパスまたはBuffer
 * @param paletteSize パレットのサイズ（デフォルト: 5）
 * @returns カラー情報の配列
 */
export async function extractColors(
  imagePath: string | Buffer,
  paletteSize: number = 5
): Promise<ColorInfo[]> {
  try {
    const image = sharp(imagePath);

    // 画像をリサイズして処理を高速化（最大200x200）
    const resized = image.resize(200, 200, { fit: 'inside' });

    // RGB形式のRawデータを取得
    const { data, info } = await resized
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // ピクセルデータを配列に変換（透明度の高いピクセルは除外）
    const pixels: [number, number, number][] = [];
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = info.channels === 4 ? data[i + 3] : 255;

      // アルファ値が128以上のピクセルのみを使用
      if (a >= 128) {
        pixels.push([r, g, b]);
      }
    }

    if (pixels.length === 0) {
      throw new ImageAnalysisError(
        'カラーの抽出に失敗しました',
        'INVALID_IMAGE',
        { reason: 'No visible pixels detected' }
      );
    }

    // K-meansクラスタリングでパレットを抽出
    const palette = kMeansClustering(pixels, paletteSize);

    // 各色の出現頻度を計算
    const colorCounts = new Map<string, number>();
    for (const pixel of pixels) {
      // 最も近いパレット色を見つける
      let minDist = Infinity;
      let closestColor: [number, number, number] = palette[0];

      for (const color of palette) {
        const dist = Math.sqrt(
          Math.pow(pixel[0] - color[0], 2) +
            Math.pow(pixel[1] - color[1], 2) +
            Math.pow(pixel[2] - color[2], 2)
        );
        if (dist < minDist) {
          minDist = dist;
          closestColor = color;
        }
      }

      const key = closestColor.join(',');
      colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
    }

    // ColorInfo形式に変換
    const colors: ColorInfo[] = palette
      .map((rgb) => {
        const key = rgb.join(',');
        const count = colorCounts.get(key) || 0;
        return {
          hex: rgbToHex(rgb[0], rgb[1], rgb[2]),
          rgb: [rgb[0], rgb[1], rgb[2]] as [number, number, number],
          population: count / pixels.length,
        };
      })
      .sort((a, b) => b.population - a.population); // 出現頻度でソート

    return colors;
  } catch (error) {
    if (error instanceof ImageAnalysisError) {
      throw error;
    }
    throw new ImageAnalysisError(
      'カラー抽出中にエラーが発生しました',
      'UNKNOWN',
      error
    );
  }
}

/**
 * カラー情報を整形して返す
 * @param colors カラー情報の配列
 * @returns 整形されたカラー情報
 */
export function formatColors(colors: ColorInfo[]): {
  primary: string;
  secondary: string[];
  palette: string[];
} {
  if (colors.length === 0) {
    return {
      primary: '#000000',
      secondary: [],
      palette: [],
    };
  }

  const [primary, ...rest] = colors;

  return {
    primary: primary.hex,
    secondary: rest.slice(0, 3).map((c) => c.hex),
    palette: colors.map((c) => c.hex),
  };
}

/**
 * カラーの明度を計算（0-1の範囲）
 * @param rgb RGB値
 * @returns 明度（0: 暗い、1: 明るい）
 */
export function calculateBrightness(rgb: [number, number, number]): number {
  // 相対輝度の計算（ITU-R BT.709）
  const [r, g, b] = rgb.map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * 2つのカラーのコントラスト比を計算
 * @param rgb1 1つ目のRGB値
 * @param rgb2 2つ目のRGB値
 * @returns コントラスト比（1-21）
 */
export function calculateContrast(
  rgb1: [number, number, number],
  rgb2: [number, number, number]
): number {
  const l1 = calculateBrightness(rgb1);
  const l2 = calculateBrightness(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
