/**
 * 結果表示コンポーネント
 *
 * 生成結果のプレビュー、比較、ダウンロード機能
 */

import type {
  JobResult,
  GeneratedTexts,
} from '../types.js';

// Types used in the component interface
export type { PackageDesign, AdResult } from '../types.js';

export interface ResultViewerProps {
  result: JobResult;
  activeTab: ResultTab;
  onTabChange: (tab: ResultTab) => void;
  onDownload: (type: DownloadType, id?: string) => void;
}

export type ResultTab = 'packages' | 'ads' | 'texts' | 'analysis';

export type DownloadType = 'all' | 'packages' | 'ads' | 'texts' | 'single';

/**
 * タブ定義
 */
export const RESULT_TABS: { id: ResultTab; label: string; icon: string }[] = [
  { id: 'packages', label: 'パッケージ', icon: '📦' },
  { id: 'ads', label: '広告画像', icon: '📢' },
  { id: 'texts', label: 'テキスト', icon: '📝' },
  { id: 'analysis', label: '分析結果', icon: '🔍' },
];

/**
 * パッケージデザインのバリエーションラベル
 */
export function getVariationLabel(variationType: string): string {
  const labels: Record<string, string> = {
    minimal: 'ミニマル',
    premium: 'プレミアム',
    natural: 'ナチュラル',
    modern: 'モダン',
    traditional: 'トラディショナル',
    playful: 'ポップ',
    elegant: 'エレガント',
  };

  return labels[variationType] || variationType;
}

/**
 * 広告プラットフォームのラベル
 */
export function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    'instagram-square': 'Instagram (正方形)',
    'instagram-story': 'Instagram ストーリー',
    'twitter-card': 'Twitter カード',
    'facebook-feed': 'Facebook フィード',
    'web-banner-leaderboard': 'Web リーダーボード',
    'web-banner-medium-rectangle': 'Web レクタングル',
  };

  return labels[platform] || platform;
}

/**
 * サイズを人間が読める形式に変換
 */
export function formatSize(size: { width: number; height: number }): string {
  return `${size.width} × ${size.height}px`;
}

/**
 * テキストをクリップボードにコピー
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

/**
 * 結果の概要を計算
 */
export function calculateResultSummary(result: JobResult): {
  packageCount: number;
  adCount: number;
  hasTexts: boolean;
  hasAnalysis: boolean;
} {
  return {
    packageCount: result.packages?.length || 0,
    adCount: result.ads?.length || 0,
    hasTexts: !!result.texts,
    hasAnalysis: !!result.analysis,
  };
}

/**
 * ResultViewerのスタイル定義（Tailwind CSS互換）
 */
