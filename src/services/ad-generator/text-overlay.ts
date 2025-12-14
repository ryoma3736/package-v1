/**
 * Text Overlay Module
 * 画像へのテキスト合成機能
 */

import sharp from 'sharp';
import type { TextOverlayConfig, ImageSize } from './types.js';

/**
 * テキストをSVGとして生成
 */
export function createTextSvg(
  text: string,
  config: TextOverlayConfig,
  imageSize: ImageSize
): string {
  const fontSize = config.fontSize || 48;
  const fontFamily = config.fontFamily || 'Arial, sans-serif';
  const color = config.color || '#FFFFFF';
  const backgroundColor = config.backgroundColor || 'rgba(0, 0, 0, 0.5)';
  const opacity = config.opacity || 1;
  const padding = config.padding || 20;
  const maxWidth = config.maxWidth || imageSize.width - padding * 2;

  // テキストを折り返し処理
  const lines = wrapText(text, maxWidth, fontSize);
  const lineHeight = fontSize * 1.2;
  const textHeight = lines.length * lineHeight;
  const textWidth = Math.min(maxWidth, getLongestLineWidth(lines, fontSize));

  // 背景の寸法
  const bgWidth = textWidth + padding * 2;
  const bgHeight = textHeight + padding * 2;

  // 位置計算
  const position = calculatePosition(
    config.position,
    imageSize,
    { width: bgWidth, height: bgHeight }
  );

  // SVG生成
  const svg = `
    <svg width="${imageSize.width}" height="${imageSize.height}" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="${position.x}"
        y="${position.y}"
        width="${bgWidth}"
        height="${bgHeight}"
        fill="${backgroundColor}"
        opacity="${opacity}"
        rx="8"
      />
      ${lines
        .map(
          (line, index) => `
        <text
          x="${position.x + bgWidth / 2}"
          y="${position.y + padding + (index + 0.8) * lineHeight}"
          font-family="${fontFamily}"
          font-size="${fontSize}"
          fill="${color}"
          text-anchor="middle"
          font-weight="bold"
        >${escapeXml(line)}</text>
      `
        )
        .join('')}
    </svg>
  `;

  return svg.trim();
}

/**
 * テキストを折り返し
 */
function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  const approximateCharWidth = fontSize * 0.6; // 近似的な文字幅
  const maxCharsPerLine = Math.floor(maxWidth / approximateCharWidth);

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [text];
}

/**
 * 最長行の幅を取得（近似値）
 */
function getLongestLineWidth(lines: string[], fontSize: number): number {
  const longestLine = lines.reduce((a, b) => (a.length > b.length ? a : b), '');
  return longestLine.length * fontSize * 0.6; // 近似値
}

/**
 * 位置を計算
 */
function calculatePosition(
  position: TextOverlayConfig['position'],
  imageSize: ImageSize,
  textSize: ImageSize
): { x: number; y: number } {
  const padding = 20;

  const positions = {
    top: {
      x: (imageSize.width - textSize.width) / 2,
      y: padding,
    },
    center: {
      x: (imageSize.width - textSize.width) / 2,
      y: (imageSize.height - textSize.height) / 2,
    },
    bottom: {
      x: (imageSize.width - textSize.width) / 2,
      y: imageSize.height - textSize.height - padding,
    },
    'top-left': {
      x: padding,
      y: padding,
    },
    'top-right': {
      x: imageSize.width - textSize.width - padding,
      y: padding,
    },
    'bottom-left': {
      x: padding,
      y: imageSize.height - textSize.height - padding,
    },
    'bottom-right': {
      x: imageSize.width - textSize.width - padding,
      y: imageSize.height - textSize.height - padding,
    },
  };

  return positions[position];
}

/**
 * XMLエスケープ
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 画像にテキストをオーバーレイ
 */
export async function applyTextOverlay(
  imageBuffer: Buffer,
  overlayConfigs: TextOverlayConfig[],
  imageSize: ImageSize
): Promise<Buffer> {
  let image = sharp(imageBuffer);

  // 各テキストオーバーレイを適用
  for (const config of overlayConfigs) {
    const svgBuffer = Buffer.from(createTextSvg(config.text, config, imageSize));

    image = image.composite([
      {
        input: svgBuffer,
        top: 0,
        left: 0,
      },
    ]);
  }

  return image.toBuffer();
}

/**
 * 複数のテキストレイヤーを合成
 */
export async function createMultiLayerOverlay(
  baseImageBuffer: Buffer,
  layers: Array<{
    text: string;
    config: TextOverlayConfig;
  }>,
  imageSize: ImageSize
): Promise<Buffer> {
  const configs = layers.map((layer) => ({
    ...layer.config,
    text: layer.text,
  }));

  return applyTextOverlay(baseImageBuffer, configs, imageSize);
}

/**
 * プリセットスタイル
 */
export const TEXT_OVERLAY_PRESETS = {
  headline: {
    fontSize: 72,
    fontFamily: 'Arial, sans-serif',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    opacity: 1,
    padding: 30,
  },
  subheadline: {
    fontSize: 48,
    fontFamily: 'Arial, sans-serif',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    opacity: 0.9,
    padding: 20,
  },
  callToAction: {
    fontSize: 36,
    fontFamily: 'Arial, sans-serif',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 87, 34, 0.9)',
    opacity: 1,
    padding: 15,
  },
  caption: {
    fontSize: 24,
    fontFamily: 'Arial, sans-serif',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    opacity: 0.8,
    padding: 10,
  },
} as const;
