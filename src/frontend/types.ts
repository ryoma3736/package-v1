/**
 * フロントエンド用型定義
 */

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type StepStatus = 'pending' | 'processing' | 'done' | 'failed' | 'skipped';

export interface JobProgress {
  analysis: StepStatus;
  packages: StepStatus;
  ads: StepStatus;
  texts: StepStatus;
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

export interface JobResult {
  analysis?: ProductAnalysis;
  packages?: PackageDesign[];
  ads?: AdResult[];
  texts?: GeneratedTexts;
  downloadUrl?: string;
}

export interface ProductAnalysis {
  category: string;
  colors: {
    primary: string;
    secondary: string[];
    palette: string[];
  };
  shape: {
    type: string;
    dimensions: {
      width: number;
      height: number;
    };
  };
  texture: string;
  confidence: number;
}

export interface PackageDesign {
  variationType: string;
  imageUrl: string;
  imageBase64?: string;
  size: { width: number; height: number };
}

export interface AdResult {
  platform: string;
  imageUrl: string;
  imageBuffer?: string;
  size: { width: number; height: number };
}

export interface GeneratedTexts {
  description: {
    long: string;
    short: string;
    bullet_points: string[];
  };
  catchcopy: {
    main: string;
    sub: string;
    variations: string[];
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  features: {
    name: string;
    value: string;
  }[];
}

export interface UploadState {
  file: File | null;
  preview: string | null;
  isDragging: boolean;
  error: string | null;
}

export interface ProgressStep {
  id: keyof JobProgress;
  label: string;
  description: string;
  estimatedTime: number;
}

export const PROGRESS_STEPS: ProgressStep[] = [
  {
    id: 'analysis',
    label: '画像分析',
    description: '商品のカテゴリ、色、形状を分析中',
    estimatedTime: 10,
  },
  {
    id: 'packages',
    label: 'パッケージ生成',
    description: 'パッケージデザインを生成中',
    estimatedTime: 45,
  },
  {
    id: 'ads',
    label: '広告画像生成',
    description: '各プラットフォーム向け広告を生成中',
    estimatedTime: 40,
  },
  {
    id: 'texts',
    label: 'テキスト生成',
    description: '商品説明・キャッチコピーを生成中',
    estimatedTime: 10,
  },
];
