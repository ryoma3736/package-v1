/**
 * ジョブキュー - インメモリ実装
 */

import { randomUUID } from 'crypto';
import type {
  Job,
  JobStatus,
  JobProgress,
  GenerateOptions,
  StepStatus,
} from '../types.js';

// インメモリジョブストア
const jobs = new Map<string, Job>();

// 進捗コールバック
type ProgressCallback = (job: Job) => void;
const progressCallbacks = new Map<string, Set<ProgressCallback>>();

/**
 * 新規ジョブを作成
 */
export function createJob(options: GenerateOptions = {}): Job {
  const id = randomUUID();
  const now = new Date();

  const job: Job = {
    id,
    status: 'pending',
    progress: {
      analysis: 'pending',
      packages: options.skipPackages ? 'skipped' : 'pending',
      ads: options.skipAds ? 'skipped' : 'pending',
      texts: options.skipTexts ? 'skipped' : 'pending',
    },
    createdAt: now,
    updatedAt: now,
    options,
  };

  jobs.set(id, job);
  return job;
}

/**
 * ジョブを取得
 */
export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

/**
 * 全ジョブを取得
 */
export function getAllJobs(): Job[] {
  return Array.from(jobs.values());
}

/**
 * ジョブステータスを更新
 */
export function updateJobStatus(id: string, status: JobStatus): Job | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;

  job.status = status;
  job.updatedAt = new Date();

  if (status === 'completed' || status === 'failed') {
    job.completedAt = new Date();
  }

  notifyProgress(job);
  return job;
}

/**
 * ジョブ進捗を更新
 */
export function updateJobProgress(
  id: string,
  step: keyof JobProgress,
  stepStatus: StepStatus
): Job | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;

  job.progress[step] = stepStatus;
  job.updatedAt = new Date();

  notifyProgress(job);
  return job;
}

/**
 * ジョブ結果を設定
 */
export function setJobResult(
  id: string,
  result: Job['result']
): Job | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;

  job.result = result;
  job.updatedAt = new Date();

  return job;
}

/**
 * ジョブエラーを設定
 */
export function setJobError(id: string, error: string): Job | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;

  job.error = error;
  job.status = 'failed';
  job.updatedAt = new Date();
  job.completedAt = new Date();

  notifyProgress(job);
  return job;
}

/**
 * ジョブを削除
 */
export function deleteJob(id: string): boolean {
  const callbacks = progressCallbacks.get(id);
  if (callbacks) {
    callbacks.clear();
    progressCallbacks.delete(id);
  }
  return jobs.delete(id);
}

/**
 * 古いジョブをクリーンアップ（1時間以上経過したもの）
 */
export function cleanupOldJobs(maxAgeMs: number = 3600000): number {
  const now = Date.now();
  let count = 0;

  for (const [id, job] of jobs.entries()) {
    const age = now - job.createdAt.getTime();
    if (age > maxAgeMs && (job.status === 'completed' || job.status === 'failed')) {
      deleteJob(id);
      count++;
    }
  }

  return count;
}

/**
 * 進捗コールバックを登録
 */
export function subscribeProgress(
  jobId: string,
  callback: ProgressCallback
): () => void {
  let callbacks = progressCallbacks.get(jobId);
  if (!callbacks) {
    callbacks = new Set();
    progressCallbacks.set(jobId, callbacks);
  }
  callbacks.add(callback);

  // 現在の状態を即座に通知
  const job = jobs.get(jobId);
  if (job) {
    callback(job);
  }

  // 購読解除関数を返す
  return () => {
    callbacks?.delete(callback);
    if (callbacks?.size === 0) {
      progressCallbacks.delete(jobId);
    }
  };
}

/**
 * 進捗を通知
 */
function notifyProgress(job: Job): void {
  const callbacks = progressCallbacks.get(job.id);
  if (callbacks) {
    for (const callback of callbacks) {
      try {
        callback(job);
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    }
  }
}

/**
 * 推定処理時間を計算（秒）
 */
export function estimateProcessingTime(options: GenerateOptions): number {
  let time = 10; // 基本分析時間

  if (!options.skipPackages) {
    time += (options.packageVariations || 3) * 15;
  }

  if (!options.skipAds) {
    time += (options.adPlatforms?.length || 4) * 10;
  }

  if (!options.skipTexts) {
    time += 10;
  }

  return time;
}
