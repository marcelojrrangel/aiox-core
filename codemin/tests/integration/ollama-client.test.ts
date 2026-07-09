import { describe, it, expect, vi, beforeEach } from 'vitest';

// We mock the fetch for integration-style tests
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

vi.mock('../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { OllamaClient } from '../../src/services/ollama-client.js';

describe('OllamaClient (integration-style)', () => {
  let client: OllamaClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new OllamaClient('http://localhost:11434');
  });

  describe('ping', () => {
    it('should return true when API responds', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      });

      const result = await client.ping();
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/tags',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return false when connection fails', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));

      const result = await client.ping();
      expect(result).toBe(false);
    });
  });

  describe('listModels', () => {
    it('should return list of models', async () => {
      const fakeModels = {
        models: [
          { name: 'qwen2.5-coder:7b', size: 4700000000 },
          { name: 'qwen2.5-coder:1.5b', size: 1000000000 },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(fakeModels),
      });

      const models = await client.listModels();
      expect(models).toHaveLength(2);
      expect(models[0].name).toBe('qwen2.5-coder:7b');
      expect(models[0].size).toBe(4700000000);
    });

    it('should throw on non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(client.listModels()).rejects.toThrow('Internal Server Error');
    });
  });

  describe('modelExists', () => {
    it('should return true when model is in list', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          models: [{ name: 'qwen2.5-coder:7b', size: 4700000000 }],
        }),
      });

      const exists = await client.modelExists('qwen2.5-coder:7b');
      expect(exists).toBe(true);
    });

    it('should return false when model is not in list', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      });

      const exists = await client.modelExists('nonexistent-model');
      expect(exists).toBe(false);
    });
  });

  describe('chat', () => {
    it('should return response text', async () => {
      const fakeResponse = {
        message: { role: 'assistant', content: 'Hello! How can I help?' },
        done: true,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(fakeResponse),
      });

      const response = await client.chat('qwen2.5-coder:7b', [
        { role: 'user', content: 'Hi' },
      ]);

      expect(response).toBe('Hello! How can I help?');
    });
  });

  describe('generate', () => {
    it('should return generated text', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ response: 'function add(a, b) { return a + b; }' }),
      });

      const result = await client.generate('Create add function', {
        temperature: 0.2,
        maxTokens: 100,
      });

      expect(result).toBe('function add(a, b) { return a + b; }');
    });
  });
});
