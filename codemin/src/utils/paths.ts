import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

export const CODEDIR = 'codemin';

function getCodeMinHome(): string {
  return join(homedir(), `.${CODEDIR}`);
}

export function getCodeMinDir(): string {
  const dir = getCodeMinHome();
  ensureDir(dir);
  return dir;
}

export function getModelsDir(): string {
  const dir = join(getCodeMinHome(), 'models');
  ensureDir(dir);
  return dir;
}

export function getConfigsDir(): string {
  const dir = join(getCodeMinHome(), 'configs');
  ensureDir(dir);
  return dir;
}

export function getLogsDir(): string {
  const dir = join(getCodeMinHome(), 'logs');
  ensureDir(dir);
  return dir;
}

export function getCacheDir(): string {
  const dir = join(getCodeMinHome(), 'cache', 'downloads');
  ensureDir(dir);
  return dir;
}

export function getOpenCodeConfigPath(): string {
  return join(getConfigsDir(), 'opencode.json');
}

export function getContinueConfigPath(): string {
  return join(getConfigsDir(), 'continue.config.json');
}

export function getCodeminConfigPath(): string {
  return join(getCodeMinHome(), 'config.yaml');
}

export function getDefaultModelPath(): string {
  return join(getModelsDir(), 'qwen2.5-coder-7b-instruct-q4_k_m.gguf');
}

export function getContinueDir(): string {
  return join(homedir(), '.continue');
}

export function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}
