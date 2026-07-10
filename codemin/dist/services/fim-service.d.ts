import type { FimResponse } from '../types/index.js';
export declare class FimService {
    private baseUrl;
    constructor(baseUrl?: string);
    /**
     * Get a FIM (Fill-in-the-Middle) completion from Ollama.
     * Ollama supports FIM via the `suffix` parameter in the generate endpoint.
     */
    getCompletion(prefix: string, suffix: string, language: string, options?: {
        maxTokens?: number;
        temperature?: number;
        model?: string;
    }): Promise<FimResponse>;
    /**
     * Stream a FIM completion token by token.
     */
    streamCompletion(prefix: string, suffix: string, language: string, options?: {
        maxTokens?: number;
        temperature?: number;
        model?: string;
    }): AsyncGenerator<string, void, unknown>;
    /**
     * Build a FIM prompt using the Qwen2.5-Coder template format.
     */
    buildFimPrompt(prefix: string, suffix: string): string;
}
export declare const fimService: FimService;
//# sourceMappingURL=fim-service.d.ts.map