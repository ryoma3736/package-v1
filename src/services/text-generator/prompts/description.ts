/**
 * 商品説明生成プロンプトテンプレート
 */

import type { PromptContext, DescriptionOptions } from '../types.js';

/**
 * 商品説明生成プロンプトを構築
 */
export function buildDescriptionPrompt(
  context: PromptContext,
  options: DescriptionOptions = {}
): string {
  const { analysis, productInfo, tone, language } = context;
  const { length = 'medium', emphasize = [], style = 'informative' } = options;

  const languageInstruction = language === 'en'
    ? 'Generate in English.'
    : '日本語で生成してください。';

  const toneDescription = getToneDescription(tone);
  const styleDescription = getStyleDescription(style);
  const lengthGuideline = getLengthGuideline(length);

  let contextInfo = '';

  if (analysis) {
    contextInfo += `
## 商品分析情報
- カテゴリ: ${analysis.category}
- メインカラー: ${analysis.colors.primary}
- サブカラー: ${analysis.colors.secondary.join(', ')}
- 形状: ${analysis.shape.type}
- テクスチャ: ${analysis.texture}
`;
  }

  if (productInfo) {
    contextInfo += `
## 商品詳細
${productInfo.name ? `- 商品名: ${productInfo.name}` : ''}
${productInfo.brand ? `- ブランド: ${productInfo.brand}` : ''}
${productInfo.price ? `- 価格: ¥${productInfo.price.toLocaleString()}` : ''}
${productInfo.category ? `- カテゴリ: ${productInfo.category}` : ''}
${productInfo.targetAudience ? `- ターゲット層: ${productInfo.targetAudience}` : ''}
${productInfo.details ? `- 詳細:\n${productInfo.details}` : ''}
`;
  }

  const emphasizeSection = emphasize.length > 0
    ? `\n強調するポイント: ${emphasize.join(', ')}`
    : '';

  return `あなたはプロのECサイト向けコピーライターです。
以下の商品情報を基に、魅力的な商品説明を生成してください。

${contextInfo}

## 生成要件
- トーン: ${toneDescription}
- スタイル: ${styleDescription}
- 文字数: ${lengthGuideline}${emphasizeSection}
- 言語: ${languageInstruction}

## 出力形式
以下のJSON形式で出力してください：

\`\`\`json
{
  "long": "500-1000文字の詳細な商品説明",
  "short": "100-200文字の簡潔な商品説明",
  "bullet_points": [
    "箇条書きポイント1",
    "箇条書きポイント2",
    "箇条書きポイント3",
    "箇条書きポイント4",
    "箇条書きポイント5"
  ]
}
\`\`\`

注意事項：
1. 商品の魅力を最大限に伝えること
2. ターゲット層に響く言葉選びをすること
3. 具体的で説得力のある表現を使うこと
4. 過度な誇張は避けること
5. JSONフォーマットを厳密に守ること`;
}

function getToneDescription(tone: string): string {
  const tones: Record<string, string> = {
    professional: 'プロフェッショナルで信頼感のある表現',
    casual: 'カジュアルで親しみやすい表現',
    luxury: '高級感と洗練された表現',
    friendly: 'フレンドリーで温かみのある表現',
  };
  return tones[tone] || tones.professional;
}

function getStyleDescription(style: string): string {
  const styles: Record<string, string> = {
    informative: '情報提供型（特徴や機能を中心に説明）',
    persuasive: '説得型（購入を促す表現を強調）',
    storytelling: '物語型（ストーリーを通じて魅力を伝える）',
  };
  return styles[style] || styles.informative;
}

function getLengthGuideline(length: string): string {
  const guidelines: Record<string, string> = {
    short: '簡潔に（長文: 300-500文字、短文: 50-100文字）',
    medium: '適度な詳しさ（長文: 500-800文字、短文: 100-150文字）',
    long: '詳細に（長文: 800-1200文字、短文: 150-200文字）',
  };
  return guidelines[length] || guidelines.medium;
}
