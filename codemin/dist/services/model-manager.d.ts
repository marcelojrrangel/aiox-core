import { type ModelConfig, type ModelCatalogEntry } from '../types/index.js';
export declare class ModelManager {
    private activeModel;
    constructor();
    resolve(modelName?: string): Promise<ModelConfig>;
    isInstalled(modelName: string): Promise<boolean>;
    downloadModel(modelName: string, force?: boolean): Promise<void>;
    removeModel(modelName: string): Promise<boolean>;
    switchModel(modelName: string): Promise<boolean>;
    listInstalledModels(): Promise<{
        name: string;
        size: number;
        details?: ModelCatalogEntry;
    }[]>;
    verifyModel(modelName: string): Promise<boolean>;
    getDefaultModel(): string;
    getFallbackModel(): string;
    getCatalog(): ModelConfig[];
    getModelDetails(): Record<string, ModelCatalogEntry>;
    getModelDetail(id: string): ModelCatalogEntry | undefined;
    formatModelList(installed: {
        name: string;
        size: number;
        details?: ModelCatalogEntry;
    }[]): string;
    formatModelDetails(id: string): string;
    detectOllamaInstall(): Promise<{
        installed: boolean;
        version?: string;
    }>;
    detectOllamaServer(): Promise<boolean>;
}
export declare const modelManager: ModelManager;
//# sourceMappingURL=model-manager.d.ts.map