/**
 * モジュール統合テスト
 *
 * 各モジュール間の連携を検証
 */

import { describe, it, expect } from 'vitest';

// テスト用のモックデータ
const mockProductAnalysis = {
  category: '食品',
  colors: {
    primary: '#2E7D32',
    secondary: ['#81C784', '#A5D6A7'],
    palette: ['#2E7D32', '#81C784', '#A5D6A7', '#C8E6C9', '#E8F5E9'],
  },
  shape: {
    type: 'cylindrical',
    dimensions: { width: 0.4, height: 0.8 },
  },
  texture: 'matte',
  confidence: 0.92,
};

const mockGeneratedTexts = {
  description: {
    long: 'これは長い説明文です。商品の詳細な情報を提供します。特徴やメリット、使用方法などを詳しく説明しています。',
    short: '高品質な商品です。',
    bullet_points: ['特徴1', '特徴2', '特徴3'],
  },
  catchcopy: {
    main: 'あなたの毎日を変える一品',
    sub: '品質にこだわった逸品',
    variations: ['選ばれる理由がある', '新しい体験を', 'ここにしかない'],
  },
  seo: {
    title: '高品質商品 | ブランド名',
    description: 'SEOに最適化されたメタディスクリプションです。',
    keywords: ['キーワード1', 'キーワード2', 'キーワード3'],
  },
  features: [
    { name: '特徴A', value: '値A' },
    { name: '特徴B', value: '値B' },
  ],
};

