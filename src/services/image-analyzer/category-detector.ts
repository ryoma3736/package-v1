/**
 * カテゴリ検出モジュール
 * Claude APIを使用して商品カテゴリとテクスチャを推定
 */

import Anthropic from '@anthropic-ai/sdk';
import { promises as fs } from 'fs';
import {
  CategoryDetection,
  TextureAnalysis,
  ImageAnalysisError,
} from './types.js';

/**
 * 画像をBase64エンコード
 */
async function encodeImageToBase64(
  imagePath: string | Buffer
): Promise<{ data: string; mediaType: string }> {
  try {
    let buffer: Buffer;

    if (typeof imagePath === 'string') {
      buffer = await fs.readFile(imagePath);
    } else {
      buffer = imagePath;
    }

    // メディアタイプを推定（最初の数バイトで判定）
    let mediaType = 'image/jpeg';
    if (buffer[0] === 0x89 && buffer[1] === 0x50) {
      mediaType = 'image/png';
    } else if (buffer[0] === 0x47 && buffer[1] === 0x49) {
      mediaType = 'image/gif';
    } else if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
      mediaType = 'image/bmp';
    } else if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46
    ) {
      mediaType = 'image/webp';
    }

    const base64Data = buffer.toString('base64');
    return { data: base64Data, mediaType };
  } catch (error) {
    throw new ImageAnalysisError(
      '画像の読み込みに失敗しました',
      'INVALID_IMAGE',
      error
    );
  }
}

/**
 * Claude APIを使用してカテゴリを検出
 */
export async function detectCategory(
  imagePath: string | Buffer,
  apiKey: string,
  timeout: number = 30000
): Promise<CategoryDetection> {
  try {
    const client = new Anthropic({ apiKey });
    const { data, mediaType } = await encodeImageToBase64(imagePath);

    // タイムアウト処理
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () =>
          reject(
            new ImageAnalysisError('リクエストがタイムアウトしました', 'TIMEOUT')
          ),
        timeout
      );
    });

    const analysisPromise = client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as
                  | 'image/jpeg'
                  | 'image/png'
                  | 'image/gif'
                  | 'image/webp',
                data,
              },
            },
            {
              type: 'text',
              text: `この商品画像を分析し、以下の情報をJSON形式で返してください：

1. カテゴリ（category）: 主要なカテゴリ（例: 食品、化粧品、電子機器、衣料品、家具、雑貨など）
2. サブカテゴリ（subcategory）: より詳細なカテゴリ（例: 食品なら"飲料"、"菓子"など）
3. 信頼度（confidence）: 0.0から1.0の数値
4. 特徴（features）: 検出された特徴のリスト（例: ["ボトル型", "透明容器", "ラベル付き"]）
5. テクスチャ（texture）: 表面の質感（glossy, matte, metallic, rough, smooth, unknownのいずれか）
6. テクスチャの信頼度（textureConfidence）: 0.0から1.0の数値

必ずJSON形式で、以下のような構造で返してください：
{
  "category": "食品",
  "subcategory": "飲料",
  "confidence": 0.95,
  "features": ["ボトル型", "透明容器", "ラベル付き"],
  "texture": "glossy",
  "textureConfidence": 0.9
}`,
            },
          ],
        },
      ],
    });

    const response = await Promise.race([analysisPromise, timeoutPromise]);

    // レスポンスからテキストを抽出
    const textContent = response.content.find(
      (block) => block.type === 'text'
    );
    if (!textContent || textContent.type !== 'text') {
      throw new ImageAnalysisError(
        'APIレスポンスが不正です',
        'API_ERROR',
        response
      );
    }

    // JSONを抽出（マークダウンのコードブロックを考慮）
    let jsonText = textContent.text.trim();
    const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      // コードブロックがない場合、JSON部分のみを抽出
      const startIdx = jsonText.indexOf('{');
      const endIdx = jsonText.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        jsonText = jsonText.substring(startIdx, endIdx + 1);
      }
    }

    const result = JSON.parse(jsonText);

    return {
      category: result.category || '不明',
      subcategory: result.subcategory,
      confidence: Math.min(1, Math.max(0, result.confidence || 0.5)),
      features: Array.isArray(result.features) ? result.features : [],
    };
  } catch (error) {
    if (error instanceof ImageAnalysisError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new ImageAnalysisError('リクエストがタイムアウトしました', 'TIMEOUT');
      }
      if (error.message.includes('network')) {
        throw new ImageAnalysisError('ネットワークエラーが発生しました', 'NETWORK_ERROR', error);
      }
    }

    throw new ImageAnalysisError(
      'カテゴリ検出中にエラーが発生しました',
      'API_ERROR',
      error
    );
  }
}

/**
 * Claude APIを使用してテクスチャを検出
 */
export async function detectTexture(
  imagePath: string | Buffer,
  apiKey: string,
  timeout: number = 30000
): Promise<TextureAnalysis> {
  try {
    const client = new Anthropic({ apiKey });
    const { data, mediaType } = await encodeImageToBase64(imagePath);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () =>
          reject(
            new ImageAnalysisError('リクエストがタイムアウトしました', 'TIMEOUT')
          ),
        timeout
      );
    });

    const analysisPromise = client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as
                  | 'image/jpeg'
                  | 'image/png'
                  | 'image/gif'
                  | 'image/webp',
                data,
              },
            },
            {
              type: 'text',
              text: `この商品の表面のテクスチャ（質感）を分析し、JSON形式で返してください：

テクスチャタイプは以下のいずれかを選択：
- glossy: 光沢のある、ツヤツヤした
- matte: マット、艶消し
- metallic: 金属的な
- rough: 粗い、ざらざらした
- smooth: 滑らか
- unknown: 判別不能

JSONフォーマット：
{
  "type": "glossy",
  "confidence": 0.9,
  "description": "光沢のあるプラスチック素材"
}`,
            },
          ],
        },
      ],
    });

    const response = await Promise.race([analysisPromise, timeoutPromise]);

    const textContent = response.content.find(
      (block) => block.type === 'text'
    );
    if (!textContent || textContent.type !== 'text') {
      throw new ImageAnalysisError(
        'APIレスポンスが不正です',
        'API_ERROR',
        response
      );
    }

    let jsonText = textContent.text.trim();
    const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      const startIdx = jsonText.indexOf('{');
      const endIdx = jsonText.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        jsonText = jsonText.substring(startIdx, endIdx + 1);
      }
    }

    const result = JSON.parse(jsonText);

    return {
      type: result.type || 'unknown',
      confidence: Math.min(1, Math.max(0, result.confidence || 0.5)),
      description: result.description,
    };
  } catch (error) {
    if (error instanceof ImageAnalysisError) {
      throw error;
    }

    throw new ImageAnalysisError(
      'テクスチャ検出中にエラーが発生しました',
      'API_ERROR',
      error
    );
  }
}
