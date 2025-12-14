/**
 * ECテキスト生成エンジンの使用例
 *
 * このファイルは、text-generatorモジュールの基本的な使い方を示します。
 */

import { generateProductTexts, generateBatch } from './index.js';
import type { TextGenerationOptions } from './types.js';

/**
 * 基本的な使用例
 */
async function basicExample() {
  console.log('=== 基本的な使用例 ===\n');

  const options: TextGenerationOptions = {
    apiKey: process.env.CLAUDE_API_KEY || 'your-api-key-here',
    productInfo: {
      name: 'オーガニックコーヒー豆 エチオピア産',
      brand: 'エシカルコーヒー',
      price: 1680,
      category: '食品・飲料',
      targetAudience: '健康志向の30-50代、コーヒー愛好家',
      details:
        'エチオピア・イルガチェフェ地域で栽培された高品質なアラビカ種。フェアトレード認証済み。華やかな香りとフルーティーな酸味が特徴。',
    },
    tone: 'professional',
    language: 'ja',
  };

  try {
    const result = await generateProductTexts(options);

    console.log('✅ 生成完了!\n');

    console.log('--- 商品説明（短文） ---');
    console.log(result.description.short);
    console.log();

    console.log('--- 商品説明（長文） ---');
    console.log(result.description.long);
    console.log();

    console.log('--- 箇条書きポイント ---');
    result.description.bullet_points.forEach((point, i) => {
      console.log(`${i + 1}. ${point}`);
    });
    console.log();

    console.log('--- キャッチコピー ---');
    console.log(`メイン: ${result.catchcopy.main}`);
    console.log(`サブ: ${result.catchcopy.sub}`);
    console.log('\n代替案:');
    result.catchcopy.variations.forEach((variation, i) => {
      console.log(`  ${i + 1}. ${variation}`);
    });
    console.log();

    console.log('--- SEO最適化 ---');
    console.log(`タイトル: ${result.seo.title}`);
    console.log(`ディスクリプション: ${result.seo.description}`);
    console.log(`キーワード: ${result.seo.keywords.join(', ')}`);
    console.log();

    console.log('--- 商品特徴 ---');
    result.features.forEach((feature) => {
      console.log(`${feature.name}: ${feature.value}`);
    });
    console.log();
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

/**
 * 画像分析結果を含む使用例
 */
async function withImageAnalysisExample() {
  console.log('=== 画像分析結果を含む使用例 ===\n');

  const options: TextGenerationOptions = {
    apiKey: process.env.CLAUDE_API_KEY || 'your-api-key-here',
    productAnalysis: {
      category: '食品',
      colors: {
        primary: '#8B4513',
        secondary: ['#D2691E', '#F5DEB3'],
        palette: ['#8B4513', '#D2691E', '#F5DEB3', '#FFFFFF', '#000000'],
      },
      shape: {
        type: 'cylindrical',
        dimensions: {
          width: 100,
          height: 200,
        },
      },
      texture: 'matte',
      confidence: 0.92,
    },
    productInfo: {
      name: 'プレミアムコーヒー豆',
      brand: 'CoffeeLab',
      price: 2480,
      category: '食品',
      targetAudience: 'コーヒー愛好家',
    },
    tone: 'luxury',
    language: 'ja',
  };

  try {
    const result = await generateProductTexts(options);
    console.log('✅ 生成完了!\n');
    console.log('キャッチコピー:', result.catchcopy.main);
    console.log('SEOタイトル:', result.seo.title);
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

/**
 * 複数商品のバッチ生成例
 */
async function batchExample() {
  console.log('=== バッチ生成例 ===\n');

  const products: TextGenerationOptions[] = [
    {
      apiKey: process.env.CLAUDE_API_KEY || 'your-api-key-here',
      productInfo: {
        name: 'オーガニックグリーンティー',
        brand: 'TeaMaster',
        price: 980,
        category: '食品・飲料',
        targetAudience: '健康志向の20-40代',
      },
      tone: 'friendly',
    },
    {
      apiKey: process.env.CLAUDE_API_KEY || 'your-api-key-here',
      productInfo: {
        name: 'ハンドメイドチョコレート',
        brand: 'ChocolatierPro',
        price: 3200,
        category: '食品',
        targetAudience: 'ギフト購入者',
      },
      tone: 'luxury',
    },
    {
      apiKey: process.env.CLAUDE_API_KEY || 'your-api-key-here',
      productInfo: {
        name: '有機栽培ハーブティー',
        brand: 'NatureBlend',
        price: 1200,
        category: '食品・飲料',
        targetAudience: 'リラックスを求める30-50代',
      },
      tone: 'professional',
    },
  ];

  try {
    console.log(`${products.length}件の商品テキストを生成中...\n`);
    const results = await generateBatch(products, 2); // 2件ずつ並列処理

    console.log(`✅ ${results.length}件の生成が完了しました!\n`);

    results.forEach((result, index) => {
      console.log(`--- 商品 ${index + 1} ---`);
      console.log(`キャッチコピー: ${result.catchcopy.main}`);
      console.log(`SEOタイトル: ${result.seo.title}`);
      console.log();
    });
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

/**
 * トーン別の生成例
 */
async function toneVariationsExample() {
  console.log('=== トーン別の生成例 ===\n');

  const baseOptions = {
    apiKey: process.env.CLAUDE_API_KEY || 'your-api-key-here',
    productInfo: {
      name: '天然ハチミツ',
      brand: 'BeeHappy',
      price: 1480,
      category: '食品',
    },
  };

  const tones: Array<'professional' | 'casual' | 'luxury' | 'friendly'> = [
    'professional',
    'casual',
    'luxury',
    'friendly',
  ];

  for (const tone of tones) {
    console.log(`--- ${tone}トーン ---`);
    try {
      const result = await generateProductTexts({ ...baseOptions, tone });
      console.log(`キャッチコピー: ${result.catchcopy.main}`);
      console.log();
    } catch (error) {
      console.error(`❌ ${tone}トーンの生成に失敗:`, error);
    }
  }
}

/**
 * メイン実行関数
 */
async function main() {
  console.log('🌸 ECテキスト生成エンジン - 使用例\n');
  console.log('='.repeat(60));
  console.log();

  // 環境変数のチェック
  if (!process.env.CLAUDE_API_KEY) {
    console.warn('⚠️  CLAUDE_API_KEY環境変数が設定されていません');
    console.warn('   実際の生成を行うには、APIキーを設定してください\n');
  }

  // 各例を順番に実行（コメントアウトして必要なものだけ実行可能）
  await basicExample();
  // await withImageAnalysisExample();
  // await batchExample();
  // await toneVariationsExample();

  console.log('='.repeat(60));
  console.log('✅ 全ての例が完了しました');
}

// スクリプトとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { basicExample, withImageAnalysisExample, batchExample, toneVariationsExample };
