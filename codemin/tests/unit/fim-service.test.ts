import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch before importing FimService
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { FimService } from '../../src/services/fim-service.js';

describe('FimService', () => {
  let service: FimService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FimService('http://localhost:11434');
  });

  describe('getCompletion', () => {
    it('should return completion from Ollama FIM endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'return a + b;', eval_count: 5 }),
      });

      const result = await service.getCompletion(
        'function add(a, b) {',
        '}',
        'typescript'
      );

      expect(result.completion).toBe('return a + b;');
      expect(result.model).toBe('qwen2.5-coder:7b');
      expect(result.tokensUsed).toBe(5);
    });

    it('should send correct request body with suffix parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: '// TODO', eval_count: 2 }),
      });

      await service.getCompletion('prefix', 'suffix', 'python', {
        maxTokens: 64,
        temperature: 0.1,
        model: 'qwen2.5-coder:1.5b',
      });

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe('http://localhost:11434/api/generate');

      const body = JSON.parse(callArgs[1].body);
      expect(body.model).toBe('qwen2.5-coder:1.5b');
      expect(body.prompt).toBe('prefix');
      expect(body.suffix).toBe('suffix');
      expect(body.options.num_predict).toBe(64);
      expect(body.options.temperature).toBe(0.1);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Model not found',
      });

      await expect(
        service.getCompletion('test', 'test', 'typescript')
      ).rejects.toThrow('Erro no FIM: 404 Model not found');
    });

    it('should use default options when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'test', eval_count: 1 }),
      });

      await service.getCompletion('a', 'b', 'typescript');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe('qwen2.5-coder:7b');
      expect(body.options.num_predict).toBe(128);
      expect(body.options.temperature).toBe(0.2);
    });
  });

  describe('streamCompletion', () => {
    it('should yield tokens from SSE stream', async () => {
      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('{"response":"token1","done":false}\n'),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('{"response":"token2","done":true}\n'),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader },
      });

      const tokens: string[] = [];
      const stream = service.streamCompletion('prefix', 'suffix', 'typescript');
      for await (const token of stream) {
        tokens.push(token);
      }

      expect(tokens).toEqual(['token1', 'token2']);
    });

    it('should handle stream errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server error',
      });

      const stream = service.streamCompletion('p', 's', 'ts');
      await expect(async () => {
        for await (const _ of stream) { /* */ }
      }).rejects.toThrow('Erro no FIM streaming: 500 Server error');
    });
  });

  describe('buildFimPrompt', () => {
    it('should build correct FIM template', () => {
      const result = service.buildFimPrompt('function a() {', '}');
      expect(result).toBe('<|fim_prefix|>function a() {<|fim_suffix|>}<|fim_middle|>');
    });
  });
});
