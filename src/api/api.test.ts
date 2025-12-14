/**
 * 統合API テスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createJob,
  getJob,
  getAllJobs,
  updateJobStatus,
  updateJobProgress,
  setJobResult,
  setJobError,
  deleteJob,
  subscribeProgress,
  estimateProcessingTime,
  cleanupOldJobs,
} from './jobs/queue.js';
import { ProductGenerationAPI } from './index.js';

describe('Job Queue', () => {
  beforeEach(() => {
    // 各テスト前にジョブをクリア
    const jobs = getAllJobs();
    jobs.forEach((job) => deleteJob(job.id));
  });

  describe('createJob', () => {
    it('should create a new job with pending status', () => {
      const job = createJob();

      expect(job.id).toBeDefined();
      expect(job.status).toBe('pending');
      expect(job.progress.analysis).toBe('pending');
      expect(job.progress.packages).toBe('pending');
      expect(job.progress.ads).toBe('pending');
      expect(job.progress.texts).toBe('pending');
    });

    it('should skip steps when options are set', () => {
      const job = createJob({
        skipPackages: true,
        skipAds: true,
      });

      expect(job.progress.packages).toBe('skipped');
      expect(job.progress.ads).toBe('skipped');
      expect(job.progress.texts).toBe('pending');
    });
  });

  describe('getJob', () => {
    it('should retrieve an existing job', () => {
      const created = createJob();
      const retrieved = getJob(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return undefined for non-existent job', () => {
      const retrieved = getJob('non-existent-id');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('updateJobStatus', () => {
    it('should update job status', () => {
      const job = createJob();
      updateJobStatus(job.id, 'processing');

      const updated = getJob(job.id);
      expect(updated?.status).toBe('processing');
    });

    it('should set completedAt when completed', () => {
      const job = createJob();
      updateJobStatus(job.id, 'completed');

      const updated = getJob(job.id);
      expect(updated?.completedAt).toBeDefined();
    });
  });

  describe('updateJobProgress', () => {
    it('should update step progress', () => {
      const job = createJob();
      updateJobProgress(job.id, 'analysis', 'done');

      const updated = getJob(job.id);
      expect(updated?.progress.analysis).toBe('done');
    });
  });

  describe('setJobResult', () => {
    it('should set job result', () => {
      const job = createJob();
      const result = { analysis: { category: 'test' } };
      setJobResult(job.id, result);

      const updated = getJob(job.id);
      expect(updated?.result).toEqual(result);
    });
  });

  describe('setJobError', () => {
    it('should set error and mark job as failed', () => {
      const job = createJob();
      setJobError(job.id, 'Test error');

      const updated = getJob(job.id);
      expect(updated?.status).toBe('failed');
      expect(updated?.error).toBe('Test error');
    });
  });

  describe('deleteJob', () => {
    it('should delete a job', () => {
      const job = createJob();
      const deleted = deleteJob(job.id);

      expect(deleted).toBe(true);
      expect(getJob(job.id)).toBeUndefined();
    });

    it('should return false for non-existent job', () => {
      const deleted = deleteJob('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('subscribeProgress', () => {
    it('should notify on status changes', () => {
      const job = createJob();
      const updates: string[] = [];

      const unsubscribe = subscribeProgress(job.id, (updated) => {
        updates.push(updated.status);
      });

      // 初回コールバック
      expect(updates).toContain('pending');

      updateJobStatus(job.id, 'processing');
      expect(updates).toContain('processing');

      unsubscribe();
    });
  });

  describe('estimateProcessingTime', () => {
    it('should calculate base time for all steps', () => {
      const time = estimateProcessingTime({});
      expect(time).toBeGreaterThan(0);
    });

    it('should reduce time when skipping steps', () => {
      const fullTime = estimateProcessingTime({});
      const reducedTime = estimateProcessingTime({
        skipPackages: true,
        skipAds: true,
        skipTexts: true,
      });

      expect(reducedTime).toBeLessThan(fullTime);
    });
  });

  describe('cleanupOldJobs', () => {
    it('should not clean up recent jobs', () => {
      const job = createJob();
      updateJobStatus(job.id, 'completed');

      const cleaned = cleanupOldJobs(3600000); // 1時間
      expect(cleaned).toBe(0);
      expect(getJob(job.id)).toBeDefined();
    });
  });
});

describe('ProductGenerationAPI', () => {
  let api: ProductGenerationAPI;

  beforeEach(() => {
    api = new ProductGenerationAPI({
      maxConcurrentJobs: 5,
      cleanupIntervalMs: 0, // テスト中は無効
    });
  });

  afterEach(() => {
    api.shutdown();
    // ジョブをクリア
    const jobs = getAllJobs();
    jobs.forEach((job) => deleteJob(job.id));
  });

  describe('getStatus', () => {
    it('should return null for non-existent job', () => {
      const status = api.getStatus('non-existent');
      expect(status).toBeNull();
    });
  });

  describe('listJobs', () => {
    it('should return all jobs', () => {
      createJob();
      createJob();

      const jobs = api.listJobs();
      expect(jobs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getSystemStatus', () => {
    it('should return system status', () => {
      const status = api.getSystemStatus();

      expect(status).toHaveProperty('processingCount');
      expect(status).toHaveProperty('maxConcurrent');
      expect(status).toHaveProperty('totalJobs');
    });
  });

  describe('deleteJob', () => {
    it('should delete a job', () => {
      const job = createJob();
      const deleted = api.deleteJob(job.id);

      expect(deleted).toBe(true);
      expect(api.getStatus(job.id)).toBeNull();
    });
  });
});
