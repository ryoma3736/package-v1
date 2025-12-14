/**
 * E2E テスト - 生成フロー
 *
 * 画像アップロードから結果取得までの全フローをテスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createJob,
  getJob,
  updateJobStatus,
  updateJobProgress,
  setJobResult,
  setJobError,
  deleteJob,
  getAllJobs,
  subscribeProgress,
  estimateProcessingTime,
} from '../../src/api/jobs/queue.js';
import { ProductGenerationAPI } from '../../src/api/index.js';

describe('E2E: Generation Flow', () => {
  let api: ProductGenerationAPI;

  beforeEach(() => {
    api = new ProductGenerationAPI({
      maxConcurrentJobs: 5,
      cleanupIntervalMs: 0,
    });

    // クリーンアップ
    getAllJobs().forEach((job) => deleteJob(job.id));
  });

  afterEach(() => {
    api.shutdown();
    getAllJobs().forEach((job) => deleteJob(job.id));
  });

  describe('Job Lifecycle', () => {
    it('should create job with correct initial state', () => {
      const job = createJob({
        brandName: 'TestBrand',
        productName: 'TestProduct',
      });

      expect(job.status).toBe('pending');
      expect(job.progress.analysis).toBe('pending');
      expect(job.progress.packages).toBe('pending');
      expect(job.progress.ads).toBe('pending');
      expect(job.progress.texts).toBe('pending');
      expect(job.options.brandName).toBe('TestBrand');
    });

    it('should transition through job states correctly', () => {
      const job = createJob();
      const states: string[] = [];

      // 購読
      const unsubscribe = subscribeProgress(job.id, (updatedJob) => {
        states.push(updatedJob.status);
      });

      // 状態遷移
      updateJobStatus(job.id, 'processing');
      updateJobStatus(job.id, 'completed');

      unsubscribe();

      expect(states).toContain('pending');
      expect(states).toContain('processing');
      expect(states).toContain('completed');
    });

    it('should track progress through all steps', () => {
      const job = createJob();
      const progressHistory: string[] = [];

      const unsubscribe = subscribeProgress(job.id, (updatedJob) => {
        progressHistory.push(
          `${updatedJob.progress.analysis}-${updatedJob.progress.packages}-${updatedJob.progress.ads}-${updatedJob.progress.texts}`
        );
      });

      // ステップを順次実行
      updateJobProgress(job.id, 'analysis', 'processing');
      updateJobProgress(job.id, 'analysis', 'done');
      updateJobProgress(job.id, 'packages', 'processing');
      updateJobProgress(job.id, 'packages', 'done');
      updateJobProgress(job.id, 'ads', 'processing');
      updateJobProgress(job.id, 'ads', 'done');
      updateJobProgress(job.id, 'texts', 'processing');
      updateJobProgress(job.id, 'texts', 'done');

      unsubscribe();

      const finalJob = getJob(job.id);
      expect(finalJob?.progress.analysis).toBe('done');
      expect(finalJob?.progress.packages).toBe('done');
      expect(finalJob?.progress.ads).toBe('done');
      expect(finalJob?.progress.texts).toBe('done');
    });

    it('should handle job failure correctly', () => {
      const job = createJob();

      updateJobStatus(job.id, 'processing');
      updateJobProgress(job.id, 'analysis', 'done');
      updateJobProgress(job.id, 'packages', 'processing');
      setJobError(job.id, 'API rate limit exceeded');

      const failedJob = getJob(job.id);
      expect(failedJob?.status).toBe('failed');
      expect(failedJob?.error).toBe('API rate limit exceeded');
      expect(failedJob?.completedAt).toBeDefined();
    });

    it('should skip steps when configured', () => {
      const job = createJob({
        skipPackages: true,
        skipAds: true,
      });

      expect(job.progress.analysis).toBe('pending');
      expect(job.progress.packages).toBe('skipped');
      expect(job.progress.ads).toBe('skipped');
      expect(job.progress.texts).toBe('pending');
    });
  });

  describe('Result Storage', () => {
    it('should store and retrieve results', () => {
      const job = createJob();

      const result = {
        analysis: { category: 'food' },
        packages: [{ imageUrl: 'http://example.com/1.png' }],
        ads: [{ platform: 'instagram', imageUrl: 'http://example.com/ad.png' }],
        texts: { description: { long: 'Long text', short: 'Short', bullet_points: [] } },
      };

      setJobResult(job.id, result);

      const updatedJob = getJob(job.id);
      expect(updatedJob?.result).toEqual(result);
    });

    it('should include downloadUrl in result', () => {
      const job = createJob();

      setJobResult(job.id, {
        downloadUrl: `/api/v1/download/${job.id}`,
      });

      const updatedJob = getJob(job.id);
      expect(updatedJob?.result?.downloadUrl).toContain(job.id);
    });
  });

  describe('API Service', () => {
    it('should return system status', () => {
      const status = api.getSystemStatus();

      expect(status).toHaveProperty('processingCount');
      expect(status).toHaveProperty('maxConcurrent');
      expect(status).toHaveProperty('totalJobs');
      expect(status.maxConcurrent).toBe(5);
    });

    it('should return null for non-existent job', () => {
      const status = api.getStatus('non-existent-job');
      expect(status).toBeNull();
    });

    it('should list all jobs', () => {
      createJob();
      createJob();
      createJob();

      const jobs = api.listJobs();
      expect(jobs.length).toBeGreaterThanOrEqual(3);
    });

    it('should delete job', () => {
      const job = createJob();

      expect(api.deleteJob(job.id)).toBe(true);
      expect(api.getStatus(job.id)).toBeNull();
    });
  });

  describe('Time Estimation', () => {
    it('should estimate processing time for full generation', () => {
      const time = estimateProcessingTime({});
      expect(time).toBeGreaterThan(0);
    });

    it('should reduce time when skipping steps', () => {
      const fullTime = estimateProcessingTime({});
      const partialTime = estimateProcessingTime({
        skipPackages: true,
        skipAds: true,
      });

      expect(partialTime).toBeLessThan(fullTime);
    });

    it('should increase time with more package variations', () => {
      const time3 = estimateProcessingTime({ packageVariations: 3 });
      const time5 = estimateProcessingTime({ packageVariations: 5 });

      expect(time5).toBeGreaterThan(time3);
    });
  });

  describe('Progress Subscription', () => {
    it('should notify subscribers of progress changes', () => {
      const job = createJob();
      const notifications: string[] = [];

      const unsubscribe = subscribeProgress(job.id, (updatedJob) => {
        notifications.push(`${updatedJob.status}:${updatedJob.progress.analysis}`);
      });

      updateJobStatus(job.id, 'processing');
      updateJobProgress(job.id, 'analysis', 'processing');
      updateJobProgress(job.id, 'analysis', 'done');

      unsubscribe();

      expect(notifications.length).toBeGreaterThan(1);
      expect(notifications).toContain('processing:processing');
      expect(notifications).toContain('processing:done');
    });

    it('should allow unsubscribing', () => {
      const job = createJob();
      let notificationCount = 0;

      const unsubscribe = subscribeProgress(job.id, () => {
        notificationCount++;
      });

      updateJobStatus(job.id, 'processing');
      unsubscribe();
      updateJobStatus(job.id, 'completed');

      // unsubscribe後は通知されないはず
      expect(notificationCount).toBeLessThan(3);
    });
  });
});

describe('E2E: Edge Cases', () => {
  beforeEach(() => {
    getAllJobs().forEach((job) => deleteJob(job.id));
  });

  afterEach(() => {
    getAllJobs().forEach((job) => deleteJob(job.id));
  });

  it('should handle rapid job creation', () => {
    const jobs = [];
    for (let i = 0; i < 10; i++) {
      jobs.push(createJob());
    }

    expect(jobs.length).toBe(10);
    expect(new Set(jobs.map((j) => j.id)).size).toBe(10); // All IDs unique
  });

  it('should handle parallel progress updates', () => {
    const job = createJob();

    // 並列で更新
    Promise.all([
      Promise.resolve(updateJobProgress(job.id, 'analysis', 'processing')),
      Promise.resolve(updateJobProgress(job.id, 'packages', 'processing')),
      Promise.resolve(updateJobProgress(job.id, 'ads', 'processing')),
    ]);

    const updatedJob = getJob(job.id);
    expect(updatedJob).toBeDefined();
  });

  it('should return undefined for operations on deleted job', () => {
    const job = createJob();
    deleteJob(job.id);

    expect(getJob(job.id)).toBeUndefined();
    expect(updateJobStatus(job.id, 'processing')).toBeUndefined();
  });
});
