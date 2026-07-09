import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
export const CODEDIR = 'codemin';
function getCodeMinHome() {
    return join(homedir(), `.${CODEDIR}`);
}
export function getCodeMinDir() {
    const dir = getCodeMinHome();
    ensureDir(dir);
    return dir;
}
export function getModelsDir() {
    const dir = join(getCodeMinHome(), 'models');
    ensureDir(dir);
    return dir;
}
export function getConfigsDir() {
    const dir = join(getCodeMinHome(), 'configs');
    ensureDir(dir);
    return dir;
}
export function getLogsDir() {
    const dir = join(getCodeMinHome(), 'logs');
    ensureDir(dir);
    return dir;
}
export function getCacheDir() {
    const dir = join(getCodeMinHome(), 'cache', 'downloads');
    ensureDir(dir);
    return dir;
}
export function getOpenCodeConfigPath() {
    return join(getConfigsDir(), 'opencode.json');
}
export function getContinueConfigPath() {
    return join(getConfigsDir(), 'continue.config.json');
}
export function getCodeminConfigPath() {
    return join(getCodeMinHome(), 'config.yaml');
}
export function getDefaultModelPath() {
    return join(getModelsDir(), 'qwen2.5-coder-7b-instruct-q4_k_m.gguf');
}
export function getContinueDir() {
    return join(homedir(), '.continue');
}
export function ensureDir(dir) {
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
}
//# sourceMappingURL=paths.js.map