export const ResultViewerStyles = {
  container: 'w-full max-w-6xl mx-auto',
  header: {
    container: 'mb-6',
    title: 'text-2xl font-bold text-gray-800',
    summary: 'text-sm text-gray-500 mt-2',
    downloadAll: 'mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors',
  },
  tabs: {
    container: 'flex border-b border-gray-200 mb-6',
    tab: {
      base: 'px-6 py-3 font-medium transition-colors cursor-pointer',
      active: 'text-blue-600 border-b-2 border-blue-600',
      inactive: 'text-gray-500 hover:text-gray-700',
    },
  },
  content: {
    container: 'min-h-96',
    empty: 'text-center py-12 text-gray-500',
  },
  // パッケージギャラリー
  packageGallery: {
    container: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    card: {
      container: 'bg-white rounded-lg shadow-md overflow-hidden',
      image: 'w-full h-48 object-cover',
      content: 'p-4',
      title: 'font-medium text-gray-800',
      size: 'text-sm text-gray-500',
      actions: 'mt-3 flex gap-2',
      button: 'px-3 py-1 text-sm rounded border hover:bg-gray-50 transition-colors',
    },
  },
  // 広告プレビュー
  adPreview: {
    container: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    card: {
      container: 'bg-white rounded-lg shadow-md overflow-hidden',
      header: 'px-4 py-3 bg-gray-50 border-b',
      title: 'font-medium text-gray-800',
      size: 'text-sm text-gray-500',
      imageContainer: 'p-4 flex items-center justify-center bg-gray-100',
      image: 'max-w-full max-h-64 object-contain',
      footer: 'px-4 py-3 border-t flex justify-between items-center',
    },
  },
  // テキスト結果
  textResult: {
    container: 'space-y-6',
    section: {
      container: 'bg-white rounded-lg shadow-md p-6',
      header: 'flex justify-between items-center mb-4',
      title: 'text-lg font-bold text-gray-800',
      copyButton: 'px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors',
    },
    description: {
      long: 'text-gray-700 leading-relaxed',
      short: 'text-gray-600 mt-4 p-4 bg-gray-50 rounded-lg',
      bullets: 'mt-4 space-y-2',
      bullet: 'flex items-start gap-2 text-gray-600',
    },
    catchcopy: {
      main: 'text-2xl font-bold text-gray-800 text-center py-4',
      sub: 'text-lg text-gray-600 text-center',
      variations: 'mt-4 space-y-2',
      variation: 'p-3 bg-gray-50 rounded-lg text-gray-700',
    },
    seo: {
      grid: 'grid grid-cols-1 md:grid-cols-2 gap-4',
      item: 'p-4 bg-gray-50 rounded-lg',
      label: 'text-sm font-medium text-gray-500 mb-1',
      value: 'text-gray-800',
      keywords: 'flex flex-wrap gap-2 mt-2',
      keyword: 'px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded',
    },
    features: {
      container: 'overflow-x-auto',
      table: 'w-full',
      th: 'px-4 py-2 bg-gray-50 text-left text-sm font-medium text-gray-600',
      td: 'px-4 py-2 border-t text-gray-700',
    },
  },
  // 分析結果
  analysisResult: {
    container: 'bg-white rounded-lg shadow-md p-6',
    grid: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    section: {
      container: '',
      title: 'text-lg font-bold text-gray-800 mb-3',
    },
    category: {
      badge: 'inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium',
    },
    colors: {
      palette: 'flex gap-2',
      swatch: 'w-12 h-12 rounded-lg shadow-inner border',
      label: 'text-xs text-center mt-1 text-gray-500',
    },
    confidence: {
      container: 'mt-4',
      bar: 'w-full bg-gray-200 rounded-full h-2',
      fill: 'h-2 rounded-full',
      label: 'text-sm text-gray-600 mt-1',
    },
  },
};

/**
 * 信頼度に基づいてバーの色を取得
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-green-500';
  if (confidence >= 0.6) return 'bg-yellow-500';
  return 'bg-red-500';
}

/**
 * 結果ビュワーの状態
 */
export interface ResultViewerState {
  activeTab: ResultTab;
  selectedImage: string | null;
  copiedText: string | null;
}

/**
 * 初期状態
 */
export const initialResultViewerState: ResultViewerState = {
  activeTab: 'packages',
  selectedImage: null,
  copiedText: null,
};

/**
 * 結果ビュワーアクション
 */
export type ResultViewerAction =
  | { type: 'SET_TAB'; tab: ResultTab }
  | { type: 'SELECT_IMAGE'; url: string | null }
  | { type: 'SET_COPIED'; text: string | null }
  | { type: 'RESET' };

/**
 * 結果ビュワーリデューサー
 */
export function resultViewerReducer(
  state: ResultViewerState,
  action: ResultViewerAction
): ResultViewerState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };
    case 'SELECT_IMAGE':
      return { ...state, selectedImage: action.url };
    case 'SET_COPIED':
      return { ...state, copiedText: action.text };
    case 'RESET':
      return initialResultViewerState;
    default:
      return state;
  }
}

/**
 * 全テキストを結合（ダウンロード用）
 */
export function combineTextsForDownload(texts: GeneratedTexts): string {
  const sections: string[] = [];

  // 商品説明
  sections.push('【商品説明（長文）】');
  sections.push(texts.description.long);
  sections.push('');
  sections.push('【商品説明（短文）】');
  sections.push(texts.description.short);
  sections.push('');
  sections.push('【特徴】');
  texts.description.bullet_points.forEach((point) => {
    sections.push(`・${point}`);
  });
  sections.push('');

  // キャッチコピー
  sections.push('【メインキャッチコピー】');
  sections.push(texts.catchcopy.main);
  sections.push('');
  sections.push('【サブコピー】');
  sections.push(texts.catchcopy.sub);
  sections.push('');
  sections.push('【キャッチコピー候補】');
  texts.catchcopy.variations.forEach((v, i) => {
    sections.push(`${i + 1}. ${v}`);
  });
  sections.push('');

  // SEO
  sections.push('【SEOタイトル】');
  sections.push(texts.seo.title);
  sections.push('');
  sections.push('【メタディスクリプション】');
  sections.push(texts.seo.description);
  sections.push('');
  sections.push('【キーワード】');
  sections.push(texts.seo.keywords.join(', '));

  return sections.join('\n');
}
