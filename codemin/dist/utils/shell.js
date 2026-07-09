import { execFile, execSync, spawn } from 'node:child_process';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);
export async function execCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            ...options,
        });
        let stdout = '';
        let stderr = '';
        child.stdout?.on('data', (data) => {
            stdout += data.toString();
        });
        child.stderr?.on('data', (data) => {
            stderr += data.toString();
        });
        child.on('close', (exitCode) => {
            resolve({ stdout, stderr, exitCode: exitCode ?? 1 });
        });
        child.on('error', (err) => {
            reject(new Error(`Falha ao executar comando: ${err.message}`));
        });
    });
}
export async function executeAndCheck(command, args = []) {
    try {
        const { stdout, stderr } = await execFileAsync(command, args, {
            timeout: 30000,
        });
        return { success: true, stdout: stdout.trim(), stderr: stderr.trim() };
    }
    catch (error) {
        const err = error;
        return {
            success: false,
            stdout: (err.stdout ?? '').toString().trim(),
            stderr: (err.stderr ?? '').toString().trim(),
        };
    }
}
export function execSyncSafe(command) {
    try {
        const stdout = execSync(command, { encoding: 'utf-8', timeout: 30000 });
        return { stdout: stdout.trim(), stderr: '', success: true };
    }
    catch (error) {
        const err = error;
        return {
            stdout: (err.stdout ?? '').toString().trim(),
            stderr: (err.stderr ?? '').toString().trim(),
            success: false,
        };
    }
}
export function isWindows() {
    return process.platform === 'win32';
}
export function isMacOS() {
    return process.platform === 'darwin';
}
export function isLinux() {
    return process.platform === 'linux';
}
//# sourceMappingURL=shell.js.map