/**
 * Layout Engine
 * 広告レイアウト処理エンジン
 */

import sharp from 'sharp';
import type { LayoutConfig, ImageSize, ProductAnalysis } from './types.js';

/**
 * レイアウトテンプレート適用
 */
export async function applyLayout(
  baseImageBuffer: Buffer,
  layoutConfig: LayoutConfig,
  imageSize: ImageSize
): Promise<Buffer> {
  const { template, backgroundColor, padding = 0 } = layoutConfig;

  const image = sharp(baseImageBuffer);

  switch (template) {
    case 'simple':
      return applySimpleLayout(image, imageSize, backgroundColor, padding);

    case 'split':
      return applySplitLayout(image, imageSize, backgroundColor, padding);

    case 'overlay':
      return applyOverlayLayout(image, imageSize, backgroundColor);

    case 'grid':
      return applyGridLayout(image, imageSize, backgroundColor, padding);

    default:
      return image.toBuffer();
  }
}

/**
 * シンプルレイアウト: 画像のリサイズと余白追加
 */
async function applySimpleLayout(
  image: sharp.Sharp,
  imageSize: ImageSize,
  backgroundColor?: string,
  padding?: number
): Promise<Buffer> {
  const bgColor = backgroundColor || '#FFFFFF';
  const pad = padding || 0;

  return image
    .resize(imageSize.width - pad * 2, imageSize.height - pad * 2, {
      fit: 'contain',
      background: bgColor,
    })
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: bgColor,
    })
    .toBuffer();
}

/**
 * スプリットレイアウト: 左右分割
 */
async function applySplitLayout(
  image: sharp.Sharp,
  imageSize: ImageSize,
  backgroundColor?: string,
  padding?: number
): Promise<Buffer> {
  const bgColor = backgroundColor || '#F5F5F5';
  const pad = padding || 20;

  // 左半分に画像を配置
  const halfWidth = Math.floor(imageSize.width / 2);

  return image
    .resize(halfWidth - pad * 2, imageSize.height - pad * 2, {
      fit: 'cover',
      position: 'center',
    })
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: halfWidth + pad,
      background: bgColor,
    })
    .toBuffer();
}

/**
 * オーバーレイレイアウト: グラデーション適用
 */
async function applyOverlayLayout(
  image: sharp.Sharp,
  imageSize: ImageSize,
  backgroundColor?: string
): Promise<Buffer> {
  // グラデーションSVGを作成
  const gradientSvg = createGradientOverlay(imageSize, backgroundColor);

  return image
    .resize(imageSize.width, imageSize.height, { fit: 'cover' })
    .composite([
      {
        input: Buffer.from(gradientSvg),
        top: 0,
        left: 0,
      },
    ])
    .toBuffer();
}

/**
 * グリッドレイアウト: 画像を複数配置
 */
async function applyGridLayout(
  image: sharp.Sharp,
  imageSize: ImageSize,
  backgroundColor?: string,
  padding?: number
): Promise<Buffer> {
  const bgColor = backgroundColor || '#FFFFFF';
  const pad = padding || 10;

  // 2x2グリッドの場合
  const cellWidth = Math.floor((imageSize.width - pad * 3) / 2);
  const cellHeight = Math.floor((imageSize.height - pad * 3) / 2);

  // 画像をリサイズ
  const resizedBuffer = await image
    .resize(cellWidth, cellHeight, { fit: 'cover' })
    .toBuffer();

  // 背景作成
  const background = sharp({
    create: {
      width: imageSize.width,
      height: imageSize.height,
      channels: 4,
      background: bgColor,
    },
  });

  // グリッド配置（左上のセルのみ使用、他は将来の拡張用）
  return background
    .composite([
      {
        input: resizedBuffer,
        top: pad,
        left: pad,
      },
    ])
    .toBuffer();
}

/**
 * グラデーションオーバーレイSVG生成
 */
function createGradientOverlay(imageSize: ImageSize, color?: string): string {
  const overlayColor = color || '#000000';

  return `
    <svg width="${imageSize.width}" height="${imageSize.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${overlayColor};stop-opacity:0" />
          <stop offset="100%" style="stop-color:${overlayColor};stop-opacity:0.6" />
        </linearGradient>
      </defs>
      <rect width="${imageSize.width}" height="${imageSize.height}" fill="url(#grad)" />
    </svg>
  `;
}

/**
 * カラーパレットから背景色を推奨
 */
export function suggestBackgroundColor(analysis: ProductAnalysis): string {
  const { primaryColor, colorPalette } = analysis;

  // プライマリーカラーの補色を計算
  const complementary = getComplementaryColor(primaryColor);

  // 明度の高い色を選択（背景に適している）
  const lightColors = colorPalette.filter((c) => {
    const hex = c.color;
    const rgb = hexToRgb(hex);
    if (!rgb) return false;
    const brightness = (rgb.r + rgb.g + rgb.b) / 3;
    return brightness > 200; // 明るい色
  });

  if (lightColors.length > 0) {
    return lightColors[0].color;
  }

  return complementary;
}

/**
 * 補色を計算
 */
function getComplementaryColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#FFFFFF';

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const complementaryHue = (hsl.h + 180) % 360;

  const complementaryRgb = hslToRgb(complementaryHue, hsl.s, hsl.l);
  return rgbToHex(complementaryRgb.r, complementaryRgb.g, complementaryRgb.b);
}

/**
 * Hex to RGB変換
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * RGB to Hex変換
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/**
 * RGB to HSL変換
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s, l };
}

/**
 * HSL to RGB変換
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * レイアウトプリセット
 */
export const LAYOUT_PRESETS = {
  clean: {
    template: 'simple' as const,
    padding: 40,
    backgroundColor: '#FFFFFF',
  },
  modern: {
    template: 'overlay' as const,
    backgroundColor: '#000000',
  },
  professional: {
    template: 'split' as const,
    padding: 30,
    backgroundColor: '#F5F5F5',
  },
  creative: {
    template: 'grid' as const,
    padding: 20,
    backgroundColor: '#FAFAFA',
  },
} as const;
