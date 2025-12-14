/**
 * パッケージデザイン用プロンプト生成エンジン
 */

import type {
  DesignPrompt,
  DesignVariationType,
  PackageTemplate,
} from './types.js';
import type { ProductAnalysis } from '../image-analyzer/types.js';

/**
 * デザインバリエーション定義
 */
const VARIATION_STYLES: Record<
  DesignVariationType,
  {
    name: string;
    description: string;
    keywords: string[];
  }
> = {
  minimalist: {
    name: 'ミニマリスト',
    description: 'シンプルで洗練された、無駄のないデザイン',
    keywords: [
      'clean',
      'simple',
      'minimal',
      'modern',
      'elegant',
      'white space',
      'sans-serif typography',
      'geometric shapes',
    ],
  },
  vibrant: {
    name: 'ビビッド',
    description: '色鮮やかで活気のある、目を引くデザイン',
    keywords: [
      'colorful',
      'vibrant',
      'energetic',
      'bold',
      'eye-catching',
      'dynamic',
      'playful',
      'bright colors',
    ],
  },
  premium: {
    name: 'プレミアム',
    description: '高級感のある、品質を感じさせるデザイン',
    keywords: [
      'luxury',
      'premium',
      'sophisticated',
      'elegant',
      'high-end',
      'metallic accents',
      'serif typography',
      'refined',
    ],
  },
};

/**
 * カテゴリ別デザイン要素
 */
const CATEGORY_DESIGN_ELEMENTS: Record<
  string,
  {
    visualElements: string[];
    typography: string[];
    layout: string[];
  }
> = {
  食品: {
    visualElements: ['appetizing imagery', 'fresh ingredients', 'natural textures'],
    typography: ['friendly', 'approachable', 'handwritten accents'],
    layout: ['clear product window', 'ingredient highlights', 'nutrition focus'],
  },
  化粧品: {
    visualElements: ['soft gradients', 'floral elements', 'skin texture'],
    typography: ['elegant', 'refined', 'script fonts'],
    layout: ['centered branding', 'minimal text', 'beauty focus'],
  },
  電子機器: {
    visualElements: ['tech patterns', 'circuit designs', 'futuristic elements'],
    typography: ['modern', 'sans-serif', 'technical'],
    layout: ['specifications', 'feature highlights', 'product diagram'],
  },
  飲料: {
    visualElements: ['condensation droplets', 'liquid splash', 'ice crystals'],
    typography: ['bold', 'impactful', 'modern'],
    layout: ['large product name', 'flavor indicators', 'transparent windows'],
  },
  default: {
    visualElements: ['product-focused', 'clean imagery', 'brand elements'],
    typography: ['clear', 'readable', 'professional'],
    layout: ['balanced composition', 'clear hierarchy', 'information architecture'],
  },
};

/**
 * プロンプトテンプレート変数を置換
 */
function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

/**
 * カテゴリに応じたデザイン要素を取得
 */
function getCategoryDesignElements(category: string): {
  visualElements: string[];
  typography: string[];
  layout: string[];
} {
  return CATEGORY_DESIGN_ELEMENTS[category] || CATEGORY_DESIGN_ELEMENTS.default;
}

/**
 * カラーパレットを文字列に変換
 */
function formatColorPalette(colors: {
  primary: string;
  secondary: string[];
}): string {
  return `Primary: ${colors.primary}, Secondary: ${colors.secondary.join(', ')}`;
}

/**
 * バリエーション種類に応じたスタイルキーワードを取得
 */
function getStyleKeywords(variationType: DesignVariationType): string[] {
  return VARIATION_STYLES[variationType].keywords;
}

/**
 * デザインプロンプトを構築
 *
 * @param productAnalysis 商品分析結果
 * @param template パッケージテンプレート
 * @param variationType バリエーション種類
 * @param brandName ブランド名（オプション）
 * @param productName 製品名（オプション）
 * @param additionalRequirements 追加要件（オプション）
 * @returns 構築されたデザインプロンプト
 *
 * @example
 * ```typescript
 * const prompt = buildDesignPrompt(
 *   productAnalysis,
 *   template,
 *   'minimalist',
 *   'Natural Co.',
 *   'Organic Green Tea'
 * );
 * console.log(prompt.text);
 * ```
 */
