export declare const OLLAMA_HOST = "http://localhost:11434";
export declare const OLLAMA_API_BASE = "http://localhost:11434/v1";
export declare class OllamaClient {
    private baseUrl;
    constructor(baseUrl?: string);
    ping(): Promise<boolean>;
    listModels(): Promise<{
        name: string;
        size: number;
    }[]>;
    modelExists(modelName: string): Promise<boolean>;
    pullModel(modelName: string, onProgress?: (status: string, completed: number, total: number) => void): Promise<void>;
    generateStream(model: string, messages: {
        role: string;
        content: string;
    }[], options?: {
        temperature?: number;
        maxTokens?: number;
    }): AsyncGenerator<string, void, unknown>;
    chat(model: string, messages: {
        role: string;
        content: string;
    }[], options?: {
        temperature?: number;
        maxTokens?: number;
    }): Promise<string>;
    generate(prompt: string, options?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
    }): Promise<string>;
}
export declare const ollamaClient: OllamaClient;
//# sourceMappingURL=ollama-client.d.ts.map