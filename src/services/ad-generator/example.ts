/**
 * Ad Generator Usage Example
 * 広告生成サービスの使用例
 */

import { AdGeneratorService } from './index.js';
import type { ProductAnalysis, AdPlatform } from './types.js';
import { writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * 使用例: 単一広告生成
 */
async function singleAdExample() {
  const service = new AdGeneratorService();

  const productAnalysis: ProductAnalysis = {
    primaryColor: '#FF5733',
    secondaryColors: ['#FFC300', '#DAF7A6'],
    colorPalette: [
      { color: '#FF5733', percentage: 40 },
      { color: '#FFC300', percentage: 30 },
      { color: '#DAF7A6', percentage: 30 },
    ],
    dominantEmotion: 'energetic',
    suggestedKeywords: ['modern', 'vibrant', 'premium'],
    category: 'electronics',
    style: 'contemporary',
  };

  try {
    const result = await service.generateAd({
      productAnalysis,
      platform: 'instagram-square',
      headline: 'Premium Sound Quality',
      description: 'Experience music like never before',
      callToAction: 'Shop Now',
      brandName: 'AudioTech',
      style: 'vibrant',
    });

    console.log('✅ Ad generated successfully!');
    console.log(`Platform: ${result.platform}`);
    console.log(`Size: ${result.size.width}x${result.size.height}`);
    console.log(`Generated at: ${result.metadata.generatedAt}`);

    // 画像を保存
    if (result.imageBuffer) {
      const outputPath = join(process.cwd(), 'output', `ad-${result.platform}.png`);
      await writeFile(outputPath, result.imageBuffer);
      console.log(`💾 Saved to: ${outputPath}`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * 使用例: バッチ生成
 */
async function batchAdExample() {
  const service = new AdGeneratorService();

  const productAnalysis: ProductAnalysis = {
    primaryColor: '#3498DB',
    secondaryColors: ['#2ECC71', '#F39C12'],
    colorPalette: [
      { color: '#3498DB', percentage: 50 },
      { color: '#2ECC71', percentage: 30 },
      { color: '#F39C12', percentage: 20 },
    ],
    suggestedKeywords: ['innovative', 'reliable', 'professional'],
    category: 'software',
    style: 'modern',
  };

  const platforms: AdPlatform[] = [
    'instagram-square',
    'twitter-card',
    'facebook-feed',
  ];

  try {
    const batchResult = await service.generateBatch({
      productAnalysis,
      platforms,
      commonConfig: {
        headline: 'Transform Your Workflow',
        description: 'Powerful tools for modern teams',
        callToAction: 'Start Free Trial',
        brandName: 'ProductivityPro',
        style: 'realistic',
      },
    });

    console.log('\n📊 Batch Generation Results:');
    console.log(`✅ Successfully generated: ${batchResult.totalGenerated}`);
    console.log(`❌ Failed: ${batchResult.totalFailed}`);

    // 各結果を保存
    for (const result of batchResult.results) {
      if (result.imageBuffer) {
        const outputPath = join(
          process.cwd(),
          'output',
          `batch-${result.platform}.png`
        );
        await writeFile(outputPath, result.imageBuffer);
        console.log(`💾 Saved ${result.platform} to: ${outputPath}`);
      }
    }

    // エラーレポート
    if (batchResult.errors.length > 0) {
      console.log('\n⚠️ Errors:');
      for (const error of batchResult.errors) {
        console.log(`- ${error.platform}: ${error.error}`);
      }
    }
  } catch (error) {
    console.error('❌ Batch generation error:', error);
  }
}

/**
 * エントリポイント
 */
async function main() {
  console.log('🎨 Ad Generator Examples\n');

  // 出力ディレクトリを作成
  const { mkdir } = await import('fs/promises');
  await mkdir(join(process.cwd(), 'output'), { recursive: true });

  // 実行例を選択
  const example = process.argv[2] || 'single';

  if (example === 'single') {
    console.log('Running single ad generation example...\n');
    await singleAdExample();
  } else if (example === 'batch') {
    console.log('Running batch ad generation example...\n');
    await batchAdExample();
  } else {
    console.log('Usage: tsx example.ts [single|batch]');
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
