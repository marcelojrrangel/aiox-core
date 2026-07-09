import { execFile, execSync, spawn, type SpawnOptions } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function execCommand(
  command: string,
  args: string[] = [],
  options: SpawnOptions = {}
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data: Buffer) => {
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

export async function executeAndCheck(
  command: string,
  args: string[] = []
): Promise<{ success: boolean; stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      timeout: 30000,
    });
    return { success: true, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string };
    return {
      success: false,
      stdout: (err.stdout ?? '').toString().trim(),
      stderr: (err.stderr ?? '').toString().trim(),
    };
  }
}

export function execSyncSafe(command: string): { stdout: string; stderr: string; success: boolean } {
  try {
    const stdout = execSync(command, { encoding: 'utf-8', timeout: 30000 });
    return { stdout: stdout.trim(), stderr: '', success: true };
  } catch (error: unknown) {
    const err = error as { stdout?: Buffer; stderr?: Buffer; message?: string };
    return {
      stdout: (err.stdout ?? '').toString().trim(),
      stderr: (err.stderr ?? '').toString().trim(),
      success: false,
    };
  }
}

export function isWindows(): boolean {
  return process.platform === 'win32';
}

export function isMacOS(): boolean {
  return process.platform === 'darwin';
}

export function isLinux(): boolean {
  return process.platform === 'linux';
}
