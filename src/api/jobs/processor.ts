/**
 * ジョブプロセッサ - 非同期処理実行
 */

import type { Job, JobResult, GenerateOptions } from '../types.js';
import {
  updateJobStatus,
  updateJobProgress,
  setJobResult,
  setJobError,
} from './queue.js';

// 処理中のジョブを追跡
const processingJobs = new Set<string>();

export interface ProcessorConfig {
  claudeApiKey?: string;
  openaiApiKey?: string;
}

/**
 * ジョブを処理
 */
export async function processJob(
  job: Job,
  imageBuffer: Buffer,
  config: ProcessorConfig
): Promise<void> {
  if (processingJobs.has(job.id)) {
    console.warn(`Job ${job.id} is already being processed`);
    return;
  }

  processingJobs.add(job.id);

  try {
    updateJobStatus(job.id, 'processing');

    const result: JobResult = {};

    // 1. 画像分析
    updateJobProgress(job.id, 'analysis', 'processing');
    try {
      result.analysis = await runImageAnalysis(imageBuffer, config);
      updateJobProgress(job.id, 'analysis', 'done');
    } catch (error) {
      updateJobProgress(job.id, 'analysis', 'failed');
      throw new Error(`画像分析に失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 2. パッケージデザイン生成
    if (!job.options.skipPackages) {
      updateJobProgress(job.id, 'packages', 'processing');
      try {
        result.packages = await runPackageGeneration(
          result.analysis,
          job.options,
          config
        );
        updateJobProgress(job.id, 'packages', 'done');
      } catch (error) {
        updateJobProgress(job.id, 'packages', 'failed');
        console.error('Package generation failed:', error);
        // パッケージ生成失敗は続行可能
      }
    }

    // 3. 広告画像生成
    if (!job.options.skipAds) {
      updateJobProgress(job.id, 'ads', 'processing');
      try {
        result.ads = await runAdGeneration(
          result.analysis,
          job.options,
          config
        );
        updateJobProgress(job.id, 'ads', 'done');
      } catch (error) {
        updateJobProgress(job.id, 'ads', 'failed');
        console.error('Ad generation failed:', error);
        // 広告生成失敗は続行可能
      }
    }

    // 4. テキスト生成
    if (!job.options.skipTexts) {
      updateJobProgress(job.id, 'texts', 'processing');
      try {
        result.texts = await runTextGeneration(
          result.analysis,
          job.options,
          config
        );
        updateJobProgress(job.id, 'texts', 'done');
      } catch (error) {
        updateJobProgress(job.id, 'texts', 'failed');
        console.error('Text generation failed:', error);
        // テキスト生成失敗は続行可能
      }
    }

    // 結果を保存
    result.downloadUrl = `/api/v1/download/${job.id}`;
    setJobResult(job.id, result);
    updateJobStatus(job.id, 'completed');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    setJobError(job.id, errorMessage);
  } finally {
    processingJobs.delete(job.id);
  }
}

/**
 * 画像分析を実行
 */
async function runImageAnalysis(
  imageBuffer: Buffer,
  config: ProcessorConfig
): Promise<unknown> {
  // 動的インポートで循環依存を回避
  const { analyzeProductImage } = await import('../../services/image-analyzer/index.js');

  if (!config.claudeApiKey) {
    throw new Error('Claude API key is required for image analysis');
  }

  const result = await analyzeProductImage(imageBuffer, {
    apiKey: config.claudeApiKey,
    paletteSize: 5,
    timeout: 30000,
  });

  return result;
}

/**
 * パッケージデザイン生成を実行
 */
async function runPackageGeneration(
  analysis: unknown,
  options: GenerateOptions,
  config: ProcessorConfig
): Promise<unknown[]> {
  const { generatePackageDesignsAuto } = await import('../../services/package-generator/index.js');

  if (!config.openaiApiKey) {
    throw new Error('OpenAI API key is required for package generation');
  }

  const result = await generatePackageDesignsAuto(
    analysis as Parameters<typeof generatePackageDesignsAuto>[0],
    'openai',
    config.openaiApiKey,
    {
      brandName: options.brandName,
      productName: options.productName,
      variationCount: options.packageVariations || 3,
    }
  );

  return result.designs;
}

/**
 * 広告画像生成を実行
 */
async function runAdGeneration(
  analysis: unknown,
  options: GenerateOptions,
  config: ProcessorConfig
): Promise<unknown[]> {
  const { AdGeneratorService } = await import('../../services/ad-generator/index.js');

  if (!config.openaiApiKey) {
    throw new Error('OpenAI API key is required for ad generation');
  }

  const service = new AdGeneratorService(config.openaiApiKey);

  const platforms = (options.adPlatforms || [
    'instagram-square',
    'twitter-card',
    'facebook-feed',
    'web-banner-medium-rectangle',
  ]) as Parameters<typeof service.generateBatch>[0]['platforms'];

  const result = await service.generateBatch({
    productAnalysis: analysis as Parameters<typeof service.generateBatch>[0]['productAnalysis'],
    platforms,
    commonConfig: {
      brandName: options.brandName,
      style: 'realistic',
    },
  });

  return result.results;
}

/**
 * テキスト生成を実行
 */
async function runTextGeneration(
  analysis: unknown,
  options: GenerateOptions,
  config: ProcessorConfig
): Promise<unknown> {
  const { TextGeneratorService } = await import('../../services/text-generator/index.js');

  if (!config.claudeApiKey) {
    throw new Error('Claude API key is required for text generation');
  }

  const service = new TextGeneratorService(config.claudeApiKey);

  const result = await service.generateAll({
    productAnalysis: analysis as Parameters<typeof service.generateAll>[0]['productAnalysis'],
    brandName: options.brandName,
    productName: options.productName,
    tone: 'professional',
    targetAudience: '一般消費者',
  });

  return result;
}

/**
 * 処理中のジョブ数を取得
 */
export function getProcessingCount(): number {
  return processingJobs.size;
}

/**
 * 特定のジョブが処理中か確認
 */
export function isProcessing(jobId: string): boolean {
  return processingJobs.has(jobId);
}
