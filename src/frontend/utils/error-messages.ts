/**
 * ユーザーフレンドリーなエラーメッセージユーティリティ
 *
 * エラーコードや技術的なエラーメッセージを
 * ユーザーが理解しやすいメッセージに変換します。
 */

export interface UserFriendlyError {
  title: string;
  message: string;
  suggestion?: string;
  retryable: boolean;
}

/**
 * エラーコード別のメッセージマッピング
 */
const ERROR_MESSAGES: Record<string, UserFriendlyError> = {
  // API関連エラー
  API_ERROR: {
    title: 'API接続エラー',
    message: 'AIサービスとの接続に問題が発生しました。',
    suggestion: 'しばらく待ってから再度お試しください。問題が続く場合はAPIキーを確認してください。',
    retryable: true,
  },
  NETWORK_ERROR: {
    title: 'ネットワークエラー',
    message: 'インターネット接続に問題があるようです。',
    suggestion: 'ネットワーク接続を確認してから再度お試しください。',
    retryable: true,
  },
  TIMEOUT: {
    title: 'タイムアウト',
    message: '処理時間が長すぎてタイムアウトしました。',
    suggestion: '画像サイズを小さくするか、生成オプションを減らしてお試しください。',
    retryable: true,
  },
  INVALID_INPUT: {
    title: '入力エラー',
    message: '入力データに問題があります。',
    suggestion: '入力内容を確認してから再度お試しください。',
    retryable: false,
  },
  UNKNOWN: {
    title: '予期せぬエラー',
    message: '予期せぬエラーが発生しました。',
    suggestion: 'しばらく待ってから再度お試しください。',
    retryable: true,
  },

  // バリデーションエラー
  imageBuffer: {
    title: '画像エラー',
    message: '画像ファイルを正しく読み込めませんでした。',
    suggestion: 'JPEG、PNG、WebP形式の画像（10MB以下）をお使いください。',
    retryable: false,
  },
  claudeApiKey: {
    title: 'APIキー未設定',
    message: '画像分析用のAPIキーが設定されていません。',
    suggestion: '管理者にお問い合わせいただくか、APIキーを設定してください。',
    retryable: false,
  },
  openaiApiKey: {
    title: 'APIキー未設定',
    message: '画像生成用のAPIキーが設定されていません。',
    suggestion: '管理者にお問い合わせいただくか、APIキーを設定してください。',
    retryable: false,
  },
  concurrentJobs: {
    title: '処理中のジョブが多すぎます',
    message: '現在、多くのリクエストを処理しています。',
    suggestion: '1〜2分待ってから再度お試しください。',
    retryable: true,
  },
  brandName: {
    title: 'ブランド名エラー',
    message: 'ブランド名の形式に問題があります。',
    suggestion: '100文字以内で入力してください。',
    retryable: false,
  },
  productName: {
    title: '商品名エラー',
    message: '商品名の形式に問題があります。',
    suggestion: '200文字以内で入力してください。',
    retryable: false,
  },
  variationCount: {
    title: 'バリエーション数エラー',
    message: 'バリエーション数の指定に問題があります。',
    suggestion: '1〜10の範囲で指定してください。',
    retryable: false,
  },
};

/**
 * エラーをユーザーフレンドリーなメッセージに変換
 */
export function toUserFriendlyError(error: unknown): UserFriendlyError {
  // エラーオブジェクトの場合
  if (error instanceof Error) {
    const errorWithCode = error as Error & { code?: string; field?: string };

    // APIValidationErrorの場合
    if (errorWithCode.name === 'APIValidationError' && errorWithCode.field) {
      const friendlyError = ERROR_MESSAGES[errorWithCode.field];
      if (friendlyError) {
        return {
          ...friendlyError,
          message: error.message || friendlyError.message,
        };
      }
    }

    // TextGenerationError, ImageAnalysisError等の場合
    if (errorWithCode.code) {
      const friendlyError = ERROR_MESSAGES[errorWithCode.code];
      if (friendlyError) {
        return {
          ...friendlyError,
          message: error.message || friendlyError.message,
        };
      }
    }

    // 特定のメッセージパターンで判定
    const message = error.message.toLowerCase();
    if (message.includes('timeout') || message.includes('タイムアウト')) {
      return ERROR_MESSAGES.TIMEOUT;
    }
    if (message.includes('network') || message.includes('ネットワーク') || message.includes('econnrefused')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (message.includes('api') || message.includes('401') || message.includes('403')) {
      return ERROR_MESSAGES.API_ERROR;
    }

    // 不明なエラー
    return {
      ...ERROR_MESSAGES.UNKNOWN,
      message: error.message,
    };
  }

  // 文字列の場合
  if (typeof error === 'string') {
    return {
      ...ERROR_MESSAGES.UNKNOWN,
      message: error,
    };
  }

  // その他
  return ERROR_MESSAGES.UNKNOWN;
}

/**
 * エラーメッセージをフォーマット
 */
export function formatErrorMessage(error: unknown): string {
  const friendly = toUserFriendlyError(error);
  let result = `${friendly.title}: ${friendly.message}`;
  if (friendly.suggestion) {
    result += `\n💡 ${friendly.suggestion}`;
  }
  return result;
}

/**
 * エラーがリトライ可能かどうかを判定
 */
export function isRetryableError(error: unknown): boolean {
  return toUserFriendlyError(error).retryable;
}

/**
 * 進捗ステップのエラーメッセージ
 */
export function getStepErrorMessage(step: string, error?: string): string {
  const stepLabels: Record<string, string> = {
    analysis: '画像分析',
    packages: 'パッケージ生成',
    ads: '広告画像生成',
    texts: 'テキスト生成',
  };

  const stepLabel = stepLabels[step] || step;

  if (!error) {
    return `${stepLabel}でエラーが発生しました。`;
  }

  const friendly = toUserFriendlyError(new Error(error));
  return `${stepLabel}でエラーが発生しました: ${friendly.message}`;
}

/**
 * 成功メッセージ
 */
export function getSuccessMessage(step: string): string {
  const messages: Record<string, string> = {
    analysis: '画像分析が完了しました',
    packages: 'パッケージデザインの生成が完了しました',
    ads: '広告画像の生成が完了しました',
    texts: 'テキストの生成が完了しました',
    all: '全ての生成が完了しました',
  };

  return messages[step] || '処理が完了しました';
}
