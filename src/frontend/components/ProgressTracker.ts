/**
 * 進捗表示コンポーネント
 *
 * 4ステップの生成進捗をリアルタイム表示
 */

import type { JobProgress, StepStatus, ProgressStep } from '../types.js';
import { PROGRESS_STEPS } from '../types.js';

export interface ProgressTrackerProps {
  progress: JobProgress;
  elapsedTime?: number;
  onCancel?: () => void;
}

/**
 * ステップステータスのアイコン
 */
export function getStepIcon(status: StepStatus): string {
  switch (status) {
    case 'done':
      return '✓';
    case 'processing':
      return '⟳';
    case 'failed':
      return '✗';
    case 'skipped':
      return '−';
    case 'pending':
    default:
      return '○';
  }
}

/**
 * ステップステータスのカラー
 */
export function getStepColor(status: StepStatus): string {
  switch (status) {
    case 'done':
      return 'text-green-600 bg-green-100';
    case 'processing':
      return 'text-blue-600 bg-blue-100 animate-pulse';
    case 'failed':
      return 'text-red-600 bg-red-100';
    case 'skipped':
      return 'text-gray-400 bg-gray-100';
    case 'pending':
    default:
      return 'text-gray-400 bg-gray-100';
  }
}

/**
 * ステータスラベル
 */
export function getStatusLabel(status: StepStatus): string {
  switch (status) {
    case 'done':
      return '完了';
    case 'processing':
      return '処理中...';
    case 'failed':
      return '失敗';
    case 'skipped':
      return 'スキップ';
    case 'pending':
    default:
      return '待機中';
  }
}

/**
 * 全体の進捗率を計算
 */
export function calculateOverallProgress(progress: JobProgress): number {
  const steps = Object.values(progress);
  const completed = steps.filter(
    (s) => s === 'done' || s === 'skipped'
  ).length;
  const processing = steps.filter((s) => s === 'processing').length;

  return Math.round(((completed + processing * 0.5) / steps.length) * 100);
}

/**
 * 現在処理中のステップを取得
 */
export function getCurrentStep(progress: JobProgress): ProgressStep | null {
  for (const step of PROGRESS_STEPS) {
    if (progress[step.id] === 'processing') {
      return step;
    }
  }
  return null;
}

/**
 * 残り時間を推定
 */
export function estimateRemainingTime(
  progress: JobProgress,
  elapsedTime: number
): number {
  const currentStepIndex = PROGRESS_STEPS.findIndex(
    (s) => progress[s.id] === 'processing'
  );

  if (currentStepIndex === -1) {
    return 0;
  }

  // 残りステップの推定時間を合計
  let remaining = 0;
  for (let i = currentStepIndex; i < PROGRESS_STEPS.length; i++) {
    const step = PROGRESS_STEPS[i];
    if (progress[step.id] !== 'done' && progress[step.id] !== 'skipped') {
      remaining += step.estimatedTime;
    }
  }

  // 現在のステップの経過時間を引く
  const currentStep = PROGRESS_STEPS[currentStepIndex];
  const stepElapsed = Math.min(elapsedTime, currentStep.estimatedTime);
  remaining -= stepElapsed;

  return Math.max(0, remaining);
}

/**
 * 時間をフォーマット（秒 → "X分Y秒"）
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}秒`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (remainingSeconds === 0) {
    return `${minutes}分`;
  }

  return `${minutes}分${remainingSeconds}秒`;
}

/**
 * ProgressTrackerのスタイル定義（Tailwind CSS互換）
 */
export const ProgressTrackerStyles = {
  container: 'w-full max-w-2xl mx-auto p-6',
  header: {
    container: 'mb-6',
    title: 'text-xl font-bold text-gray-800',
    subtitle: 'text-sm text-gray-500 mt-1',
  },
  progressBar: {
    container: 'w-full bg-gray-200 rounded-full h-2 mb-6',
    fill: 'bg-blue-600 h-2 rounded-full transition-all duration-500',
  },
  steps: {
    container: 'space-y-4',
    step: {
      container: 'flex items-start gap-4 p-4 rounded-lg border transition-colors',
      idle: 'border-gray-200 bg-white',
      active: 'border-blue-500 bg-blue-50',
      done: 'border-green-500 bg-green-50',
      failed: 'border-red-500 bg-red-50',
    },
    icon: {
      container: 'w-10 h-10 rounded-full flex items-center justify-center font-bold',
    },
    content: {
      container: 'flex-1',
      label: 'font-medium text-gray-800',
      description: 'text-sm text-gray-500',
      status: 'text-xs mt-1',
    },
  },
  footer: {
    container: 'mt-6 flex justify-between items-center',
    time: 'text-sm text-gray-500',
    cancelButton:
      'px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors',
  },
};

/**
 * ステップの状態に基づいてコンテナスタイルを取得
 */
export function getStepContainerStyle(status: StepStatus): string {
  const { step } = ProgressTrackerStyles.steps;

  switch (status) {
    case 'done':
      return `${step.container} ${step.done}`;
    case 'processing':
      return `${step.container} ${step.active}`;
    case 'failed':
      return `${step.container} ${step.failed}`;
    default:
      return `${step.container} ${step.idle}`;
  }
}

/**
 * 進捗ステートの型
 */
export interface ProgressState {
  progress: JobProgress;
  elapsedTime: number;
  startTime: number;
}

/**
 * 進捗ステートの初期値
 */
export const initialProgressState: ProgressState = {
  progress: {
    analysis: 'pending',
    packages: 'pending',
    ads: 'pending',
    texts: 'pending',
  },
  elapsedTime: 0,
  startTime: 0,
};

/**
 * 進捗アクション
 */
export type ProgressAction =
  | { type: 'START'; startTime: number }
  | { type: 'UPDATE_PROGRESS'; progress: JobProgress }
  | { type: 'TICK'; currentTime: number }
  | { type: 'RESET' };

/**
 * 進捗リデューサー
 */
export function progressReducer(
  state: ProgressState,
  action: ProgressAction
): ProgressState {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        startTime: action.startTime,
        elapsedTime: 0,
      };
    case 'UPDATE_PROGRESS':
      return {
        ...state,
        progress: action.progress,
      };
    case 'TICK':
      return {
        ...state,
        elapsedTime: (action.currentTime - state.startTime) / 1000,
      };
    case 'RESET':
      return initialProgressState;
    default:
      return state;
  }
}