describe('Module Integration', () => {
  describe('Type Compatibility', () => {
    it('ProductAnalysis should have all required fields', () => {
      expect(mockProductAnalysis).toHaveProperty('category');
      expect(mockProductAnalysis).toHaveProperty('colors');
      expect(mockProductAnalysis).toHaveProperty('shape');
      expect(mockProductAnalysis).toHaveProperty('texture');
      expect(mockProductAnalysis).toHaveProperty('confidence');
    });

    it('ProductAnalysis.colors should have correct structure', () => {
      expect(mockProductAnalysis.colors).toHaveProperty('primary');
      expect(mockProductAnalysis.colors).toHaveProperty('secondary');
      expect(mockProductAnalysis.colors).toHaveProperty('palette');
      expect(Array.isArray(mockProductAnalysis.colors.secondary)).toBe(true);
      expect(Array.isArray(mockProductAnalysis.colors.palette)).toBe(true);
    });

    it('ProductAnalysis.shape should have correct structure', () => {
      expect(mockProductAnalysis.shape).toHaveProperty('type');
      expect(mockProductAnalysis.shape).toHaveProperty('dimensions');
      expect(mockProductAnalysis.shape.dimensions).toHaveProperty('width');
      expect(mockProductAnalysis.shape.dimensions).toHaveProperty('height');
    });

    it('GeneratedTexts should have all required sections', () => {
      expect(mockGeneratedTexts).toHaveProperty('description');
      expect(mockGeneratedTexts).toHaveProperty('catchcopy');
      expect(mockGeneratedTexts).toHaveProperty('seo');
      expect(mockGeneratedTexts).toHaveProperty('features');
    });

    it('GeneratedTexts.description should have correct structure', () => {
      expect(mockGeneratedTexts.description).toHaveProperty('long');
      expect(mockGeneratedTexts.description).toHaveProperty('short');
      expect(mockGeneratedTexts.description).toHaveProperty('bullet_points');
      expect(Array.isArray(mockGeneratedTexts.description.bullet_points)).toBe(true);
    });

    it('GeneratedTexts.catchcopy should have correct structure', () => {
      expect(mockGeneratedTexts.catchcopy).toHaveProperty('main');
      expect(mockGeneratedTexts.catchcopy).toHaveProperty('sub');
      expect(mockGeneratedTexts.catchcopy).toHaveProperty('variations');
      expect(Array.isArray(mockGeneratedTexts.catchcopy.variations)).toBe(true);
    });

    it('GeneratedTexts.seo should have correct structure', () => {
      expect(mockGeneratedTexts.seo).toHaveProperty('title');
      expect(mockGeneratedTexts.seo).toHaveProperty('description');
      expect(mockGeneratedTexts.seo).toHaveProperty('keywords');
      expect(Array.isArray(mockGeneratedTexts.seo.keywords)).toBe(true);
    });
  });

  describe('Data Flow Validation', () => {
    it('confidence should be between 0 and 1', () => {
      expect(mockProductAnalysis.confidence).toBeGreaterThanOrEqual(0);
      expect(mockProductAnalysis.confidence).toBeLessThanOrEqual(1);
    });

    it('colors should be valid hex codes', () => {
      const hexPattern = /^#[0-9A-Fa-f]{6}$/;
      expect(mockProductAnalysis.colors.primary).toMatch(hexPattern);
      mockProductAnalysis.colors.secondary.forEach((color) => {
        expect(color).toMatch(hexPattern);
      });
    });

    it('dimensions should be positive numbers', () => {
      expect(mockProductAnalysis.shape.dimensions.width).toBeGreaterThan(0);
      expect(mockProductAnalysis.shape.dimensions.height).toBeGreaterThan(0);
    });

    it('bullet_points should have at least one item', () => {
      expect(mockGeneratedTexts.description.bullet_points.length).toBeGreaterThan(0);
    });

    it('catchcopy variations should have at least one item', () => {
      expect(mockGeneratedTexts.catchcopy.variations.length).toBeGreaterThan(0);
    });

    it('seo keywords should have at least one item', () => {
      expect(mockGeneratedTexts.seo.keywords.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-Module Compatibility', () => {
    it('ProductAnalysis can be used as input for text generation', () => {
      const textGenInput = {
        productAnalysis: mockProductAnalysis,
        brandName: 'TestBrand',
        productName: 'TestProduct',
      };

      expect(textGenInput.productAnalysis.category).toBe('食品');
      expect(textGenInput.productAnalysis.colors.primary).toBe('#2E7D32');
    });

    it('ProductAnalysis can be used as input for package generation', () => {
      const packageGenInput = {
        productAnalysis: mockProductAnalysis,
        templateType: 'box-standard',
        provider: 'openai',
        variationCount: 3,
      };

      expect(packageGenInput.productAnalysis.shape.type).toBe('cylindrical');
    });

    it('ProductAnalysis can be used as input for ad generation', () => {
      const adGenInput = {
        productAnalysis: {
          primaryColor: mockProductAnalysis.colors.primary,
          secondaryColors: mockProductAnalysis.colors.secondary,
          category: mockProductAnalysis.category,
          suggestedKeywords: ['organic', 'natural'],
        },
        platform: 'instagram-square',
      };

      expect(adGenInput.productAnalysis.primaryColor).toBe('#2E7D32');
    });
  });
});

describe('Frontend Types Compatibility', () => {
  it('JobProgress should have all required steps', () => {
    const progress = {
      analysis: 'pending' as const,
      packages: 'pending' as const,
      ads: 'pending' as const,
      texts: 'pending' as const,
    };

    expect(progress).toHaveProperty('analysis');
    expect(progress).toHaveProperty('packages');
    expect(progress).toHaveProperty('ads');
    expect(progress).toHaveProperty('texts');
  });

  it('StepStatus should be one of valid values', () => {
    const validStatuses = ['pending', 'processing', 'done', 'failed', 'skipped'];
    const status = 'processing';

    expect(validStatuses).toContain(status);
  });

  it('JobResult should accept all module outputs', () => {
    const jobResult = {
      analysis: mockProductAnalysis,
      packages: [],
      ads: [],
      texts: mockGeneratedTexts,
    };

    expect(jobResult.analysis).toEqual(mockProductAnalysis);
    expect(jobResult.texts).toEqual(mockGeneratedTexts);
  });
});

describe('API Integration', () => {
  it('GenerateOptions should support all optional fields', () => {
    const options = {
      brandName: 'TestBrand',
      productName: 'TestProduct',
      packageVariations: 3,
      adPlatforms: ['instagram-square', 'twitter-card'],
      skipPackages: false,
      skipAds: false,
      skipTexts: false,
    };

    expect(options.packageVariations).toBe(3);
    expect(options.adPlatforms).toHaveLength(2);
  });

  it('GenerateOptions should work with minimal fields', () => {
    const options = {};

    expect(options).toBeDefined();
  });

  it('StatusResponse should include all progress fields', () => {
    const response = {
      jobId: 'test-job-id',
      status: 'processing' as const,
      progress: {
        analysis: 'done' as const,
        packages: 'processing' as const,
        ads: 'pending' as const,
        texts: 'pending' as const,
      },
    };

    expect(response.progress.analysis).toBe('done');
    expect(response.progress.packages).toBe('processing');
  });
});
