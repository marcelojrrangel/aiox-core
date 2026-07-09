import { type SpawnOptions } from 'node:child_process';
export interface ExecResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}
export declare function execCommand(command: string, args?: string[], options?: SpawnOptions): Promise<ExecResult>;
export declare function executeAndCheck(command: string, args?: string[]): Promise<{
    success: boolean;
    stdout: string;
    stderr: string;
}>;
export declare function execSyncSafe(command: string): {
    stdout: string;
    stderr: string;
    success: boolean;
};
export declare function isWindows(): boolean;
export declare function isMacOS(): boolean;
export declare function isLinux(): boolean;
//# sourceMappingURL=shell.d.ts.map