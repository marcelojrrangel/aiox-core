import type { TestGenerationResult } from '../types/index.js';
export declare class TestGenerator {
    private baseUrl;
    constructor(baseUrl?: string);
    generateTests(code: string, language: string): Promise<TestGenerationResult>;
    private extractCodeBlock;
    private buildTestFileName;
}
export declare const testGenerator: TestGenerator;
//# sourceMappingURL=test-generator.d.ts.map