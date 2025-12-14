/**
 * 統合API - メインエントリポイント
 *
 * 全生成モジュールを統合し、シンプルなAPIインターフェースを提供します。
 *
 * @example
 * ```typescript
 * import { ProductGenerationAPI } from './api';
 *
 * const api = new ProductGenerationAPI({
 *   claudeApiKey: process.env.CLAUDE_API_KEY,
 *   openaiApiKey: process.env.OPENAI_API_KEY,
 * });
 *
 * // ジョブを作成・開始
 * const { jobId } = await api.startGeneration(imageBuffer, {
 *   brandName: 'MyBrand',
 *   productName: 'Premium Tea',
 * });
 *
 * // 進捗を監視
 * api.subscribeProgress(jobId, (event) => {
 *   console.log(`Step: ${event.step}, Status: ${event.status}`);
 * });
 *
 * // 結果を取得
 * const result = await api.waitForCompletion(jobId);
 * ```
 */

import type {
  GenerateOptions,
  GenerateResponse,
  StatusResponse,
  Job,
  ProgressEvent,
} from './types.js';
import {
  createJob,
  getJob,
  getAllJobs,
  subscribeProgress,
  estimateProcessingTime,
  cleanupOldJobs,
  deleteJob,
} from './jobs/queue.js';
import { processJob, getProcessingCount } from './jobs/processor.js';

/**
 * API入力バリデーションエラー
 */
export class APIValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'APIValidationError';
  }
}

/**
 * 入力バリデーションユーティリティ
 */
function validateImageBuffer(buffer: unknown): void {
  if (!buffer || !(buffer instanceof Buffer)) {
    throw new APIValidationError(
      '画像データが不正です。Bufferを指定してください。',
      'imageBuffer',
      { receivedType: typeof buffer }
    );
  }

  if (buffer.length === 0) {
    throw new APIValidationError(
      '画像データが空です。',
      'imageBuffer'
    );
  }

  // 最大サイズチェック（10MB）
  const maxSize = 10 * 1024 * 1024;
  if (buffer.length > maxSize) {
    throw new APIValidationError(
      `画像サイズが大きすぎます。最大${maxSize / 1024 / 1024}MBまで対応しています。`,
      'imageBuffer',
      { size: buffer.length, maxSize }
    );
  }

  // 画像フォーマットチェック（マジックバイト）
  const jpegMagic = buffer.slice(0, 2).toString('hex') === 'ffd8';
  const pngMagic = buffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a';
  const webpMagic = buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
                    buffer.slice(8, 12).toString('ascii') === 'WEBP';

  if (!jpegMagic && !pngMagic && !webpMagic) {
    throw new APIValidationError(
      '対応していない画像フォーマットです。JPEG、PNG、WebPのみ対応しています。',
      'imageBuffer',
      { detectedMagic: buffer.slice(0, 4).toString('hex') }
    );
  }
}

function validateGenerateOptions(options: GenerateOptions): void {
  // ブランド名のバリデーション
  if (options.brandName !== undefined) {
    if (typeof options.brandName !== 'string') {
      throw new APIValidationError(
        'ブランド名は文字列で指定してください。',
        'brandName',
        { receivedType: typeof options.brandName }
      );
    }
    if (options.brandName.length > 100) {
      throw new APIValidationError(
        'ブランド名は100文字以内で指定してください。',
        'brandName',
        { length: options.brandName.length }
      );
    }
  }

  // 商品名のバリデーション
  if (options.productName !== undefined) {
    if (typeof options.productName !== 'string') {
      throw new APIValidationError(
        '商品名は文字列で指定してください。',
        'productName',
        { receivedType: typeof options.productName }
      );
    }
    if (options.productName.length > 200) {
      throw new APIValidationError(
        '商品名は200文字以内で指定してください。',
        'productName',
        { length: options.productName.length }
      );
    }
  }

  // バリエーション数のバリデーション
  if (options.packageVariations !== undefined) {
    if (typeof options.packageVariations !== 'number' || !Number.isInteger(options.packageVariations)) {
      throw new APIValidationError(
        'バリエーション数は整数で指定してください。',
        'packageVariations',
        { receivedType: typeof options.packageVariations }
      );
    }
    if (options.packageVariations < 1 || options.packageVariations > 10) {
      throw new APIValidationError(
        'バリエーション数は1〜10の範囲で指定してください。',
        'packageVariations',
        { value: options.packageVariations }
      );
    }
  }
}

function validateApiKeys(config: APIConfig, options: GenerateOptions): void {
  // 画像分析は常に必要なのでClaude APIキーが必要
  if (!config.claudeApiKey) {
    throw new APIValidationError(
      'Claude APIキーが設定されていません。画像分析にはAPIキーが必要です。',
      'claudeApiKey'
    );
  }

  // パッケージ/広告生成が必要な場合はOpenAI APIキーが必要
  if (options.skipPackages !== true || options.skipAds !== true) {
    if (!config.openaiApiKey) {
      throw new APIValidationError(
        'OpenAI APIキーが設定されていません。画像生成にはAPIキーが必要です。',
        'openaiApiKey'
      );
    }
  }
}

