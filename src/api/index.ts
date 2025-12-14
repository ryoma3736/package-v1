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
    // 同時実行数をチェック
    const maxConcurrent = this.config.maxConcurrentJobs || 5;
    if (getProcessingCount() >= maxConcurrent) {
      throw new Error('Maximum concurrent jobs reached. Please try again later.');
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
