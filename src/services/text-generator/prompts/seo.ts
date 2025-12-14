/**
 * SEO最適化テキスト生成プロンプトテンプレート
 */

import type { PromptContext, SEOOptions } from '../types.js';

/**
 * SEO最適化テキスト生成プロンプトを構築
 */
export function buildSEOPrompt(
  context: PromptContext,
  options: SEOOptions = {}
): string {
  const { analysis, productInfo, language } = context;
  const {
    focusKeyword = '',
    additionalKeywords = [],
    location = '',
  } = options;

  const languageInstruction = language === 'en'
    ? 'Generate in English.'
    : '日本語で生成してください。';

  let contextInfo = '';

  if (analysis) {
    contextInfo += `
## 商品分析情報
- カテゴリ: ${analysis.category}
- メインカラー: ${analysis.colors.primary}
- 形状: ${analysis.shape.type}
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

  const seoContext = `
## SEO要件
${focusKeyword ? `- フォーカスキーワード: ${focusKeyword}` : ''}
${additionalKeywords.length > 0 ? `- 追加キーワード: ${additionalKeywords.join(', ')}` : ''}
${location ? `- 地域: ${location}` : ''}
`;

  return `あなたはSEOの専門家です。
以下の商品情報を基に、検索エンジンに最適化されたテキストを生成してください。

${contextInfo}
${seoContext}

## 生成要件
- SEOタイトル: 60文字以内（検索結果で切れないように）
- メタディスクリプション: 160文字以内（検索結果のスニペット用）
- キーワード: 関連性の高いキーワード5-10個
- 言語: ${languageInstruction}

## 出力形式
以下のJSON形式で出力してください：

\`\`\`json
{
  "title": "SEOタイトル（60文字以内）",
  "description": "メタディスクリプション（160文字以内）",
  "keywords": [
    "キーワード1",
    "キーワード2",
    "キーワード3",
    "キーワード4",
    "キーワード5"
  ]
}
\`\`\`

## SEO最適化のベストプラクティス
1. **タイトル最適化**:
   - 主要キーワードを先頭に配置
   - 数字や記号を活用して目を引く
   - ブランド名を末尾に含める
   - クリック率を高める魅力的な表現

2. **ディスクリプション最適化**:
   - 主要キーワードを自然に含める
   - 商品のユニークな価値を明確に
   - 行動を促す言葉（CTA）を含める
   - 読みやすく、簡潔に

3. **キーワード選定**:
   - 検索ボリュームと競合性のバランス
   - ロングテールキーワードも含める
   - ユーザーの検索意図に合致
   - 関連性の高い複合キーワード

JSONフォーマットを厳密に守ってください。`;
}
