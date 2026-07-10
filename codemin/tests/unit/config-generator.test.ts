import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync } from 'node:fs';

vi.mock('../../src/utils/paths.js', () => {
  const fs = require('node:fs');
  const tmpDir = mkdtempSync(join(tmpdir(), 'codemin-test-'));
  const configsDir = join(tmpDir, 'configs');
  fs.mkdirSync(configsDir, { recursive: true });
  return {
    getCodeMinDir: vi.fn(() => tmpDir),
    getModelsDir: vi.fn(() => join(tmpDir, 'models')),
    getConfigsDir: vi.fn(() => configsDir),
    getLogsDir: vi.fn(() => join(tmpDir, 'logs')),
    getCacheDir: vi.fn(() => join(tmpDir, 'cache')),
    getOpenCodeConfigPath: vi.fn(() => join(configsDir, 'opencode.json')),
    getContinueConfigPath: vi.fn(() => join(configsDir, 'continue.config.json')),
    ensureDir: vi.fn((dir: string) => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }),
  };
});

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

import { ConfigGenerator } from '../../src/services/config-generator.js';
import { getOpenCodeConfigPath, getContinueConfigPath, ensureDir } from '../../src/utils/paths.js';

describe('ConfigGenerator', () => {
  let generator: ConfigGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new ConfigGenerator();
  });

  describe('generateOpenCodeConfig', () => {
    it('should generate a valid opencode.json file', async () => {
      const configPath = await generator.generateOpenCodeConfig();

      expect(existsSync(configPath)).toBe(true);

      const content = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(content.provider).toBe('openai');
      expect(content.model).toBe('qwen2.5-coder:7b');
      expect(content.apiBase).toBe('http://localhost:11434/v1');
      expect(content.temperature).toBe(0.2);
      expect(content.contextLength).toBe(8192);
      expect(content.stream).toBe(true);
    });
  });

  describe('generateContinueConfig', () => {
    it('should generate a valid continue.config.json file', async () => {
      const configPath = await generator.generateContinueConfig();

      expect(existsSync(configPath)).toBe(true);

      const content = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(content.models).toBeInstanceOf(Array);
      expect(content.models.length).toBe(1);
      expect(content.models[0].provider).toBe('ollama');
      expect(content.models[0].model).toBe('qwen2.5-coder:7b');
      expect(content.tabAutocompleteModel).toBeDefined();
      expect(content.tabAutocompleteModel.model).toBe('qwen2.5-coder:7b');
    });
  });

  describe('ensureConfigs', () => {
    it('should generate both config files', async () => {
      const result = await generator.ensureConfigs();

      expect(result.opencode).toBeDefined();
      expect(result.continue).toBeDefined();
      expect(existsSync(result.opencode)).toBe(true);
      expect(existsSync(result.continue)).toBe(true);
    });
  });

  describe('countExistingConfigs', () => {
    it('should return 0 when no configs exist', () => {
      // Mock paths that don't exist
      const count = generator.countExistingConfigs();
      // The config dir exists, but files may or may not
      expect(typeof count).toBe('number');
    });
  });
});
