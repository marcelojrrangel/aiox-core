import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/services/ollama-client.js', () => ({
  ollamaClient: {
    ping: vi.fn(),
    listModels: vi.fn(),
    modelExists: vi.fn(),
  },
}));

vi.mock('../../src/services/model-manager.js', () => ({
  modelManager: {
    getDefaultModel: vi.fn(() => 'qwen2.5-coder:7b'),
    isInstalled: vi.fn(),
    detectOllamaInstall: vi.fn(),
    detectOllamaServer: vi.fn(),
  },
}));

vi.mock('../../src/services/config-generator.js', () => ({
  configGenerator: {
    configsExist: vi.fn(),
    countExistingConfigs: vi.fn(),
  },
}));

vi.mock('../../src/utils/paths.js', () => ({
  getOpenCodeConfigPath: vi.fn(() => '/fake/.codemin/configs/opencode.json'),
  getContinueConfigPath: vi.fn(() => '/fake/.codemin/configs/continue.config.json'),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

vi.mock('../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    step: vi.fn(),
    header: vi.fn(),
    divider: vi.fn(),
  },
}));

import { HealthChecker } from '../../src/services/health-check.js';
import { ollamaClient } from '../../src/services/ollama-client.js';
import { modelManager } from '../../src/services/model-manager.js';
import { existsSync } from 'node:fs';

describe('HealthChecker', () => {
  let checker: HealthChecker;

  beforeEach(() => {
    vi.clearAllMocks();
    checker = new HealthChecker();
  });

  describe('checkOllama', () => {
    it('should return ok when Ollama is running', async () => {
      vi.mocked(ollamaClient.ping).mockResolvedValue(true);

      const result = await checker.checkOllama();

      expect(result.status).toBe('ok');
      expect(result.check).toBe('Ollama Server');
    });

    it('should return error when Ollama is not running', async () => {
      vi.mocked(ollamaClient.ping).mockResolvedValue(false);

      const result = await checker.checkOllama();

      expect(result.status).toBe('error');
      expect(result.suggestion).toContain('ollama serve');
    });
  });

  describe('checkModel', () => {
    it('should return ok when model is installed', async () => {
      vi.mocked(modelManager.isInstalled).mockResolvedValue(true);

      const result = await checker.checkModel();

      expect(result.status).toBe('ok');
      expect(result.message).toContain('instalado');
    });

    it('should return warn when model is not installed', async () => {
      vi.mocked(modelManager.isInstalled).mockResolvedValue(false);

      const result = await checker.checkModel();

      expect(result.status).toBe('warn');
    });
  });

  describe('checkNodeVersion', () => {
    it('should return ok for Node.js >= 18', async () => {
      const result = await checker.checkNodeVersion();

      expect(result.status).toBe('ok');
    });
  });

  describe('run', () => {
    it('should return complete health status with all checks', async () => {
      vi.mocked(ollamaClient.ping).mockResolvedValue(true);
      vi.mocked(modelManager.isInstalled).mockResolvedValue(true);
      vi.mocked(existsSync).mockReturnValue(true);

      const status = await checker.run();

      expect(status.details).toBeInstanceOf(Array);
      expect(status.details.length).toBeGreaterThanOrEqual(5);
      expect(typeof status.ollamaRunning).toBe('boolean');
        expect(typeof status.modelInstalled).toBe('boolean');
        expect(typeof status.configsExist).toBe('boolean');
    });
  });
});
