/**
 * 商品画像分析エンジンの使用例
 *
 * 実行方法:
 * CLAUDE_API_KEY=your-api-key tsx src/services/image-analyzer/example.ts
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  analyzeProductImage,
  analyzeColors,
  analyzeShapeOnly,
  analyzeCategoryOnly,
  analyzeBatch,
  ImageAnalysisError,
} from './index.js';

/**
 * 基本的な使用例
 */
async function basicExample() {
  console.log('\n=== 基本的な使用例 ===\n');

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    console.error('CLAUDE_API_KEY環境変数が設定されていません');
    return;
  }

  try {
    // 画像ファイルのパス（存在する画像に変更してください）
    const imagePath = './sample-product.jpg';

    // 画像の存在確認
    try {
      await fs.access(imagePath);
    } catch {
      console.log(`画像ファイルが見つかりません: ${imagePath}`);
      console.log('サンプル画像を用意してから実行してください');
      return;
    }

    console.log(`画像を分析中: ${imagePath}`);

    const result = await analyzeProductImage(imagePath, {
      apiKey,
      paletteSize: 5,
      timeout: 30000,
    });

    console.log('\n分析結果:');
    console.log('カテゴリ:', result.category);
    console.log('メインカラー:', result.colors.primary);
    console.log('カラーパレット:', result.colors.palette);
    console.log('形状タイプ:', result.shape.type);
    console.log('寸法:', result.shape.dimensions);
    console.log('テクスチャ:', result.texture);
    console.log('信頼度:', `${(result.confidence * 100).toFixed(1)}%`);
  } catch (error) {
    if (error instanceof ImageAnalysisError) {
      console.error('エラー:', error.message);
      console.error('コード:', error.code);
    } else {
      console.error('予期しないエラー:', error);
    }
  }
}

/**
 * カラー抽出のみの例
 */
async function colorExtractionExample() {
  console.log('\n=== カラー抽出のみ ===\n');

  try {
    const imagePath = './sample-product.jpg';

    try {
      await fs.access(imagePath);
    } catch {
      console.log('画像ファイルが見つかりません');
      return;
    }

    const colors = await analyzeColors(imagePath, 5);

    console.log('プライマリカラー:', colors.primary);
    console.log('セカンダリカラー:', colors.secondary);
    console.log('フルパレット:', colors.palette);

    // カラーコードをCSSで表示
    console.log('\nCSS例:');
    console.log(`background-color: ${colors.primary};`);
  } catch (error) {
    console.error('エラー:', error);
  }
}

/**
 * 形状分析のみの例
 */
async function shapeAnalysisExample() {
  console.log('\n=== 形状分析のみ ===\n');

  try {
    const imagePath = './sample-product.jpg';

    try {
      await fs.access(imagePath);
    } catch {
      console.log('画像ファイルが見つかりません');
      return;
    }

    const shape = await analyzeShapeOnly(imagePath);

    console.log('形状タイプ:', shape.type);
    console.log('幅:', shape.dimensions.width);
    console.log('高さ:', shape.dimensions.height);

    // 形状に応じたメッセージ
    switch (shape.type) {
      case 'cylindrical':
        console.log('→ ボトル型やチューブ型の商品に適しています');
        break;
      case 'rectangular':
        console.log('→ 箱型やパッケージ商品に適しています');
        break;
      case 'spherical':
        console.log('→ 丸型や正方形の商品に適しています');
        break;
    }
  } catch (error) {
    console.error('エラー:', error);
  }
}

/**
 * カテゴリ検出のみの例
 */
async function categoryDetectionExample() {
  console.log('\n=== カテゴリ検出のみ ===\n');

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    console.error('CLAUDE_API_KEY環境変数が設定されていません');
    return;
  }

  try {
    const imagePath = './sample-product.jpg';

    try {
      await fs.access(imagePath);
    } catch {
      console.log('画像ファイルが見つかりません');
      return;
    }

    const category = await analyzeCategoryOnly(imagePath, apiKey);

    console.log('カテゴリ:', category.category);
    if (category.subcategory) {
      console.log('サブカテゴリ:', category.subcategory);
    }
    console.log('信頼度:', `${(category.confidence * 100).toFixed(1)}%`);
    console.log('検出された特徴:', category.features);
  } catch (error) {
    console.error('エラー:', error);
  }
}

/**
 * バッチ処理の例
 */
async function batchProcessingExample() {
  console.log('\n=== バッチ処理の例 ===\n');

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    console.error('CLAUDE_API_KEY環境変数が設定されていません');
    return;
  }

  try {
    // 複数の画像を準備（実際のファイルパスに変更してください）
    const imagePaths = [
      './sample-product1.jpg',
      './sample-product2.jpg',
      './sample-product3.jpg',
    ];

    // 存在する画像のみをフィルタリング
    const existingPaths: string[] = [];
    for (const path of imagePaths) {
      try {
        await fs.access(path);
        existingPaths.push(path);
      } catch {
        // ファイルが存在しない場合はスキップ
      }
    }

    if (existingPaths.length === 0) {
      console.log('処理する画像が見つかりません');
      return;
    }

    console.log(`${existingPaths.length}件の画像を分析中...`);

    const results = await analyzeBatch(
      existingPaths,
      { apiKey },
      2 // 2つずつ並列処理
    );

    console.log(`\n${results.length}件の分析が完了しました\n`);

    results.forEach((result, index) => {
      console.log(`${index + 1}. ${existingPaths[index]}`);
      console.log(`   カテゴリ: ${result.category}`);
      console.log(`   メインカラー: ${result.colors.primary}`);
      console.log(`   形状: ${result.shape.type}`);
      console.log(`   信頼度: ${(result.confidence * 100).toFixed(1)}%\n`);
    });
  } catch (error) {
    console.error('エラー:', error);
  }
}

/**
 * エラーハンドリングの例
 */
async function errorHandlingExample() {
  console.log('\n=== エラーハンドリングの例 ===\n');

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    console.error('CLAUDE_API_KEY環境変数が設定されていません');
    return;
  }

  try {
    // 存在しない画像
    await analyzeProductImage('./non-existent.jpg', { apiKey });
  } catch (error) {
    if (error instanceof ImageAnalysisError) {
      console.log('エラーをキャッチしました:');
      console.log('  メッセージ:', error.message);
      console.log('  コード:', error.code);

      switch (error.code) {
        case 'INVALID_IMAGE':
          console.log('  → 画像が不正または読み込めません');
          break;
        case 'API_ERROR':
          console.log('  → Claude APIでエラーが発生しました');
          break;
        case 'TIMEOUT':
          console.log('  → 処理がタイムアウトしました');
          break;
        case 'NETWORK_ERROR':
          console.log('  → ネットワークエラーが発生しました');
          break;
        default:
          console.log('  → 不明なエラーです');
      }
    } else {
      console.error('予期しないエラー:', error);
    }
  }
}

/**
 * メイン関数
 */
async function main() {
  console.log('商品画像分析エンジン - 使用例\n');

  // 各例を実行
  await basicExample();
  await colorExtractionExample();
  await shapeAnalysisExample();
  await categoryDetectionExample();
  await batchProcessingExample();
  await errorHandlingExample();

  console.log('\nすべての例が完了しました');
}

// スクリプトとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  basicExample,
  colorExtractionExample,
  shapeAnalysisExample,
  categoryDetectionExample,
  batchProcessingExample,
  errorHandlingExample,
};
