import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/services/ollama-client.js', () => ({
  ollamaClient: {
    modelExists: vi.fn(),
    chat: vi.fn(),
    ping: vi.fn(),
    listModels: vi.fn(),
    pullModel: vi.fn(),
  },
}));

vi.mock('../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    progress: vi.fn(),
    header: vi.fn(),
    divider: vi.fn(),
    step: vi.fn(),
  },
}));

vi.mock('../../src/utils/shell.js', () => ({
  executeAndCheck: vi.fn(),
  execSyncSafe: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
}));

import { ModelManager } from '../../src/services/model-manager.js';
import { ollamaClient } from '../../src/services/ollama-client.js';

describe('ModelManager', () => {
  let manager: ModelManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new ModelManager();
  });

  describe('getCatalog', () => {
    it('should return 6 models', () => {
      const catalog = manager.getCatalog();
      expect(catalog).toHaveLength(6);
      const ids = catalog.map((m) => m.id);
      expect(ids).toContain('qwen2.5-coder:7b');
      expect(ids).toContain('qwen2.5-coder:1.5b');
      expect(ids).toContain('qwen3:8b');
      expect(ids).toContain('deepseek-coder-v2:16b');
      expect(ids).toContain('phi-3:3.8b');
      expect(ids).toContain('codellama:7b');
    });
  });

  describe('getModelDetails', () => {
    it('should return details for known models', () => {
      const details = manager.getModelDetails();
      expect(details['qwen2.5-coder:7b']).toBeDefined();
      expect(details['qwen2.5-coder:7b'].speed).toBe('medium');
      expect(details['phi-3:3.8b'].speed).toBe('ultra-fast');
    });
  });

  describe('getModelDetail', () => {
    it('should return detail for known model', () => {
      const detail = manager.getModelDetail('qwen2.5-coder:7b');
      expect(detail).toBeDefined();
      expect(detail!.ramRequired).toBe('8 GB');
    });

    it('should return undefined for unknown model', () => {
      const detail = manager.getModelDetail('unknown:model');
      expect(detail).toBeUndefined();
    });
  });

  describe('listInstalledModels', () => {
    it('should return empty array when Ollama has no models', async () => {
      vi.mocked(ollamaClient.listModels).mockResolvedValue([]);

      const models = await manager.listInstalledModels();
      expect(models).toEqual([]);
    });

    it('should return models with details from Ollama', async () => {
      vi.mocked(ollamaClient.listModels).mockResolvedValue([
        { name: 'qwen2.5-coder:7b', size: 5000000000 },
      ]);

      const models = await manager.listInstalledModels();
      expect(models).toHaveLength(1);
      expect(models[0].name).toBe('qwen2.5-coder:7b');
      expect(models[0].details).toBeDefined();
    });
  });

  describe('isInstalled', () => {
    it('should return true when model exists', async () => {
      vi.mocked(ollamaClient.modelExists).mockResolvedValue(true);

      const result = await manager.isInstalled('qwen2.5-coder:7b');
      expect(result).toBe(true);
    });
  });

  describe('formatModelList', () => {
    it('should format empty list', () => {
      const result = manager.formatModelList([]);
      expect(result).toContain('Nenhum modelo instalado');
    });

    it('should format installed models', () => {
      const result = manager.formatModelList([
        { name: 'qwen2.5-coder:7b', size: 5000000000 },
      ]);
      expect(result).toContain('qwen2.5-coder:7b');
    });
  });

  describe('formatModelDetails', () => {
    it('should format details for known model', () => {
      const result = manager.formatModelDetails('qwen2.5-coder:7b');
      expect(result).toContain('Qwen2.5-Coder 7B');
      expect(result).toContain('8 GB');
    });

    it('should show message for unknown model', () => {
      const result = manager.formatModelDetails('unknown');
      expect(result).toContain('não encontrado');
    });
  });
});
