/**
 * エラーメッセージユーティリティのテスト
 */

import { describe, it, expect } from 'vitest';
import {
  toUserFriendlyError,
  formatErrorMessage,
  isRetryableError,
  getStepErrorMessage,
  getSuccessMessage,
} from './error-messages.js';

describe('Error Messages Utility', () => {
  describe('toUserFriendlyError', () => {
    it('should convert API_ERROR to user-friendly message', () => {
      const error = new Error('API call failed');
      (error as Error & { code: string }).code = 'API_ERROR';

      const friendly = toUserFriendlyError(error);

      expect(friendly.title).toBe('API接続エラー');
      expect(friendly.retryable).toBe(true);
    });

    it('should convert TIMEOUT to user-friendly message', () => {
      const error = new Error('Request timeout');
      (error as Error & { code: string }).code = 'TIMEOUT';

      const friendly = toUserFriendlyError(error);

      expect(friendly.title).toBe('タイムアウト');
      expect(friendly.retryable).toBe(true);
    });

    it('should convert NETWORK_ERROR to user-friendly message', () => {
      const error = new Error('Network error');
      (error as Error & { code: string }).code = 'NETWORK_ERROR';

      const friendly = toUserFriendlyError(error);

      expect(friendly.title).toBe('ネットワークエラー');
      expect(friendly.retryable).toBe(true);
    });

    it('should convert INVALID_INPUT to user-friendly message', () => {
      const error = new Error('Invalid input');
      (error as Error & { code: string }).code = 'INVALID_INPUT';

      const friendly = toUserFriendlyError(error);

      expect(friendly.title).toBe('入力エラー');
      expect(friendly.retryable).toBe(false);
    });

    it('should handle APIValidationError with field', () => {
      const error = new Error('画像データが不正です');
      (error as Error & { name: string; field: string }).name = 'APIValidationError';
      (error as Error & { name: string; field: string }).field = 'imageBuffer';

      const friendly = toUserFriendlyError(error);

      expect(friendly.title).toBe('画像エラー');
      expect(friendly.retryable).toBe(false);
    });

    it('should detect timeout from error message', () => {
      const error = new Error('リクエストがタイムアウトしました');

      const friendly = toUserFriendlyError(error);

      expect(friendly.title).toBe('タイムアウト');
    });

    it('should detect network error from error message', () => {
      const error = new Error('ECONNREFUSED - connection refused');

      const friendly = toUserFriendlyError(error);

      expect(friendly.title).toBe('ネットワークエラー');
    });

    it('should handle string errors', () => {
      const friendly = toUserFriendlyError('Something went wrong');

      expect(friendly.message).toBe('Something went wrong');
      expect(friendly.retryable).toBe(true);
    });

    it('should handle unknown errors', () => {
      const friendly = toUserFriendlyError(null);

      expect(friendly.title).toBe('予期せぬエラー');
    });
  });

  describe('formatErrorMessage', () => {
    it('should format error with title and message', () => {
      const error = new Error('API call failed');
      (error as Error & { code: string }).code = 'API_ERROR';

      const formatted = formatErrorMessage(error);

      expect(formatted).toContain('API接続エラー');
      expect(formatted).toContain('API call failed');
    });

    it('should include suggestion when available', () => {
      const error = new Error('Request timeout');
      (error as Error & { code: string }).code = 'TIMEOUT';

      const formatted = formatErrorMessage(error);

      expect(formatted).toContain('💡');
    });
  });

  describe('isRetryableError', () => {
    it('should return true for retryable errors', () => {
      const error = new Error('API call failed');
      (error as Error & { code: string }).code = 'API_ERROR';

      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      const error = new Error('Invalid input');
      (error as Error & { code: string }).code = 'INVALID_INPUT';

      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('getStepErrorMessage', () => {
    it('should return step-specific error message', () => {
      const message = getStepErrorMessage('analysis', 'API error');

      expect(message).toContain('画像分析');
    });

    it('should handle missing error', () => {
      const message = getStepErrorMessage('packages');

      expect(message).toContain('パッケージ生成');
      expect(message).toContain('エラーが発生しました');
    });
  });

  describe('getSuccessMessage', () => {
    it('should return success message for analysis', () => {
      expect(getSuccessMessage('analysis')).toContain('画像分析');
      expect(getSuccessMessage('analysis')).toContain('完了');
    });

    it('should return success message for packages', () => {
      expect(getSuccessMessage('packages')).toContain('パッケージ');
    });

    it('should return success message for ads', () => {
      expect(getSuccessMessage('ads')).toContain('広告');
    });

    it('should return success message for texts', () => {
      expect(getSuccessMessage('texts')).toContain('テキスト');
    });

    it('should return default message for unknown step', () => {
      expect(getSuccessMessage('unknown')).toContain('完了');
    });
  });
});
