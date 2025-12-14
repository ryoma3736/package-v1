/**
 * パッケージテンプレート管理エンジン
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PackageTemplate, PackageTemplateType, PackageGenerationError } from './types.js';

// ESモジュールで__dirnameを取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * テンプレートディレクトリのパス
 */
const TEMPLATE_DIR = join(__dirname, '../../../templates/packages');

/**
 * テンプレートキャッシュ
 */
const templateCache = new Map<PackageTemplateType, PackageTemplate>();

/**
 * テンプレートファイルを読み込み
 *
 * @param templateType テンプレート種類
 * @returns パッケージテンプレート
 * @throws {PackageGenerationError} 読み込みに失敗した場合
 *
 * @example
 * ```typescript
 * const template = await loadTemplate('box-standard');
 * console.log(template.name);
 * ```
 */
export async function loadTemplate(
  templateType: PackageTemplateType
): Promise<PackageTemplate> {
  // キャッシュをチェック
  if (templateCache.has(templateType)) {
    return templateCache.get(templateType)!;
  }

  try {
    const templatePath = join(TEMPLATE_DIR, `${templateType}.json`);
    const content = await readFile(templatePath, 'utf-8');
    const template = JSON.parse(content) as PackageTemplate;

    // 検証
    validateTemplate(template);

    // キャッシュに保存
    templateCache.set(templateType, template);

    return template;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new PackageGenerationError(
        `テンプレートファイルが見つかりません: ${templateType}`,
        'INVALID_INPUT',
        { templateType }
      );
    }

    throw new PackageGenerationError(
      `テンプレートの読み込みに失敗しました: ${templateType}`,
      'UNKNOWN',
      error
    );
  }
}

/**
 * すべてのテンプレートを読み込み
 *
 * @returns すべてのパッケージテンプレート
 *
 * @example
 * ```typescript
 * const templates = await loadAllTemplates();
 * console.log(templates.map(t => t.name));
 * ```
 */
export async function loadAllTemplates(): Promise<PackageTemplate[]> {
  const templateTypes: PackageTemplateType[] = [
    'box-standard',
    'pouch-stand',
    'bottle-cylinder',
  ];

  const templates = await Promise.all(
    templateTypes.map((type) => loadTemplate(type))
  );

  return templates;
}

/**
 * テンプレートを検証
 *
 * @param template パッケージテンプレート
 * @throws {PackageGenerationError} 検証に失敗した場合
 */
function validateTemplate(template: PackageTemplate): void {
  const errors: string[] = [];

  if (!template.name || template.name.trim().length === 0) {
    errors.push('テンプレート名が必要です');
  }

  if (!template.type) {
    errors.push('テンプレートタイプが必要です');
  }

  if (!template.promptTemplate || template.promptTemplate.trim().length === 0) {
    errors.push('プロンプトテンプレートが必要です');
  }

  if (!template.designParams) {
    errors.push('デザインパラメータが必要です');
  } else {
    if (!template.designParams.aspectRatio) {
      errors.push('アスペクト比が必要です');
    }

    if (!template.designParams.recommendedSize) {
      errors.push('推奨サイズが必要です');
    }

    if (!template.designParams.layoutZones) {
      errors.push('レイアウトゾーンが必要です');
    }
  }

  if (errors.length > 0) {
    throw new PackageGenerationError(
      `テンプレート検証エラー: ${errors.join(', ')}`,
      'INVALID_INPUT',
      { errors, template }
    );
  }
}

/**
 * カテゴリに最適なテンプレートを選択
 *
 * @param category 商品カテゴリ
 * @returns 推奨テンプレート種類
 *
 * @example
 * ```typescript
 * const templateType = selectTemplateForCategory('食品');
 * // => 'pouch-stand'
 * ```
 */
export function selectTemplateForCategory(
  category: string
): PackageTemplateType {
  const categoryMapping: Record<string, PackageTemplateType> = {
    食品: 'pouch-stand',
    飲料: 'bottle-cylinder',
    化粧品: 'bottle-cylinder',
    電子機器: 'box-standard',
    医薬品: 'box-standard',
    日用品: 'box-standard',
    衣料品: 'box-standard',
    玩具: 'box-standard',
  };

  return categoryMapping[category] || 'box-standard';
}

/**
 * 形状に基づいて最適なテンプレートを選択
 *
 * @param shapeType 形状タイプ
 * @returns 推奨テンプレート種類
 *
 * @example
 * ```typescript
 * const templateType = selectTemplateForShape('cylindrical');
 * // => 'bottle-cylinder'
 * ```
 */
export function selectTemplateForShape(
  shapeType: string
): PackageTemplateType {
  const shapeMapping: Record<string, PackageTemplateType> = {
    rectangular: 'box-standard',
    cylindrical: 'bottle-cylinder',
    spherical: 'bottle-cylinder',
    irregular: 'pouch-stand',
    unknown: 'box-standard',
  };

  return shapeMapping[shapeType] || 'box-standard';
}

/**
 * 商品分析から最適なテンプレートを自動選択
 *
 * @param category 商品カテゴリ
 * @param shapeType 形状タイプ
 * @returns 推奨テンプレート種類
 *
 * @example
 * ```typescript
 * const templateType = autoSelectTemplate('飲料', 'cylindrical');
 * // => 'bottle-cylinder'
 * ```
 */
export function autoSelectTemplate(
  category: string,
  shapeType: string
): PackageTemplateType {
  // カテゴリベースの選択を優先
  const categoryTemplate = selectTemplateForCategory(category);
  const shapeTemplate = selectTemplateForShape(shapeType);

  // カテゴリと形状の一致を確認
  if (categoryTemplate === shapeTemplate) {
    return categoryTemplate;
  }

  // 飲料・化粧品の場合は形状を優先
  if (category === '飲料' || category === '化粧品') {
    if (shapeType === 'cylindrical' || shapeType === 'spherical') {
      return 'bottle-cylinder';
    }
  }

  // その他の場合はカテゴリを優先
  return categoryTemplate;
}

/**
 * テンプレート情報を取得（詳細付き）
 *
 * @param templateType テンプレート種類
 * @returns テンプレート情報
 *
 * @example
 * ```typescript
 * const info = await getTemplateInfo('box-standard');
 * console.log(info.description);
 * ```
 */
export async function getTemplateInfo(templateType: PackageTemplateType): Promise<{
  type: PackageTemplateType;
  name: string;
  description: string;
  aspectRatio: string;
  recommendedSize: { width: number; height: number };
  recommendedCategories: string[];
}> {
  const template = await loadTemplate(templateType);

  return {
    type: template.type,
    name: template.name,
    description: template.description,
    aspectRatio: template.designParams.aspectRatio,
    recommendedSize: template.designParams.recommendedSize,
    recommendedCategories: template.recommendedCategories,
  };
}

/**
 * すべてのテンプレート情報を取得
 *
 * @returns すべてのテンプレート情報
 *
 * @example
 * ```typescript
 * const allInfo = await getAllTemplateInfo();
 * allInfo.forEach(info => console.log(info.name));
 * ```
 */
export async function getAllTemplateInfo() {
  const templates = await loadAllTemplates();

  return templates.map((template) => ({
    type: template.type,
    name: template.name,
    description: template.description,
    aspectRatio: template.designParams.aspectRatio,
    recommendedSize: template.designParams.recommendedSize,
    recommendedCategories: template.recommendedCategories,
  }));
}

/**
 * キャッシュをクリア
 */
export function clearTemplateCache(): void {
  templateCache.clear();
}