export interface APIConfig {
  claudeApiKey?: string;
  openaiApiKey?: string;
  maxConcurrentJobs?: number;
  cleanupIntervalMs?: number;
}

/**
 * 商品コンテンツ生成API
 */
export class ProductGenerationAPI {
  private config: APIConfig;
  private cleanupInterval?: ReturnType<typeof setInterval>;

  constructor(config: APIConfig = {}) {
    this.config = {
      maxConcurrentJobs: 5,
      cleanupIntervalMs: 600000, // 10分
      ...config,
    };

    // 古いジョブを定期クリーンアップ
    const cleanupInterval = this.config.cleanupIntervalMs || 600000;
    if (cleanupInterval > 0) {
      this.cleanupInterval = setInterval(() => {
        const cleaned = cleanupOldJobs();
        if (cleaned > 0) {
          console.log(`Cleaned up ${cleaned} old jobs`);
        }
      }, cleanupInterval);
    }
  }

  /**
   * 生成を開始
   */
  async startGeneration(
    imageBuffer: Buffer,
    options: GenerateOptions = {}
  ): Promise<GenerateResponse> {
    // 入力バリデーション
    validateImageBuffer(imageBuffer);
    validateGenerateOptions(options);
    validateApiKeys(this.config, options);

    // 同時実行数をチェック
    const maxConcurrent = this.config.maxConcurrentJobs || 5;
    if (getProcessingCount() >= maxConcurrent) {
      throw new APIValidationError(
        `同時実行数の上限（${maxConcurrent}）に達しています。しばらく待ってから再度お試しください。`,
        'concurrentJobs',
        { current: getProcessingCount(), max: maxConcurrent }
      );
    }

    // ジョブを作成
    const job = createJob(options);

    // 推定処理時間を計算
    const estimatedTime = estimateProcessingTime(options);

    // 非同期で処理を開始
    processJob(job, imageBuffer, {
      claudeApiKey: this.config.claudeApiKey,
      openaiApiKey: this.config.openaiApiKey,
    }).catch((error) => {
      console.error(`Job ${job.id} failed:`, error);
    });

    return {
      jobId: job.id,
      status: job.status,
      estimatedTime,
      websocketUrl: `/ws/progress/${job.id}`,
    };
  }

  /**
   * ジョブ状態を取得
   */
  getStatus(jobId: string): StatusResponse | null {
    const job = getJob(jobId);
    if (!job) return null;

    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      error: job.error,
      downloadUrl: job.result?.downloadUrl,
      result: job.status === 'completed' ? job.result : undefined,
    };
  }

  /**
   * 全ジョブを取得
   */
  listJobs(): Job[] {
    return getAllJobs();
  }

  /**
   * ジョブを削除
   */
  deleteJob(jobId: string): boolean {
    return deleteJob(jobId);
  }

  /**
   * 進捗を購読
   */
  subscribeProgress(
    jobId: string,
    callback: (event: ProgressEvent) => void
  ): () => void {
    return subscribeProgress(jobId, (job) => {
      const event: ProgressEvent = {
        type: job.status === 'completed' ? 'complete' : job.status === 'failed' ? 'error' : 'progress',
        jobId: job.id,
        progress: job.progress,
        result: job.status === 'completed' ? job.result : undefined,
        message: job.error,
      };
      callback(event);
    });
  }

  /**
   * 完了まで待機
   */
  waitForCompletion(jobId: string, timeoutMs: number = 300000): Promise<Job> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        reject(new Error('Job completion timeout'));
      }, timeoutMs);

      const unsubscribe = this.subscribeProgress(jobId, (event) => {
        if (event.type === 'complete') {
          clearTimeout(timeout);
          unsubscribe();
          const job = getJob(jobId);
          if (job) {
            resolve(job);
          } else {
            reject(new Error('Job not found'));
          }
        } else if (event.type === 'error') {
          clearTimeout(timeout);
          unsubscribe();
          reject(new Error(event.message || 'Job failed'));
        }
      });

      // 既に完了している場合
      const job = getJob(jobId);
      if (job?.status === 'completed') {
        clearTimeout(timeout);
        unsubscribe();
        resolve(job);
      } else if (job?.status === 'failed') {
        clearTimeout(timeout);
        unsubscribe();
        reject(new Error(job.error || 'Job failed'));
      }
    });
  }

  /**
   * 処理状況を取得
   */
  getSystemStatus(): {
    processingCount: number;
    maxConcurrent: number;
    totalJobs: number;
  } {
    return {
      processingCount: getProcessingCount(),
      maxConcurrent: this.config.maxConcurrentJobs ?? 5,
      totalJobs: getAllJobs().length,
    };
  }

  /**
   * APIをシャットダウン
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// 型定義をエクスポート
export * from './types.js';
export * from './jobs/queue.js';
export * from './jobs/processor.js';
