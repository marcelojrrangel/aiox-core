export interface InstallResult {
    success: boolean;
    steps: {
        name: string;
        status: 'done' | 'error' | 'skipped';
        message?: string;
    }[];
}
export declare class Installer {
    install(modelName?: string, options?: {
        force?: boolean;
        from?: string;
    }): Promise<InstallResult>;
    private checkSystem;
    private ensureOllama;
    private installOllama;
    private ensureDirectories;
}
export declare const installer: Installer;
//# sourceMappingURL=installer.d.ts.map