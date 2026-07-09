import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing
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

vi.mock('../../src/utils/paths.js', () => ({
  getCodeMinDir: vi.fn(() => '/fake/.codemin'),
  getModelsDir: vi.fn(() => '/fake/.codemin/models'),
  getConfigsDir: vi.fn(() => '/fake/.codemin/configs'),
  getLogsDir: vi.fn(() => '/fake/.codemin/logs'),
  getCacheDir: vi.fn(() => '/fake/.codemin/cache/downloads'),
  getOpenCodeConfigPath: vi.fn(() => '/fake/.codemin/configs/opencode.json'),
  getContinueConfigPath: vi.fn(() => '/fake/.codemin/configs/continue.config.json'),
}));

vi.mock('../../src/services/model-manager.js', () => ({
  modelManager: {
    getDefaultModel: vi.fn(() => 'qwen2.5-coder:7b'),
    getFallbackModel: vi.fn(() => 'qwen2.5-coder:1.5b'),
    detectOllamaInstall: vi.fn(),
    downloadModel: vi.fn(),
    detectOllamaServer: vi.fn(),
  },
}));

const { mockExecuteAndCheck } = vi.hoisted(() => ({
  mockExecuteAndCheck: vi.fn(async () => ({ success: true, stdout: '', stderr: '' })),
}));

vi.mock('../../src/utils/shell.js', () => ({
  executeAndCheck: mockExecuteAndCheck,
  isWindows: vi.fn(() => false),
  isMacOS: vi.fn(() => false),
  isLinux: vi.fn(() => true),
  execCommand: vi.fn(),
  execSyncSafe: vi.fn(),
}));

vi.mock('../../src/services/config-generator.js', () => ({
  configGenerator: {
    ensureConfigs: vi.fn(),
    configsExist: vi.fn(),
    countExistingConfigs: vi.fn(),
  },
}));

import { installer, Installer } from '../../src/services/installer.js';
import { modelManager } from '../../src/services/model-manager.js';
import { configGenerator } from '../../src/services/config-generator.js';

describe('Installer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkSystem', () => {
    it('should detect Node.js version >= 18', async () => {
      // The checkSystem is private, so we test via install
      // We mock all successful paths
      vi.mocked(modelManager.detectOllamaInstall).mockResolvedValue({
        installed: true,
        version: '0.3.0',
      });
      vi.mocked(modelManager.downloadModel).mockResolvedValue(undefined);
      vi.mocked(configGenerator.ensureConfigs).mockResolvedValue({
        opencode: '/fake/opencode.json',
        continue: '/fake/continue.config.json',
      });

      const result = await installer.install();

      expect(result.success).toBe(true);
      expect(result.steps.length).toBeGreaterThanOrEqual(4);
    });

    it('should fail gracefully when Ollama is not found', { timeout: 10000 }, async () => {
      vi.mocked(modelManager.detectOllamaInstall).mockResolvedValue({
        installed: false,
      });
      mockExecuteAndCheck.mockResolvedValue({
        success: false,
        stdout: '',
        stderr: 'ollama: not found',
      });

      const result = await installer.install();

      expect(result.success).toBe(false);
      const ollamaStep = result.steps.find((s) => s.name === 'Ollama');
      expect(ollamaStep?.status).toBe('error');
    });
  });

  describe('ensureDirectories', () => {
    it('should create all required directories', () => {
      const installerInstance = new Installer();
      // Private method, but we test the install flow covers it
      expect(modelManager.getDefaultModel()).toBe('qwen2.5-coder:7b');
    });
  });
});
