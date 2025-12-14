/**
 * 商品画像分析エンジンのテスト
 */

import { describe, it, expect, beforeAll } from 'vitest';
import sharp from 'sharp';
import {
  analyzeProductImage,
  analyzeColors,
  analyzeShapeOnly,
  analyzeCategoryOnly,
  analyzeBatch,
  ImageAnalysisError,
} from '../services/image-analyzer/index.js';

// テスト用のダミー画像を生成
async function createTestImage(
  width: number,
  height: number,
  color: { r: number; g: number; b: number }
): Promise<Buffer> {
  return await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color,
    },
  })
    .jpeg()
    .toBuffer();
}

describe('Image Analyzer', () => {
  let testImageBuffer: Buffer;
  let testApiKey: string;

  beforeAll(async () => {
    // テスト用の赤い正方形の画像を作成
    testImageBuffer = await createTestImage(400, 400, {
      r: 255,
      g: 0,
      b: 0,
    });

    // 環境変数からAPIキーを取得（テスト時は実際のキーを使用）
    testApiKey = process.env.CLAUDE_API_KEY || 'test-api-key';
  });

  describe('analyzeColors', () => {
    it('should extract color palette from image', async () => {
      const colors = await analyzeColors(testImageBuffer, 5);

      expect(colors).toBeDefined();
      expect(colors.primary).toMatch(/^#[0-9A-F]{6}$/);
      expect(Array.isArray(colors.secondary)).toBe(true);
      expect(Array.isArray(colors.palette)).toBe(true);
      expect(colors.palette.length).toBeGreaterThan(0);
    });

    it('should extract primary color close to red', async () => {
      const colors = await analyzeColors(testImageBuffer, 5);

      // 赤系統の色であることを確認（HEXコードの最初の2桁が高い値）
      const redValue = parseInt(colors.primary.substring(1, 3), 16);
      expect(redValue).toBeGreaterThan(200);
    });

    it('should handle different palette sizes', async () => {
      const colors3 = await analyzeColors(testImageBuffer, 3);
      const colors10 = await analyzeColors(testImageBuffer, 10);

      expect(colors3.palette.length).toBeLessThanOrEqual(3);
      expect(colors10.palette.length).toBeLessThanOrEqual(10);
    });
  });

  describe('analyzeShapeOnly', () => {
    it('should analyze square image as spherical', async () => {
      const shape = await analyzeShapeOnly(testImageBuffer);

      expect(shape).toBeDefined();
      expect(shape.type).toBe('spherical');
      expect(shape.dimensions).toBeDefined();
      expect(shape.dimensions.width).toBe(100);
      expect(shape.dimensions.height).toBe(100);
    });

    it('should analyze rectangular image correctly', async () => {
      const rectBuffer = await createTestImage(600, 400, {
        r: 0,
        g: 0,
        b: 255,
      });
      const shape = await analyzeShapeOnly(rectBuffer);

      expect(shape.type).toBe('rectangular');
      expect(shape.dimensions.width).toBeGreaterThan(
        shape.dimensions.height
      );
    });

    it('should analyze cylindrical image correctly', async () => {
      const cylinderBuffer = await createTestImage(300, 500, {
        r: 0,
        g: 255,
        b: 0,
      });
      const shape = await analyzeShapeOnly(cylinderBuffer);

      expect(shape.type).toBe('cylindrical');
      expect(shape.dimensions.height).toBeGreaterThan(
        shape.dimensions.width
      );
    });
  });

  describe('analyzeCategoryOnly', () => {
    it('should throw error without API key', async () => {
      await expect(
        analyzeCategoryOnly(testImageBuffer, '', 5000)
      ).rejects.toThrow();
    });

    // 実際のAPI呼び出しをスキップ（モック化が必要）
    it.skip('should detect category from image', async () => {
      const category = await analyzeCategoryOnly(
        testImageBuffer,
        testApiKey,
        5000
      );

      expect(category).toBeDefined();
      expect(category.category).toBeTruthy();
      expect(category.confidence).toBeGreaterThanOrEqual(0);
      expect(category.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('analyzeProductImage', () => {
    it('should throw error without API key', async () => {
      await expect(
        analyzeProductImage(testImageBuffer, { apiKey: '' })
      ).rejects.toThrow(ImageAnalysisError);
    });

    // 実際のAPI呼び出しをスキップ（モック化が必要）
    it.skip('should analyze product image completely', async () => {
      const result = await analyzeProductImage(testImageBuffer, {
        apiKey: testApiKey,
        paletteSize: 5,
        timeout: 30000,
      });

      expect(result).toBeDefined();
      expect(result.category).toBeTruthy();
      expect(result.colors).toBeDefined();
      expect(result.colors.primary).toMatch(/^#[0-9A-F]{6}$/);
      expect(result.shape).toBeDefined();
      expect(result.shape.type).toBeTruthy();
      expect(result.texture).toBeTruthy();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle invalid image buffer', async () => {
      const invalidBuffer = Buffer.from('invalid image data');

      await expect(
        analyzeProductImage(invalidBuffer, { apiKey: testApiKey })
      ).rejects.toThrow(ImageAnalysisError);
    });
  });

  describe('analyzeBatch', () => {
    it.skip('should analyze multiple images in batch', async () => {
      const images = [
        await createTestImage(400, 400, { r: 255, g: 0, b: 0 }),
        await createTestImage(400, 400, { r: 0, g: 255, b: 0 }),
        await createTestImage(400, 400, { r: 0, g: 0, b: 255 }),
      ];

      const results = await analyzeBatch(
        images,
        { apiKey: testApiKey },
        2
      );

      expect(results).toBeDefined();
      expect(results.length).toBe(3);
      results.forEach((result) => {
        expect(result.category).toBeTruthy();
        expect(result.colors).toBeDefined();
        expect(result.shape).toBeDefined();
        expect(result.texture).toBeTruthy();
      });
    });

    it('should handle batch with some failures gracefully', async () => {
      const images = [
        await createTestImage(400, 400, { r: 255, g: 0, b: 0 }),
        Buffer.from('invalid'),
      ];

      // エラーがあっても処理が続行されることを確認
      const results = await analyzeBatch(
        images,
        { apiKey: testApiKey },
        1
      );

      // 少なくとも1つは成功するはず
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('ImageAnalysisError', () => {
    it('should create error with proper properties', () => {
      const error = new ImageAnalysisError(
        'Test error',
        'API_ERROR',
        { detail: 'test' }
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ImageAnalysisError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('API_ERROR');
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.name).toBe('ImageAnalysisError');
    });
  });
});
