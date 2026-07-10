import type { RefactorRequest, RefactorResult } from '../types/index.js';
export declare class RefactoringService {
    private baseUrl;
    constructor(baseUrl?: string);
    refactor(request: RefactorRequest): Promise<RefactorResult>;
    private extractCodeBlock;
}
export declare const refactoringService: RefactoringService;
//# sourceMappingURL=refactoring-service.d.ts.map