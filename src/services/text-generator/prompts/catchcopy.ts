/**
 * キャッチコピー生成プロンプトテンプレート
 */

import type { PromptContext, CatchcopyOptions } from '../types.js';

/**
 * キャッチコピー生成プロンプトを構築
 */
export function buildCatchcopyPrompt(
  context: PromptContext,
  options: CatchcopyOptions = {}
): string {
  const { analysis, productInfo, tone, language } = context;
  const {
    maxLength = 30,
    variationCount = 5,
    keywords = [],
  } = options;

  const languageInstruction = language === 'en'
    ? 'Generate in English.'
    : '日本語で生成してください。';

  const toneDescription = getToneDescription(tone);

  let contextInfo = '';

  if (analysis) {
    contextInfo += `
## 商品分析情報
- カテゴリ: ${analysis.category}
- メインカラー: ${analysis.colors.primary}
- 形状: ${analysis.shape.type}
- テクスチャ: ${analysis.texture}
`;
  }

  if (productInfo) {
    contextInfo += `
## 商品詳細
${productInfo.name ? `- 商品名: ${productInfo.name}` : ''}
${productInfo.brand ? `- ブランド: ${productInfo.brand}` : ''}
${productInfo.category ? `- カテゴリ: ${productInfo.category}` : ''}
${productInfo.targetAudience ? `- ターゲット層: ${productInfo.targetAudience}` : ''}
${productInfo.details ? `- 詳細: ${productInfo.details}` : ''}
`;
  }

  const keywordsSection = keywords.length > 0
    ? `\n使用したいキーワード: ${keywords.join(', ')}`
    : '';

  return `あなたはプロのコピーライターです。
以下の商品情報を基に、心に響くキャッチコピーを生成してください。

${contextInfo}

## 生成要件
- トーン: ${toneDescription}
- 最大文字数: ${maxLength}文字${keywordsSection}
- 代替案の数: ${variationCount}個
- 言語: ${languageInstruction}

## 出力形式
以下のJSON形式で出力してください：

\`\`\`json
{
  "main": "最も印象的なメインキャッチコピー",
  "sub": "メインコピーを補完するサブコピー",
  "variations": [
    "代替案1",
    "代替案2",
    "代替案3",
    "代替案4",
    "代替案5"
  ]
}
\`\`\`

## キャッチコピーの原則
1. **短く、覚えやすい**: 一瞬で心に刺さる言葉を選ぶ
2. **独自性**: 他社製品と差別化できる表現
3. **感情に訴える**: ターゲット層の感情を動かす
4. **具体的なベネフィット**: 抽象的ではなく具体的な価値を示す
5. **リズムと響き**: 声に出して読んだときの心地よさ

JSONフォーマットを厳密に守ってください。`;
}

function getToneDescription(tone: string): string {
  const tones: Record<string, string> = {
    professional: 'プロフェッショナルで信頼感のある、落ち着いた表現',
    casual: 'カジュアルで親しみやすい、くだけた表現',
    luxury: '高級感と洗練された、エレガントな表現',
    friendly: 'フレンドリーで温かみのある、親近感のある表現',
  };
  return tones[tone] || tones.professional;
}