export function buildDesignPrompt(
  productAnalysis: ProductAnalysis,
  template: PackageTemplate,
  variationType: DesignVariationType,
  brandName?: string,
  productName?: string,
  additionalRequirements?: string
): DesignPrompt {
  const { category, colors, texture } = productAnalysis;
  const variationStyle = VARIATION_STYLES[variationType];
  const categoryElements = getCategoryDesignElements(category);
  const styleKeywords = getStyleKeywords(variationType);

  // テンプレート変数の準備
  const variables: Record<string, string> = {
    category,
    primaryColor: colors.primary,
    secondaryColors: colors.secondary.join(', '),
    colorPalette: formatColorPalette(colors),
    texture,
    variationName: variationStyle.name,
    variationDescription: variationStyle.description,
    styleKeywords: styleKeywords.join(', '),
    visualElements: categoryElements.visualElements.join(', '),
    typography: categoryElements.typography.join(', '),
    layout: categoryElements.layout.join(', '),
    packageType: template.type,
    aspectRatio: template.designParams.aspectRatio,
    brandName: brandName || '[Brand Name]',
    productName: productName || '[Product Name]',
  };

  // ベースプロンプトの構築
  const basePrompt = replaceTemplateVariables(template.promptTemplate, variables);

  // バリエーションスタイルの追加
  const styleSection = `
Design Style: ${variationStyle.name} - ${variationStyle.description}
Key visual characteristics: ${styleKeywords.slice(0, 5).join(', ')}`;

  // カテゴリ特有の要素の追加
  const categorySection = `
Product Category: ${category}
Visual elements to include: ${categoryElements.visualElements.join(', ')}
Typography style: ${categoryElements.typography.join(', ')}
Layout considerations: ${categoryElements.layout.join(', ')}`;

  // カラーとテクスチャ情報
  const colorSection = `
Color Palette: ${formatColorPalette(colors)}
All colors in HEX format.
Surface Texture: ${texture} finish`;

  // ブランドと製品情報（存在する場合）
  const brandSection =
    brandName || productName
      ? `
Brand Identity:
${brandName ? `Brand Name: "${brandName}"` : ''}
${productName ? `Product Name: "${productName}"` : ''}`
      : '';

  // 追加要件（存在する場合）
  const additionalSection = additionalRequirements
    ? `
Additional Requirements:
${additionalRequirements}`
    : '';

  // 最終プロンプトの組み立て
  const finalPrompt = `${basePrompt}

${styleSection}

${categorySection}

${colorSection}${brandSection}${additionalSection}

Technical Requirements:
- Package type: ${template.type}
- Aspect ratio: ${template.designParams.aspectRatio}
- Primary display surface: ${template.designParams.primarySurface}
- Design must be production-ready and print-quality
- Include all necessary visual elements for a complete package design
- Maintain brand consistency and visual hierarchy`;

  return {
    text: finalPrompt.trim(),
    variationType,
    template,
    params: {
      primaryColor: colors.primary,
      secondaryColors: colors.secondary,
      category,
      texture,
      brandName,
      productName,
    },
  };
}

/**
 * 複数のバリエーション用プロンプトを一括生成
 *
 * @param productAnalysis 商品分析結果
 * @param template パッケージテンプレート
 * @param variationTypes バリエーション種類の配列
 * @param brandName ブランド名（オプション）
 * @param productName 製品名（オプション）
 * @param additionalRequirements 追加要件（オプション）
 * @returns デザインプロンプトの配列
 *
 * @example
 * ```typescript
 * const prompts = buildMultiplePrompts(
 *   productAnalysis,
 *   template,
 *   ['minimalist', 'vibrant', 'premium']
 * );
 * ```
 */
export function buildMultiplePrompts(
  productAnalysis: ProductAnalysis,
  template: PackageTemplate,
  variationTypes: DesignVariationType[],
  brandName?: string,
  productName?: string,
  additionalRequirements?: string
): DesignPrompt[] {
  return variationTypes.map((variationType) =>
    buildDesignPrompt(
      productAnalysis,
      template,
      variationType,
      brandName,
      productName,
      additionalRequirements
    )
  );
}

/**
 * 商品分析から最適なバリエーション種類を自動選択
 *
 * @param productAnalysis 商品分析結果
 * @param count 選択する数（デフォルト: 3）
 * @returns 選択されたバリエーション種類の配列
 *
 * @example
 * ```typescript
 * const variations = autoSelectVariations(productAnalysis);
 * // => ['minimalist', 'vibrant', 'premium']
 * ```
 */
export function autoSelectVariations(
  productAnalysis: ProductAnalysis,
  count: number = 3
): DesignVariationType[] {
  const { category, texture } = productAnalysis;

  // カテゴリとテクスチャに基づく推奨バリエーション
  const recommendations: DesignVariationType[] = [];

  // カテゴリベースの推奨
  if (category === '化粧品' || category === '電子機器') {
    recommendations.push('premium', 'minimalist');
  } else if (category === '食品' || category === '飲料') {
    recommendations.push('vibrant', 'minimalist');
  } else {
    recommendations.push('minimalist');
  }

  // テクスチャベースの推奨
  if (texture === 'metallic' || texture === 'glossy') {
    if (!recommendations.includes('premium')) {
      recommendations.push('premium');
    }
  } else if (texture === 'matte') {
    if (!recommendations.includes('minimalist')) {
      recommendations.push('minimalist');
    }
  }

  // 常にvibrантを候補に含める（多様性のため）
  if (!recommendations.includes('vibrant')) {
    recommendations.push('vibrant');
  }

  // 重複を除去してcountの数だけ返す
  const unique = [...new Set(recommendations)];
  return unique.slice(0, Math.min(count, unique.length));
}

/**
 * プロンプトを検証
 *
 * @param prompt デザインプロンプト
 * @returns 検証結果
 */
export function validatePrompt(prompt: DesignPrompt): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!prompt.text || prompt.text.trim().length === 0) {
    errors.push('プロンプトテキストが空です');
  }

  if (prompt.text.length > 4000) {
    errors.push('プロンプトが長すぎます（4000文字以内）');
  }

  if (!prompt.variationType) {
    errors.push('バリエーション種類が指定されていません');
  }

  if (!prompt.template) {
    errors.push('テンプレートが指定されていません');
  }

  if (!prompt.params.primaryColor) {
    errors.push('主要カラーが指定されていません');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
