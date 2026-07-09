import type { DocGenerationResult } from '../types/index.js';
export declare class DocGenerator {
    private baseUrl;
    constructor(baseUrl?: string);
    generateDocs(code: string, language: string): Promise<DocGenerationResult>;
    private extractCodeBlock;
}
export declare const docGenerator: DocGenerator;
//# sourceMappingURL=doc-generator.d.ts.map