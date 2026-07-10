import type { FimRequest, FimResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { OLLAMA_HOST } from './ollama-client.js';
const DEFAULT_MODEL = 'qwen2.5-coder:7b';

export class FimService {
  private baseUrl: string;

  constructor(baseUrl = OLLAMA_HOST) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get a FIM (Fill-in-the-Middle) completion from Ollama.
   * Ollama supports FIM via the `suffix` parameter in the generate endpoint.
   */
  async getCompletion(
    prefix: string,
    suffix: string,
    language: string,
    options?: { maxTokens?: number; temperature?: number; model?: string }
  ): Promise<FimResponse> {
    const model = options?.model ?? DEFAULT_MODEL;
    const maxTokens = options?.maxTokens ?? 128;
    const temperature = options?.temperature ?? 0.2;

    logger.debug(`FIM request: model=${model}, prefix=${prefix.slice(0, 50)}..., suffix=${suffix.slice(0, 50)}...`);

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: prefix,
        suffix,
        options: {
          num_predict: maxTokens,
          temperature,
          top_p: 0.9,
          stop: ['<|fim_middle|>', '<|endoftext|>'],
        },
        stream: false,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro no FIM: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as { response: string; eval_count?: number };
    return {
      completion: data.response ?? '',
      model,
      tokensUsed: data.eval_count,
    };
  }

  /**
   * Stream a FIM completion token by token.
   */
  async *streamCompletion(
    prefix: string,
    suffix: string,
    language: string,
    options?: { maxTokens?: number; temperature?: number; model?: string }
  ): AsyncGenerator<string, void, unknown> {
    const model = options?.model ?? DEFAULT_MODEL;
    const maxTokens = options?.maxTokens ?? 128;
    const temperature = options?.temperature ?? 0.2;

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: prefix,
        suffix,
        options: {
          num_predict: maxTokens,
          temperature,
          top_p: 0.9,
          stop: ['<|fim_middle|>', '<|endoftext|>'],
        },
        stream: true,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro no FIM streaming: ${response.status} ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Stream não disponível');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line) as { response?: string; done: boolean };
          if (data.response) {
            yield data.response;
          }
          if (data.done) return;
        } catch {
          // Incomplete line, accumulate
        }
      }
    }
  }

  /**
   * Build a FIM prompt using the Qwen2.5-Coder template format.
   */
  buildFimPrompt(prefix: string, suffix: string): string {
    return `<|fim_prefix|>${prefix}<|fim_suffix|>${suffix}<|fim_middle|>`;
  }
}

export const fimService = new FimService();
