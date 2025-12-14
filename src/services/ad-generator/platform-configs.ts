/**
 * Platform Configurations
 * 各広告プラットフォームの仕様定義
 */

import type { PlatformConfig, AdPlatform } from './types.js';

/**
 * プラットフォーム別設定マップ
 */
export const PLATFORM_CONFIGS: Record<AdPlatform, PlatformConfig> = {
  'instagram-square': {
    name: 'Instagram Square Post',
    platform: 'instagram-square',
    size: {
      width: 1080,
      height: 1080,
      aspectRatio: '1:1',
    },
    description: 'Instagram feed square post',
    recommendedDPI: 72,
    maxFileSize: 8000, // 8MB
  },

  'instagram-story': {
    name: 'Instagram Story',
    platform: 'instagram-story',
    size: {
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
    },
    description: 'Instagram story vertical format',
    recommendedDPI: 72,
    maxFileSize: 8000, // 8MB
  },

  'twitter-card': {
    name: 'Twitter Card',
    platform: 'twitter-card',
    size: {
      width: 1200,
      height: 628,
      aspectRatio: '1.91:1',
    },
    description: 'Twitter summary card with large image',
    recommendedDPI: 72,
    maxFileSize: 5000, // 5MB
  },

  'facebook-feed': {
    name: 'Facebook Feed',
    platform: 'facebook-feed',
    size: {
      width: 1200,
      height: 630,
      aspectRatio: '1.91:1',
    },
    description: 'Facebook feed link preview',
    recommendedDPI: 72,
    maxFileSize: 8000, // 8MB
  },

  'web-banner-leaderboard': {
    name: 'Web Banner Leaderboard',
    platform: 'web-banner-leaderboard',
    size: {
      width: 728,
      height: 90,
      aspectRatio: '8.09:1',
    },
    description: 'Standard web banner leaderboard',
    recommendedDPI: 72,
    maxFileSize: 150, // 150KB
  },

  'web-banner-medium-rectangle': {
    name: 'Web Banner Medium Rectangle',
    platform: 'web-banner-medium-rectangle',
    size: {
      width: 300,
      height: 250,
      aspectRatio: '1.2:1',
    },
    description: 'Medium rectangle web banner',
    recommendedDPI: 72,
    maxFileSize: 150, // 150KB
  },
};

/**
 * プラットフォーム設定を取得
 */
export function getPlatformConfig(platform: AdPlatform): PlatformConfig {
  const config = PLATFORM_CONFIGS[platform];
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  return config;
}

/**
 * 全プラットフォーム一覧を取得
 */
export function getAllPlatforms(): AdPlatform[] {
  return Object.keys(PLATFORM_CONFIGS) as AdPlatform[];
}

/**
 * プラットフォームがサポートされているか確認
 */
export function isSupportedPlatform(platform: string): platform is AdPlatform {
  return platform in PLATFORM_CONFIGS;
}

/**
 * サイズからプラットフォームを推測
 */
export function guessPlatformBySize(width: number, height: number): AdPlatform[] {
  return getAllPlatforms().filter((platform) => {
    const config = PLATFORM_CONFIGS[platform];
    return config.size.width === width && config.size.height === height;
  });
}

/**
 * アスペクト比からプラットフォームを推測
 */
export function guessPlatformByAspectRatio(aspectRatio: string): AdPlatform[] {
  return getAllPlatforms().filter((platform) => {
    const config = PLATFORM_CONFIGS[platform];
    return config.size.aspectRatio === aspectRatio;
  });
}
