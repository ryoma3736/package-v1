/**
 * 商品説明文生成モジュール
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  PromptContext,
  DescriptionOptions,
} from './types.js';
import { TextGenerationError } from './types.js';
import { buildDescriptionPrompt } from './prompts/description.js';

/**
 * 商品説明文の生成結果
 */
export interface DescriptionResult {
  long: string;
  short: string;
  bullet_points: string[];
}

/**
 * 商品説明文を生成
 *
 * @param context プロンプトコンテキスト
 * @param apiKey Claude APIキー
 * @param options 説明生成オプション
 * @param timeout タイムアウト（ミリ秒）
 * @param temperature 温度設定（0.0-1.0）
 * @returns 商品説明文
 */
export async function generateDescription(
  context: PromptContext,
  apiKey: string,
  options: DescriptionOptions = {},
  timeout: number = 30000,
  temperature: number = 0.7
): Promise<DescriptionResult> {
  const anthropic = new Anthropic({ apiKey });

  const prompt = buildDescriptionPrompt(context, options);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature,
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
        return validateDescriptionResult(parsed);
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

    return validateDescriptionResult(parsed);
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
      // API関連エラー
      if (error.message.includes('API') || error.message.includes('401') || error.message.includes('403')) {
        throw new TextGenerationError(
          `API認証エラー: ${error.message}`,
          'API_ERROR',
          { originalError: error.message }
        );
      }
      // ネットワークエラー
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
      '説明文生成中に不明なエラーが発生しました',
      'UNKNOWN'
    );
  }
}

/**
 * 説明文の結果を検証
 */
function validateDescriptionResult(data: unknown): DescriptionResult {
  if (!data || typeof data !== 'object') {
    throw new TextGenerationError(
      'APIレスポンスの形式が不正です',
      'INVALID_INPUT',
      { receivedData: typeof data }
    );
  }

  const obj = data as Record<string, unknown>;
  const { long, short, bullet_points } = obj;

  if (typeof long !== 'string' || long.length === 0) {
    throw new TextGenerationError(
      '長文説明（long）が不正または欠落しています',
      'INVALID_INPUT',
      { field: 'long', received: typeof long }
    );
  }

  if (typeof short !== 'string' || short.length === 0) {
    throw new TextGenerationError(
      '短文説明（short）が不正または欠落しています',
      'INVALID_INPUT',
      { field: 'short', received: typeof short }
    );
  }

  if (!Array.isArray(bullet_points) || bullet_points.length === 0) {
    throw new TextGenerationError(
      '箇条書きポイント（bullet_points）が不正または欠落しています',
      'INVALID_INPUT',
      { field: 'bullet_points', received: typeof bullet_points }
    );
  }

  // 全ての箇条書きポイントが文字列であることを確認
  if (!bullet_points.every((point) => typeof point === 'string')) {
    throw new TextGenerationError(
      '箇条書きポイントには文字列のみ指定できます',
      'INVALID_INPUT',
      { field: 'bullet_points' }
    );
  }

  return {
    long: long.trim(),
    short: short.trim(),
    bullet_points: bullet_points.map((point) => point.trim()),
  };
}

/**
 * 文字数チェック（デバッグ用）
 */
export function validateDescriptionLength(result: DescriptionResult): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  const longLength = result.long.length;
  if (longLength < 500 || longLength > 1200) {
    warnings.push(
      `長文説明の文字数が範囲外です（${longLength}文字、推奨: 500-1000文字）`
    );
  }

  const shortLength = result.short.length;
  if (shortLength < 100 || shortLength > 250) {
    warnings.push(
      `短文説明の文字数が範囲外です（${shortLength}文字、推奨: 100-200文字）`
    );
  }

  if (result.bullet_points.length < 3) {
    warnings.push(
      `箇条書きポイントが少なすぎます（${result.bullet_points.length}個、推奨: 3-5個）`
    );
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
