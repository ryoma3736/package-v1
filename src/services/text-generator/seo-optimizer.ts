/**
 * SEO最適化テキスト生成モジュール
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  PromptContext,
  SEOOptions,
} from './types.js';
import { TextGenerationError } from './types.js';
import { buildSEOPrompt } from './prompts/seo.js';

/**
 * SEO最適化テキスト生成結果
 */
export interface SEOResult {
  title: string;
  description: string;
  keywords: string[];
}

/**
 * SEO最適化テキストを生成
 *
 * @param context プロンプトコンテキスト
 * @param apiKey Claude APIキー
 * @param options SEO最適化オプション
 * @param timeout タイムアウト（ミリ秒）
 * @param temperature 温度設定（0.0-1.0）
 * @returns SEO最適化テキスト
 */
export async function generateSEO(
  context: PromptContext,
  apiKey: string,
  options: SEOOptions = {},
  timeout: number = 30000,
  temperature: number = 0.5
): Promise<SEOResult> {
  const anthropic = new Anthropic({ apiKey });

  const prompt = buildSEOPrompt(context, options);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature, // SEOは正確性が重要なので、低めの温度
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    clearTimeout(timeoutId);

    // レスポンスからテキストを抽出
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new TextGenerationError(
        'APIレスポンスの形式が想定外です（テキスト以外の形式）',
        'API_ERROR',
        { responseType: content.type }
      );
    }

    const text = content.text;

    // JSONブロックを抽出
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      // JSONブロックがない場合、全体をパースしてみる
      try {
        const parsed = JSON.parse(text);
        return validateSEOResult(parsed);
      } catch {
        throw new TextGenerationError(
          'AIレスポンスをJSONとして解析できませんでした',
          'API_ERROR',
          { rawResponse: text.substring(0, 200) }
        );
      }
    }

    const jsonText = jsonMatch[1];
    const parsed = JSON.parse(jsonText);

    return validateSEOResult(parsed);
  } catch (error) {
    if (error instanceof TextGenerationError) {
      throw error;
    }
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new TextGenerationError(
          'リクエストがタイムアウトしました',
          'TIMEOUT',
          { originalError: error.message }
        );
      }
      if (error.message.includes('API') || error.message.includes('401') || error.message.includes('403')) {
        throw new TextGenerationError(
          `API認証エラー: ${error.message}`,
          'API_ERROR',
          { originalError: error.message }
        );
      }
      if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
        throw new TextGenerationError(
          `ネットワークエラー: ${error.message}`,
          'NETWORK_ERROR',
          { originalError: error.message }
        );
      }
      throw new TextGenerationError(
        error.message,
        'UNKNOWN',
        { originalError: error.message }
      );
    }
    throw new TextGenerationError(
      'SEOテキスト生成中に不明なエラーが発生しました',
      'UNKNOWN'
    );
  }
}

/**
 * SEO結果を検証
 */
function validateSEOResult(data: unknown): SEOResult {
  if (!data || typeof data !== 'object') {
    throw new TextGenerationError(
      'APIレスポンスの形式が不正です',
      'INVALID_INPUT',
      { receivedData: typeof data }
    );
  }

  const obj = data as Record<string, unknown>;
  const { title, description, keywords } = obj;

  if (typeof title !== 'string' || title.length === 0) {
    throw new TextGenerationError(
      'SEOタイトル（title）が不正または欠落しています',
      'INVALID_INPUT',
      { field: 'title', received: typeof title }
    );
  }

  if (typeof description !== 'string' || description.length === 0) {
    throw new TextGenerationError(
      'メタディスクリプション（description）が不正または欠落しています',
      'INVALID_INPUT',
      { field: 'description', received: typeof description }
    );
  }

  if (!Array.isArray(keywords) || keywords.length === 0) {
    throw new TextGenerationError(
      'キーワード（keywords）が不正または欠落しています',
      'INVALID_INPUT',
      { field: 'keywords', received: typeof keywords }
    );
  }

  // 全てのキーワードが文字列であることを確認
  if (!keywords.every((keyword) => typeof keyword === 'string')) {
    throw new TextGenerationError(
      'キーワードには文字列のみ指定できます',
      'INVALID_INPUT',
      { field: 'keywords' }
    );
  }

  return {
    title: title.trim(),
    description: description.trim(),
    keywords: keywords.map((keyword) => keyword.trim()),
  };
}

