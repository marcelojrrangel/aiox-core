import type { CodeReviewReport } from '../types/index.js';
export declare class CodeReviewService {
    private baseUrl;
    constructor(baseUrl?: string);
    review(code: string, language: string): Promise<CodeReviewReport>;
    private parseReviewReport;
}
export declare const codeReviewService: CodeReviewService;
//# sourceMappingURL=code-review.d.ts.map