/**
 * 画像アップロードコンポーネント
 *
 * ドラッグ&ドロップ対応の画像アップロードUI
 */

import type { UploadState } from '../types.js';

export interface ImageUploaderProps {
  state: UploadState;
  onFileSelect: (file: File) => void;
  onDragStateChange: (isDragging: boolean) => void;
  onClear: () => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
}

/**
 * アップロード状態の初期値
 */
export const initialUploadState: UploadState = {
  file: null,
  preview: null,
  isDragging: false,
  error: null,
};

/**
 * ファイルバリデーション
 */
export function validateFile(
  file: File,
  maxSizeMB: number = 10,
  acceptedFormats: string[] = ['image/jpeg', 'image/png', 'image/webp']
): { valid: boolean; error?: string } {
  // ファイルサイズチェック
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `ファイルサイズが大きすぎます。${maxSizeMB}MB以下にしてください。`,
    };
  }

  // ファイル形式チェック
  if (!acceptedFormats.includes(file.type)) {
    return {
      valid: false,
      error: `対応していないファイル形式です。${acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}形式に対応しています。`,
    };
  }

  return { valid: true };
}

/**
 * ファイルからプレビューURLを生成
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * プレビューURLを解放
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * ドラッグイベントハンドラーを生成
 */
export function createDragHandlers(
  onDragStateChange: (isDragging: boolean) => void,
  onFileDrop: (file: File) => void
) {
  return {
    onDragEnter: (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDragStateChange(true);
    },

    onDragLeave: (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDragStateChange(false);
    },

    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },

    onDrop: (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDragStateChange(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        onFileDrop(files[0]);
      }
    },
  };
}

/**
 * ファイル入力変更ハンドラー
 */
export function handleFileInputChange(
  e: Event,
  onFileSelect: (file: File) => void
): void {
  const input = e.target as HTMLInputElement;
  const files = input.files;
  if (files && files.length > 0) {
    onFileSelect(files[0]);
  }
}

/**
 * ImageUploaderのスタイル定義（Tailwind CSS互換）
 */
export const ImageUploaderStyles = {
  container: 'w-full max-w-xl mx-auto',
  dropzone: {
    base: 'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
    idle: 'border-gray-300 hover:border-blue-400 bg-gray-50',
    dragging: 'border-blue-500 bg-blue-50',
    error: 'border-red-500 bg-red-50',
  },
  preview: {
    container: 'relative',
    image: 'max-h-64 mx-auto rounded-lg shadow-md',
    overlay: 'absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg',
    clearButton: 'px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600',
  },
  icon: 'w-12 h-12 mx-auto mb-4 text-gray-400',
  text: {
    primary: 'text-lg font-medium text-gray-700',
    secondary: 'mt-2 text-sm text-gray-500',
  },
  error: 'mt-2 text-sm text-red-600',
  fileInfo: 'mt-2 text-sm text-gray-600',
};

/**
 * 人間が読めるファイルサイズに変換
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * アップロードステートリデューサー
 */
export type UploadAction =
  | { type: 'SET_FILE'; file: File; preview: string }
  | { type: 'SET_DRAGGING'; isDragging: boolean }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR' };

export function uploadReducer(
  state: UploadState,
  action: UploadAction
): UploadState {
  switch (action.type) {
    case 'SET_FILE':
      return {
        ...state,
        file: action.file,
        preview: action.preview,
        error: null,
      };
    case 'SET_DRAGGING':
      return {
        ...state,
        isDragging: action.isDragging,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
      };
    case 'CLEAR':
      if (state.preview) {
        revokePreviewUrl(state.preview);
      }
      return initialUploadState;
    default:
      return state;
  }
}
