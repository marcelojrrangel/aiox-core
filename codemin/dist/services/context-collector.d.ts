import { type ContextInfo, type ProjectContext } from '../types/index.js';
export declare class ContextCollector {
    private cache;
    private readonly CACHE_TTL;
    collectProjectContext(rootDir?: string): Promise<ProjectContext>;
    collectFileContext(filePaths: string[]): Promise<ContextInfo[]>;
    getContextSummary(context: ProjectContext): string;
    formatContext(context: ProjectContext): string;
    clearCache(): void;
    private scanDirectory;
    private extractContextInfo;
    private extractSymbols;
    private extractImports;
    private extractExports;
    private extractTypes;
}
export declare const contextCollector: ContextCollector;
//# sourceMappingURL=context-collector.d.ts.map