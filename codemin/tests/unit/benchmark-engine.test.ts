import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/services/ollama-client.js', () => ({
  ollamaClient: {
    generate: vi.fn(),
    generateStream: vi.fn(),
  },
}));

vi.mock('../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    progress: vi.fn(),
    header: vi.fn(),
    divider: vi.fn(),
  },
}));

import { BenchmarkEngine } from '../../src/services/benchmark-engine.js';

describe('BenchmarkEngine', () => {
  let engine: BenchmarkEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new BenchmarkEngine();
  });

  describe('formatBenchmarkResult', () => {
    it('should format a benchmark result', () => {
      const result = {
        model: 'qwen2.5-coder:7b',
        tokensPerSecond: 15.5,
        firstTokenLatencyMs: 350,
        totalTokens: 1024,
        durationMs: 66000,
        promptTokens: 200,
      };

      const formatted = engine.formatBenchmarkResult(result);
      expect(formatted).toContain('qwen2.5-coder:7b');
      expect(formatted).toContain('Tokens/s');
      expect(formatted).toContain('15.50');
      expect(formatted).toContain('350');
    });
  });

  describe('formatComparison', () => {
    it('should format comparison of multiple models', () => {
      const results = [
        {
          model: 'phi-3:3.8b',
          tokensPerSecond: 35.2,
          firstTokenLatencyMs: 120,
          totalTokens: 2048,
          durationMs: 58000,
          promptTokens: 200,
        },
        {
          model: 'qwen2.5-coder:7b',
          tokensPerSecond: 15.5,
          firstTokenLatencyMs: 350,
          totalTokens: 1024,
          durationMs: 66000,
          promptTokens: 200,
        },
      ];

      const formatted = engine.formatComparison(results);
      expect(formatted).toContain('Comparação de Modelos');
      expect(formatted).toContain('phi-3:3.8b');
      expect(formatted).toContain('qwen2.5-coder:7b');
      // phi-3 should be first (sorted by tokens/s descending)
      const phiIdx = formatted.indexOf('phi-3');
      const qwenIdx = formatted.indexOf('qwen2');
      expect(phiIdx).toBeLessThan(qwenIdx);
    });
  });
});