/**
 * SEOテキストの品質チェック
 */
export function validateSEOQuality(result: SEOResult): {
  valid: boolean;
  warnings: string[];
  score: number;
} {
  const warnings: string[] = [];
  let score = 100;

  // タイトルの長さチェック（60文字以内が理想）
  const titleLength = result.title.length;
  if (titleLength > 60) {
    warnings.push(
      `SEOタイトルが長すぎます（${titleLength}文字、推奨: 60文字以内）`
    );
    score -= 15;
  } else if (titleLength < 30) {
    warnings.push(
      `SEOタイトルが短すぎます（${titleLength}文字、推奨: 30-60文字）`
    );
    score -= 10;
  }

  // ディスクリプションの長さチェック（160文字以内が理想）
  const descLength = result.description.length;
  if (descLength > 160) {
    warnings.push(
      `メタディスクリプションが長すぎます（${descLength}文字、推奨: 160文字以内）`
    );
    score -= 15;
  } else if (descLength < 120) {
    warnings.push(
      `メタディスクリプションが短すぎます（${descLength}文字、推奨: 120-160文字）`
    );
    score -= 10;
  }

  // キーワード数のチェック（5-10個が理想）
  const keywordCount = result.keywords.length;
  if (keywordCount < 5) {
    warnings.push(
      `キーワードが少なすぎます（${keywordCount}個、推奨: 5-10個）`
    );
    score -= 10;
  } else if (keywordCount > 10) {
    warnings.push(
      `キーワードが多すぎます（${keywordCount}個、推奨: 5-10個）`
    );
    score -= 5;
  }

  // キーワードの重複チェック
  const uniqueKeywords = new Set(
    result.keywords.map((kw) => kw.toLowerCase())
  );
  if (uniqueKeywords.size !== result.keywords.length) {
    warnings.push('キーワードに重複があります');
    score -= 10;
  }

  // タイトルに主要キーワードが含まれているかチェック
  const titleLower = result.title.toLowerCase();
  const hasKeywordInTitle = result.keywords.some((kw) =>
    titleLower.includes(kw.toLowerCase())
  );
  if (!hasKeywordInTitle) {
    warnings.push('タイトルに主要キーワードが含まれていません');
    score -= 15;
  }

  // ディスクリプションに主要キーワードが含まれているかチェック
  const descLower = result.description.toLowerCase();
  const hasKeywordInDesc = result.keywords.some((kw) =>
    descLower.includes(kw.toLowerCase())
  );
  if (!hasKeywordInDesc) {
    warnings.push('ディスクリプションに主要キーワードが含まれていません');
    score -= 15;
  }

  return {
    valid: warnings.length === 0,
    warnings,
    score: Math.max(0, score),
  };
}

/**
 * キーワード密度を計算
 */
export function calculateKeywordDensity(
  text: string,
  keywords: string[]
): Map<string, number> {
  const textLower = text.toLowerCase();
  const words = textLower.split(/\s+/);
  const totalWords = words.length;

  const density = new Map<string, number>();

  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    const count = words.filter((word) => word.includes(keywordLower)).length;
    const densityPercent = (count / totalWords) * 100;
    density.set(keyword, Math.round(densityPercent * 100) / 100);
  }

  return density;
}

/**
 * SEOスコアを計算（0-100）
 */
export function calculateSEOScore(
  result: SEOResult,
  fullText: string
): number {
  const validation = validateSEOQuality(result);
  let score = validation.score;

  // キーワード密度をチェック（2-5%が理想）
  const density = calculateKeywordDensity(fullText, result.keywords);
  const avgDensity =
    Array.from(density.values()).reduce((sum, d) => sum + d, 0) /
    density.size;

  if (avgDensity < 2) {
    score -= 10; // キーワードが少なすぎる
  } else if (avgDensity > 5) {
    score -= 15; // キーワードが多すぎる（スパム判定のリスク）
  } else {
    score += 10; // 理想的な密度
  }

  return Math.min(100, Math.max(0, score));
}
