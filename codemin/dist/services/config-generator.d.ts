export declare class ConfigGenerator {
    generateOpenCodeConfig(): Promise<string>;
    generateContinueConfig(): Promise<string>;
    ensureConfigs(): Promise<{
        opencode: string;
        continue: string;
    }>;
    private printInstructions;
    configsExist(): boolean;
    countExistingConfigs(): number;
}
export declare const configGenerator: ConfigGenerator;
//# sourceMappingURL=config-generator.d.ts.map