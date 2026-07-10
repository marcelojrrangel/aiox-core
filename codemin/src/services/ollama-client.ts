import { type OllamaChatRequest, type OllamaChatResponse, type OllamaError } from '../types/index.js';

export const OLLAMA_HOST = 'http://localhost:11434';
export const OLLAMA_API_BASE = `${OLLAMA_HOST}/v1`;

export class OllamaClient {
  private baseUrl: string;

  constructor(baseUrl = OLLAMA_HOST) {
    this.baseUrl = baseUrl;
  }

  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<{ name: string; size: number }[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`);
    if (!response.ok) {
      throw new Error(`Erro ao listar modelos: ${response.statusText}`);
    }
    const data = await response.json() as { models: { name: string; size: number }[] };
    return data.models ?? [];
  }

  async modelExists(modelName: string): Promise<boolean> {
    try {
      const models = await this.listModels();
      return models.some((m) => m.name === modelName);
    } catch {
      return false;
    }
  }

  async pullModel(modelName: string, onProgress?: (status: string, completed: number, total: number) => void): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName, stream: true }),
      signal: AbortSignal.timeout(1800000),
    });

    if (!response.ok) {
      const error = await response.json() as OllamaError;
      throw new Error(`Falha ao baixar modelo: ${error.error ?? response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Stream de download não disponível');

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
          const data = JSON.parse(line) as { status: string; completed?: number; total?: number; error?: string };
          if (data.error) throw new Error(data.error);
          if (data.status === 'success') return;
          if (onProgress) onProgress(data.status, data.completed ?? 0, data.total ?? 100);
        } catch {
          // continua acumulando
        }
      }
    }
  }

  async *generateStream(
    model: string,
    messages: { role: string; content: string }[],
    options?: { temperature?: number; maxTokens?: number }
  ): AsyncGenerator<string, void, unknown> {
    const body: OllamaChatRequest = {
      model,
      messages: messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      })),
      stream: true,
      options: {
        temperature: options?.temperature ?? 0.7,
        num_predict: options?.maxTokens ?? 2048,
        top_p: 0.9,
        stop: ['<|im_end|>'],
      },
    };

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao gerar resposta: ${errorText}`);
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
          const data = JSON.parse(line) as OllamaChatResponse;
          if (data.message?.content) {
            yield data.message.content;
          }
          if (data.done) return;
        } catch {
          // Linha incompleta, continua acumulando
        }
      }
    }
  }

  async chat(
    model: string,
    messages: { role: string; content: string }[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const body: OllamaChatRequest = {
      model,
      messages: messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      })),
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.7,
        num_predict: options?.maxTokens ?? 2048,
        top_p: 0.9,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao gerar resposta: ${errorText}`);
    }

    const data = await response.json() as OllamaChatResponse;
    return data.message?.content ?? '';
  }

  async generate(prompt: string, options?: { model?: string; temperature?: number; maxTokens?: number }): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options?.model ?? 'qwen2.5-coder:7b',
        prompt,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.2,
          num_predict: options?.maxTokens ?? 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao gerar resposta: ${errorText}`);
    }

    const data = await response.json() as { response: string };
    return data.response ?? '';
  }
}

export const ollamaClient = new OllamaClient();
