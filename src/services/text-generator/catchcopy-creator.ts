/**
 * キャッチコピー生成モジュール
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  PromptContext,
  CatchcopyOptions,
} from './types.js';
import { TextGenerationError } from './types.js';
import { buildCatchcopyPrompt } from './prompts/catchcopy.js';

/**
 * キャッチコピー生成結果
 */
export interface CatchcopyResult {
  main: string;
  sub: string;
  variations: string[];
}

/**
 * キャッチコピーを生成
 *
 * @param context プロンプトコンテキスト
 * @param apiKey Claude APIキー
 * @param options キャッチコピー生成オプション
 * @param timeout タイムアウト（ミリ秒）
 * @param temperature 温度設定（0.0-1.0）
 * @returns キャッチコピー
 */
export async function generateCatchcopy(
  context: PromptContext,
  apiKey: string,
  options: CatchcopyOptions = {},
  timeout: number = 30000,
  temperature: number = 0.8
): Promise<CatchcopyResult> {
  const anthropic = new Anthropic({ apiKey });

  const prompt = buildCatchcopyPrompt(context, options);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature, // キャッチコピーは創造性が重要なので、やや高めの温度
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
        return validateCatchcopyResult(parsed);
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

    return validateCatchcopyResult(parsed);
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
      'キャッチコピー生成中に不明なエラーが発生しました',
      'UNKNOWN'
    );
  }
}

/**
 * キャッチコピーの結果を検証
 */
function validateCatchcopyResult(data: unknown): CatchcopyResult {
  if (!data || typeof data !== 'object') {
    throw new TextGenerationError(
      'APIレスポンスの形式が不正です',
      'INVALID_INPUT',
      { receivedData: typeof data }
    );
  }

  const obj = data as Record<string, unknown>;
  const { main, sub, variations } = obj;

  if (typeof main !== 'string' || main.length === 0) {
    throw new TextGenerationError(
      'メインコピー（main）が不正または欠落しています',
      'INVALID_INPUT',
      { field: 'main', received: typeof main }
    );
  }

  if (typeof sub !== 'string' || sub.length === 0) {
    throw new TextGenerationError(
      'サブコピー（sub）が不正または欠落しています',
      'INVALID_INPUT',
      { field: 'sub', received: typeof sub }
    );
  }

  if (!Array.isArray(variations) || variations.length === 0) {
    throw new TextGenerationError(
      '代替案（variations）が不正または欠落しています',
      'INVALID_INPUT',
      { field: 'variations', received: typeof variations }
    );
  }

  // 全ての代替案が文字列であることを確認
  if (!variations.every((variation) => typeof variation === 'string')) {
    throw new TextGenerationError(
      '代替案には文字列のみ指定できます',
      'INVALID_INPUT',
      { field: 'variations' }
    );
  }

  return {
    main: main.trim(),
    sub: sub.trim(),
    variations: variations.map((variation) => variation.trim()),
  };
}

/**
 * キャッチコピーの品質チェック
 */
export function validateCatchcopyQuality(
  result: CatchcopyResult,
  maxLength: number = 30
): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // メインコピーの長さチェック
  if (result.main.length > maxLength) {
    warnings.push(
      `メインコピーが長すぎます（${result.main.length}文字、推奨: ${maxLength}文字以内）`
    );
  }

  if (result.main.length < 5) {
    warnings.push('メインコピーが短すぎます（最低5文字推奨）');
  }

  // サブコピーの長さチェック
  if (result.sub.length > maxLength * 1.5) {
    warnings.push(
      `サブコピーが長すぎます（${result.sub.length}文字、推奨: ${Math.floor(maxLength * 1.5)}文字以内）`
    );
  }

  // 代替案の数チェック
  if (result.variations.length < 3) {
    warnings.push(
      `代替案が少なすぎます（${result.variations.length}個、推奨: 3-5個）`
    );
  }

  // 代替案の重複チェック
  const uniqueVariations = new Set(result.variations);
  if (uniqueVariations.size !== result.variations.length) {
    warnings.push('代替案に重複があります');
  }

  // メインコピーと代替案の重複チェック
  if (result.variations.includes(result.main)) {
    warnings.push('メインコピーと代替案が重複しています');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * キャッチコピーをランダムにシャッフル（A/Bテスト用）
 */
export function shuffleVariations(result: CatchcopyResult): CatchcopyResult {
  const allCopies = [result.main, ...result.variations];
  const shuffled = allCopies.sort(() => Math.random() - 0.5);

  return {
    main: shuffled[0],
    sub: result.sub,
    variations: shuffled.slice(1),
  };
}
