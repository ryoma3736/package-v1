/**
 * ECテキスト生成エンジンのテスト
 */

import { describe, it, expect } from 'vitest';
import type {
  GeneratedTexts,
  TextGenerationOptions,
} from './types.js';
import type {
  DescriptionResult,
  CatchcopyResult,
  SEOResult,
} from './index.js';
import {
  validateDescriptionLength,
  validateCatchcopyQuality,
  validateSEOQuality,
  calculateSEOScore,
} from './index.js';

describe('ECテキスト生成エンジン', () => {
  describe('型定義のテスト', () => {
    it('GeneratedTexts型が正しく定義されている', () => {
      const mockTexts: GeneratedTexts = {
        description: {
          long: 'これは長い商品説明です。'.repeat(50),
          short: 'これは短い商品説明です。',
          bullet_points: ['特徴1', '特徴2', '特徴3'],
        },
        catchcopy: {
          main: 'メインキャッチコピー',
          sub: 'サブキャッチコピー',
          variations: ['代替1', '代替2', '代替3'],
        },
        seo: {
          title: 'SEOタイトル',
          description: 'メタディスクリプション',
          keywords: ['キーワード1', 'キーワード2'],
        },
        features: [
          { name: '特徴1', value: '値1' },
          { name: '特徴2', value: '値2' },
        ],
      };

      expect(mockTexts.description).toBeDefined();
      expect(mockTexts.catchcopy).toBeDefined();
      expect(mockTexts.seo).toBeDefined();
      expect(mockTexts.features).toBeDefined();
    });

    it('TextGenerationOptions型が正しく定義されている', () => {
      const mockOptions: TextGenerationOptions = {
        apiKey: 'test-api-key',
        productInfo: {
          name: 'テスト商品',
          brand: 'テストブランド',
          price: 1980,
          category: 'テスト',
          targetAudience: 'テスト層',
        },
        tone: 'professional',
        language: 'ja',
      };

      expect(mockOptions.apiKey).toBe('test-api-key');
      expect(mockOptions.productInfo?.name).toBe('テスト商品');
      expect(mockOptions.tone).toBe('professional');
    });
  });

  describe('説明文検証のテスト', () => {
    it('適切な長さの説明文は検証をパスする', () => {
      const description: DescriptionResult = {
        long: 'a'.repeat(700),
        short: 'a'.repeat(150),
        bullet_points: ['特徴1', '特徴2', '特徴3', '特徴4'],
      };

      const result = validateDescriptionLength(description);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('長文が短すぎる場合は警告が出る', () => {
      const description: DescriptionResult = {
        long: 'a'.repeat(300),
        short: 'a'.repeat(150),
        bullet_points: ['特徴1', '特徴2', '特徴3'],
      };

      const result = validateDescriptionLength(description);
      expect(result.valid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('長文説明の文字数が範囲外');
    });

    it('短文が長すぎる場合は警告が出る', () => {
      const description: DescriptionResult = {
        long: 'a'.repeat(700),
        short: 'a'.repeat(300),
        bullet_points: ['特徴1', '特徴2', '特徴3'],
      };

      const result = validateDescriptionLength(description);
      expect(result.valid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('短文説明の文字数が範囲外');
    });

    it('箇条書きが少なすぎる場合は警告が出る', () => {
      const description: DescriptionResult = {
        long: 'a'.repeat(700),
        short: 'a'.repeat(150),
        bullet_points: ['特徴1', '特徴2'],
      };

      const result = validateDescriptionLength(description);
      expect(result.valid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('箇条書きポイントが少なすぎます');
    });
  });

  describe('キャッチコピー検証のテスト', () => {
    it('適切なキャッチコピーは検証をパスする', () => {
      const catchcopy: CatchcopyResult = {
        main: '魅力的なキャッチコピー',
        sub: 'サブキャッチコピー',
        variations: ['代替1', '代替2', '代替3', '代替4'],
      };

      const result = validateCatchcopyQuality(catchcopy);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('メインコピーが長すぎる場合は警告が出る', () => {
      const catchcopy: CatchcopyResult = {
        main: 'a'.repeat(40),
        sub: 'サブキャッチコピー',
        variations: ['代替1', '代替2', '代替3'],
      };

      const result = validateCatchcopyQuality(catchcopy, 30);
      expect(result.valid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('メインコピーが長すぎます');
    });

    it('代替案が少なすぎる場合は警告が出る', () => {
      const catchcopy: CatchcopyResult = {
        main: 'メインコピー',
        sub: 'サブコピー',
        variations: ['代替1', '代替2'],
      };

      const result = validateCatchcopyQuality(catchcopy);
      expect(result.valid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('代替案が少なすぎます');
    });

    it('代替案に重複がある場合は警告が出る', () => {
      const catchcopy: CatchcopyResult = {
        main: 'メインコピー',
        sub: 'サブコピー',
        variations: ['代替1', '代替2', '代替1', '代替3'],
      };

      const result = validateCatchcopyQuality(catchcopy);
      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('代替案に重複があります');
    });

    it('メインコピーと代替案が重複している場合は警告が出る', () => {
      const catchcopy: CatchcopyResult = {
        main: 'メインコピー',
        sub: 'サブコピー',
        variations: ['メインコピー', '代替2', '代替3', '代替4'],
      };

      const result = validateCatchcopyQuality(catchcopy);
      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('メインコピーと代替案が重複しています');
    });
  });

  describe('SEO検証のテスト', () => {
    it('適切なSEOテキストは検証をパスする', () => {
      const seo: SEOResult = {
        title: 'これは適切な長さのSEOタイトルでキーワード1を含む良い例です',
        description:
          'これは適切な長さのメタディスクリプションです。キーワード1を含む検索結果に表示される重要なテキストで、ユーザーにクリックを促す内容となっています。160文字以内に収まるように調整されており、SEO対策として最適化されたテキストとなっております。',
        keywords: [
          'キーワード1',
          'キーワード2',
          'キーワード3',
          'キーワード4',
          'キーワード5',
        ],
      };

      const result = validateSEOQuality(seo);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.score).toBeGreaterThan(80);
    });

    it('タイトルが長すぎる場合は警告が出る', () => {
      const seo: SEOResult = {
        title: 'a'.repeat(70),
        description: 'a'.repeat(150),
        keywords: ['k1', 'k2', 'k3', 'k4', 'k5'],
      };

      const result = validateSEOQuality(seo);
      expect(result.valid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('SEOタイトルが長すぎます');
      expect(result.score).toBeLessThan(100);
    });

    it('ディスクリプションが短すぎる場合は警告が出る', () => {
      const seo: SEOResult = {
        title: 'これは適切な長さのSEOタイトルです（30-60文字）',
        description: 'a'.repeat(100),
        keywords: ['k1', 'k2', 'k3', 'k4', 'k5'],
      };

      const result = validateSEOQuality(seo);
      expect(result.valid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('メタディスクリプションが短すぎます'))).toBe(true);
    });

    it('キーワードが少なすぎる場合は警告が出る', () => {
      const seo: SEOResult = {
        title: 'これは適切な長さのSEOタイトルでk1を含む',
        description: 'a'.repeat(140),
        keywords: ['k1', 'k2', 'k3'],
      };

      const result = validateSEOQuality(seo);
      expect(result.valid).toBe(false);
      expect(result.warnings.some(w => w.includes('キーワードが少なすぎます'))).toBe(true);
    });

    it('キーワードに重複がある場合は警告が出る', () => {
      const seo: SEOResult = {
        title: 'SEOタイトル',
        description: 'a'.repeat(150),
        keywords: ['keyword1', 'keyword2', 'Keyword1', 'keyword3', 'keyword4'],
      };

      const result = validateSEOQuality(seo);
      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('キーワードに重複があります');
    });

    it('タイトルにキーワードが含まれていない場合は警告が出る', () => {
      const seo: SEOResult = {
        title: 'このタイトルには何も重要な語句が入っていません',
        description: 'a'.repeat(140),
        keywords: ['全く関係ない', 'キーワード群', 'ですね', 'まったく', 'ダメ'],
      };

      const result = validateSEOQuality(seo);
      expect(result.warnings.some(w => w.includes('タイトルに主要キーワードが含まれていません'))).toBe(true);
    });
  });

  describe('SEOスコア計算のテスト', () => {
    it('キーワード密度が理想的な場合はスコアが高い', () => {
      const seo: SEOResult = {
        title: '最高の商品をご紹介 おすすめの逸品を厳選してお届けします',
        description: '最高の商品をご紹介します。厳選されたおすすめの逸品を多数取り揃えています。品質にこだわった商品ラインナップで、お客様のご期待にお応えいたします。商品の詳細情報もご確認いただけます。おすすめ商品が満載です。',
        keywords: ['最高', '商品', 'おすすめ', '逸品', '厳選'],
      };

      const fullText = '最高の商品です。おすすめの逸品を厳選してご紹介。品質にこだわった商品ラインナップで、お客様のご期待にお応えいたします。'.repeat(20);
      const score = calculateSEOScore(seo, fullText);

      expect(score).toBeGreaterThan(60);
    });

    it('キーワード密度が低すぎる場合はスコアが下がる', () => {
      const seo: SEOResult = {
        title: 'タイトル',
        description: 'ディスクリプション',
        keywords: ['全く', '使われない', 'キーワード'],
      };

      const fullText = 'これは全く関係のないテキストです。'.repeat(50);
      const score = calculateSEOScore(seo, fullText);

      expect(score).toBeLessThan(70);
    });
  });

  describe('エッジケースのテスト', () => {
    it('空の配列を処理できる', () => {
      const description: DescriptionResult = {
        long: 'テキスト',
        short: 'テキスト',
        bullet_points: [],
      };

      const result = validateDescriptionLength(description);
      expect(result.valid).toBe(false);
    });

    it('非常に長いテキストを処理できる', () => {
      const description: DescriptionResult = {
        long: 'a'.repeat(5000),
        short: 'a'.repeat(1000),
        bullet_points: ['1', '2', '3'],
      };

      const result = validateDescriptionLength(description);
      expect(result).toBeDefined();
    });

    it('特殊文字を含むテキストを処理できる', () => {
      const catchcopy: CatchcopyResult = {
        main: '特殊文字: @#$%^&*()',
        sub: 'サブ: 🎉✨',
        variations: ['絵文字💯', '記号!?', '日本語'],
      };

      const result = validateCatchcopyQuality(catchcopy);
      expect(result).toBeDefined();
    });
  });
});
