/**
 * パッケージデザイン生成サービスの使用例
 *
 * このファイルは実装の使い方を示すサンプルコードです。
 */

import { analyzeProductImage } from '../image-analyzer/index.js';
import {
  generatePackageDesigns,
  generatePackageDesignsAuto,
  generateWithProgress,
  saveMultipleImages,
} from './index.js';

/**
 * 基本的な使用例
 */
async function basicExample() {
  console.log('=== 基本的な使用例 ===\n');

  // 1. 商品画像を分析
  const productAnalysis = await analyzeProductImage('./product.jpg', {
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  console.log('商品分析結果:');
  console.log(`- カテゴリ: ${productAnalysis.category}`);
  console.log(`- 主要カラー: ${productAnalysis.colors.primary}`);
  console.log(`- 形状: ${productAnalysis.shape.type}`);
  console.log(`- テクスチャ: ${productAnalysis.texture}`);
  console.log();

  // 2. パッケージデザインを生成
  const result = await generatePackageDesigns({
    productAnalysis,
    templateType: 'box-standard',
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    variationCount: 3,
    brandName: 'Natural Co.',
    productName: 'Organic Green Tea',
  });

  console.log('生成結果:');
  console.log(`- 成功: ${result.success}`);
  console.log(`- 生成数: ${result.designs.length}`);
  console.log(`- 失敗数: ${result.stats.failureCount}`);
  console.log(`- 実行時間: ${result.stats.totalTime.toFixed(2)}秒`);
  console.log();

  // 3. 生成されたデザインを表示
  result.designs.forEach((design, index) => {
    console.log(`デザイン ${index + 1}:`);
    console.log(`  - バリエーション: ${design.variationType}`);
    console.log(`  - URL: ${design.imageUrl.substring(0, 50)}...`);
    console.log(`  - 生成時間: ${design.metadata.generationTime?.toFixed(2)}秒`);
    console.log();
  });
}

/**
 * 自動テンプレート選択の使用例
 */
async function autoTemplateExample() {
  console.log('=== 自動テンプレート選択の使用例 ===\n');

  const productAnalysis = await analyzeProductImage('./bottle.jpg', {
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  // テンプレートとバリエーションを自動選択
  const result = await generatePackageDesignsAuto(
    productAnalysis,
    'openai',
    process.env.OPENAI_API_KEY!,
    {
      brandName: 'Premium Beverages',
      variationCount: 3,
    }
  );

  console.log(`使用されたテンプレート: ${result.template.name}`);
  console.log(`生成されたデザイン数: ${result.designs.length}`);
  console.log();
}

/**
 * Stability AI を使用した例
 */
async function stabilityExample() {
  console.log('=== Stability AI使用例 ===\n');

  const productAnalysis = await analyzeProductImage('./cosmetic.jpg', {
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  const result = await generatePackageDesigns({
    productAnalysis,
    templateType: 'bottle-cylinder',
    provider: 'stability',
    apiKey: process.env.STABILITY_API_KEY!,
    variationCount: 2,
    style: 'photographic',
    brandName: 'Luxury Skincare',
  });

  console.log(`生成されたデザイン: ${result.designs.length}個`);

  result.designs.forEach((design) => {
    console.log(`- ${design.variationType}: seed ${design.metadata.seed}`);
  });
  console.log();
}

/**
 * 進捗監視付き生成の例
 */
async function progressExample() {
  console.log('=== 進捗監視付き生成の例 ===\n');

  const productAnalysis = await analyzeProductImage('./snack.jpg', {
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  const result = await generateWithProgress(
    {
      productAnalysis,
      templateType: 'pouch-stand',
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY!,
      variationCount: 3,
      brandName: 'Healthy Snacks',
      productName: 'Organic Trail Mix',
    },
    (progress) => {
      console.log(
        `進捗: ${progress.current}/${progress.total} - ${
          progress.design
            ? `✅ ${progress.design.variationType} 完了`
            : progress.error
            ? `❌ エラー: ${progress.error.message}`
            : ''
        }`
      );
    }
  );

  console.log(`\n全体: ${result.designs.length}個生成完了`);
  console.log();
}

/**
 * 画像保存の例
 */
async function saveExample() {
  console.log('=== 画像保存の例 ===\n');

  const productAnalysis = await analyzeProductImage('./product.jpg', {
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  const result = await generatePackageDesigns({
    productAnalysis,
    templateType: 'box-standard',
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    variationCount: 3,
  });

  // 生成された画像を保存
  const savedPaths = await saveMultipleImages(
    result.designs,
    './output/designs',
    'package'
  );

  console.log('保存されたファイル:');
  savedPaths.forEach((path) => {
    console.log(`- ${path}`);
  });
  console.log();
}

/**
 * エラーハンドリングの例
 */
async function errorHandlingExample() {
  console.log('=== エラーハンドリングの例 ===\n');

  try {
    const productAnalysis = await analyzeProductImage('./product.jpg', {
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const _result = await generatePackageDesigns({
      productAnalysis,
      templateType: 'box-standard',
      provider: 'openai',
      apiKey: 'invalid-api-key', // わざと無効なAPIキー
      variationCount: 2,
    });

    console.log('予期しない成功:', _result);
  } catch (error) {
    console.log('エラーをキャッチしました:');
    console.log(`- メッセージ: ${(error as Error).message}`);
    console.log(`- タイプ: ${(error as Error).name}`);
    console.log();
  }
}

/**
 * カスタムプロンプトの例
 */
async function customPromptExample() {
  console.log('=== カスタムプロンプトの例 ===\n');

  const productAnalysis = await analyzeProductImage('./product.jpg', {
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  const result = await generatePackageDesigns({
    productAnalysis,
    templateType: 'box-standard',
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    variationCount: 2,
    variationTypes: ['minimalist', 'premium'],
    brandName: 'EcoTech',
    productName: 'Smart Device',
    additionalRequirements: `
      - Include sustainability messaging
      - Emphasize eco-friendly materials
      - Use recycled paper texture
      - Add certification badges (FSC, Carbon Neutral)
    `,
  });

  console.log('カスタム要件を含むデザインを生成:');
  result.designs.forEach((design) => {
    console.log(`- ${design.variationType}`);
  });
  console.log();
}

/**
 * すべての例を実行
 */
async function runAllExamples() {
  console.log('パッケージデザイン生成サービス - 使用例\n');
  console.log('==========================================\n');

  try {
    // 注意: 実際の実行には有効なAPIキーが必要です
    console.log('注意: 実際の実行には有効なAPIキーが必要です\n');
    console.log('以下の環境変数を設定してください:');
    console.log('- ANTHROPIC_API_KEY (商品分析用)');
    console.log('- OPENAI_API_KEY (DALL-E 3画像生成用)');
    console.log('- STABILITY_API_KEY (Stability AI画像生成用)');
    console.log('\n==========================================\n');

    // コメントアウトを解除して実行
    // await basicExample();
    // await autoTemplateExample();
    // await stabilityExample();
    // await progressExample();
    // await saveExample();
    // await errorHandlingExample();
    // await customPromptExample();

    console.log('すべての例の実行が完了しました（コメントアウト時）');
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// モジュールとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

export {
  basicExample,
  autoTemplateExample,
  stabilityExample,
  progressExample,
  saveExample,
  errorHandlingExample,
  customPromptExample,
};
