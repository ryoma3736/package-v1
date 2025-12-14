/**
 * フロントエンドコンポーネント - メインエントリ
 *
 * React/Next.jsで使用するためのUIコンポーネントとユーティリティをエクスポート
 */

// 型定義
export * from './types.js';

// コンポーネント
export {
  // ImageUploader
  initialUploadState,
  validateFile,
  createPreviewUrl,
  revokePreviewUrl,
  createDragHandlers,
  handleFileInputChange,
  formatFileSize,
  uploadReducer,
  ImageUploaderStyles,
  type ImageUploaderProps,
  type UploadAction,
} from './components/ImageUploader.js';

export {
  // ProgressTracker
  getStepIcon,
  getStepColor,
  getStatusLabel,
  calculateOverallProgress,
  getCurrentStep,
  estimateRemainingTime,
  formatTime,
  getStepContainerStyle,
  initialProgressState,
  progressReducer,
  ProgressTrackerStyles,
  type ProgressTrackerProps,
  type ProgressState,
  type ProgressAction,
} from './components/ProgressTracker.js';

export {
  // ResultViewer
  RESULT_TABS,
  getVariationLabel,
  getPlatformLabel,
  formatSize,
  copyToClipboard,
  calculateResultSummary,
  getConfidenceColor,
  initialResultViewerState,
  resultViewerReducer,
  combineTextsForDownload,
  ResultViewerStyles,
  type ResultViewerProps,
  type ResultTab,
  type DownloadType,
  type ResultViewerState,
  type ResultViewerAction,
} from './components/ResultViewer.js';
