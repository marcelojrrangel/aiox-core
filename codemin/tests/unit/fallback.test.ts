import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:os', () => ({
  totalmem: vi.fn(),
}));

import { totalmem } from 'node:os';

vi.mock('../../src/services/ollama-client.js', () => ({
  ollamaClient: {
    modelExists: vi.fn(),
    pullModel: vi.fn(),
    ping: vi.fn(),
    listModels: vi.fn(),
  },
}));

vi.mock('../../src/services/model-manager.js', () => ({
  modelManager: {
    getDefaultModel: vi.fn().mockReturnValue('qwen2.5-coder:7b'),
  },
}));

vi.mock('../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    header: vi.fn(),
    divider: vi.fn(),
    step: vi.fn(),
  },
}));

import { FallbackService } from '../../src/services/fallback.js';

describe('FallbackService', () => {
  let service: FallbackService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FallbackService();
  });

  describe('getTotalRamGB', () => {
    it('should return total RAM in GB', () => {
      vi.mocked(totalmem).mockReturnValue(16 * 1024 * 1024 * 1024); // 16 GB
      expect(service.getTotalRamGB()).toBe(16);
    });

    it('should handle decimal values', () => {
      vi.mocked(totalmem).mockReturnValue(12.5 * 1024 * 1024 * 1024); // 12.5 GB
      expect(service.getTotalRamGB()).toBe(12.5);
    });
  });

  describe('needsFallback', () => {
    it('should return true when RAM is less than 12 GB', () => {
      vi.mocked(totalmem).mockReturnValue(8 * 1024 * 1024 * 1024); // 8 GB
      expect(service.needsFallback()).toBe(true);
    });

    it('should return false when RAM is 12 GB or more', () => {
      vi.mocked(totalmem).mockReturnValue(16 * 1024 * 1024 * 1024);
      expect(service.needsFallback()).toBe(false);
    });

    it('should return true when RAM is exactly at threshold - epsilon', () => {
      vi.mocked(totalmem).mockReturnValue(11.9 * 1024 * 1024 * 1024);
      expect(service.needsFallback()).toBe(true);
    });
  });

  describe('getRecommendedModel', () => {
    it('should recommend small model when RAM is low', () => {
      vi.mocked(totalmem).mockReturnValue(8 * 1024 * 1024 * 1024);
      expect(service.getRecommendedModel()).toBe('qwen2.5-coder:1.5b');
    });

    it('should recommend full model when RAM is sufficient', () => {
      vi.mocked(totalmem).mockReturnValue(16 * 1024 * 1024 * 1024);
      expect(service.getRecommendedModel()).toBe('qwen2.5-coder:7b');
    });
  });

  describe('getStatus', () => {
    it('should return status with fallback info when RAM is low', async () => {
      vi.mocked(totalmem).mockReturnValue(8 * 1024 * 1024 * 1024);

      const status = await service.getStatus();

      expect(status.totalRamGB).toBe(8);
      expect(status.usingFallback).toBe(true);
      expect(status.recommendedModel).toBe('qwen2.5-coder:1.5b');
      expect(status.currentModel).toBe('qwen2.5-coder:7b');
      expect(status.reason).toContain('RAM total');
    });

    it('should return status without fallback when RAM is sufficient', async () => {
      vi.mocked(totalmem).mockReturnValue(16 * 1024 * 1024 * 1024);

      const status = await service.getStatus();

      expect(status.usingFallback).toBe(false);
      expect(status.recommendedModel).toBe('qwen2.5-coder:7b');
      expect(status.reason).toBeUndefined();
    });
  });
});
