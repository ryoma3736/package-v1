/**
 * 統合API - 型定義
 */

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type StepStatus = 'pending' | 'processing' | 'done' | 'failed' | 'skipped';

export interface JobProgress {
  analysis: StepStatus;
  packages: StepStatus;
  ads: StepStatus;
  texts: StepStatus;
}

export interface GenerateRequest {
  imageBuffer: Buffer;
  imagePath?: string;
  options?: GenerateOptions;
}

export interface GenerateOptions {
  brandName?: string;
  productName?: string;
  packageVariations?: number;
  adPlatforms?: string[];
  skipPackages?: boolean;
  skipAds?: boolean;
  skipTexts?: boolean;
}

export interface Job {
  id: string;
  status: JobStatus;
  progress: JobProgress;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
  result?: JobResult;
  options: GenerateOptions;
}

export interface JobResult {
  analysis?: unknown;
  packages?: unknown[];
  ads?: unknown[];
  texts?: unknown;
  downloadUrl?: string;
}

export interface GenerateResponse {
  jobId: string;
  status: JobStatus;
  estimatedTime: number;
  websocketUrl?: string;
}

export interface StatusResponse {
  jobId: string;
  status: JobStatus;
  progress: JobProgress;
  error?: string;
  downloadUrl?: string;
  result?: JobResult;
}

export interface ProgressEvent {
  type: 'progress' | 'complete' | 'error';
  jobId: string;
  step?: keyof JobProgress;
  status?: StepStatus;
  message?: string;
  progress?: JobProgress;
  result?: JobResult;
}

export interface APIError {
  code: string;
  message: string;
  details?: unknown;
}
