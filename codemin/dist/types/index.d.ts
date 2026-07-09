export interface CodeminConfig {
    defaultModel: string;
    ollama: {
        host: string;
        port: number;
    };
    models: ModelConfig[];
}
export interface ModelConfig {
    id: string;
    name: string;
    size: string;
    url: string;
    sha256?: string;
}
export interface InstallOptions {
    force: boolean;
    model?: string;
}
export interface InstallStep {
    name: string;
    status: 'pending' | 'running' | 'done' | 'error';
    message: string;
}
export interface HealthStatus {
    ollamaRunning: boolean;
    modelInstalled: boolean;
    configsExist: boolean;
    diskSpaceOk: boolean;
    nodeVersionOk: boolean;
    details: HealthDetail[];
}
export interface HealthDetail {
    check: string;
    status: 'ok' | 'warn' | 'error';
    message: string;
    suggestion?: string;
}
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface OllamaChatRequest {
    model: string;
    messages: ChatMessage[];
    stream: boolean;
    options?: {
        temperature?: number;
        num_predict?: number;
        top_p?: number;
        stop?: string[];
    };
}
export interface OllamaChatResponse {
    model: string;
    created_at: string;
    message: ChatMessage;
    done: boolean;
}
export interface OllamaError {
    error: string;
}
export interface GenerateOptions {
    temperature?: number;
    maxTokens?: number;
    language?: string;
}
export interface OpenCodeConfig {
    provider: string;
    model: string;
    apiBase: string;
    apiKey: string;
    stream: boolean;
    maxTokens: number;
    temperature: number;
    contextLength: number;
}
export interface ContinueConfig {
    models: ContinueModel[];
    tabAutocompleteModel: ContinueAutocompleteModel;
    systemMessage: string;
}
export interface ContinueModel {
    title: string;
    provider: string;
    model: string;
    apiKey: string;
    apiBase: string;
    contextLength: number;
    completionOptions: {
        maxTokens: number;
        temperature: number;
        topP: number;
    };
}
export interface ContinueAutocompleteModel {
    title: string;
    provider: string;
    model: string;
    apiKey: string;
    apiBase: string;
    completionOptions: {
        maxTokens: number;
        temperature: number;
        topP: number;
    };
}
export interface FimRequest {
    prefix: string;
    suffix: string;
    language: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
}
export interface FimResponse {
    completion: string;
    model: string;
    tokensUsed?: number;
}
export interface BugReport {
    line: number;
    type: string;
    severity: 'alta' | 'media' | 'baixa';
    description: string;
    suggestion: string;
}
export interface CodeReviewReport {
    summary: string;
    issues: CodeReviewIssue[];
    score: number;
}
export interface CodeReviewIssue {
    category: 'segurança' | 'performance' | 'boas-práticas' | 'manutenibilidade';
    severity: 'crítico' | 'alto' | 'médio' | 'baixo' | 'info';
    line?: number;
    description: string;
    suggestion: string;
}
export interface TestGenerationResult {
    framework: string;
    testCode: string;
    fileName: string;
}
export interface DocGenerationResult {
    language: string;
    docFormat: string;
    documentedCode: string;
}
export interface LanguageInfo {
    name: string;
    extension: string;
    systemPrompt: string;
    docFormat: 'jsdoc' | 'pep257' | 'javadoc' | 'docstring' | 'godoc' | 'rustdoc';
    testFramework: string;
    commentStyle: string;
    linter?: string;
}
export interface ModelCatalogEntry {
    id: string;
    name: string;
    size: string;
    url: string;
    sha256?: string;
    description: string;
    ramRequired: string;
    speed: 'ultra-fast' | 'fast' | 'medium' | 'slow';
    bestFor: string[];
    downloaded?: boolean;
    downloadProgress?: number;
}
export interface ContextInfo {
    file: string;
    symbols: string[];
    imports: string[];
    exports: string[];
    types: string[];
    size: number;
}
export interface ProjectContext {
    files: ContextInfo[];
    totalFiles: number;
    totalSymbols: number;
    lastUpdated: Date;
}
export interface BenchmarkResult {
    model: string;
    tokensPerSecond: number;
    firstTokenLatencyMs: number;
    peakRamMb?: number;
    cpuUsagePercent?: number;
    totalTokens: number;
    durationMs: number;
    promptTokens: number;
}
export interface VscodeConfig {
    name: string;
    displayName: string;
    description: string;
    version: string;
    publisher: string;
    engines: {
        vscode: string;
    };
    categories: string[];
    activationEvents: string[];
    contributes: {
        commands: {
            command: string;
            title: string;
        }[];
        viewsContainers?: {
            activitybar: {
                id: string;
                title: string;
                icon: string;
            }[];
        };
        views?: {
            [key: string]: {
                type: string;
                id: string;
                name: string;
            }[];
        };
    };
    main: string;
    scripts: Record<string, string>;
    devDependencies: Record<string, string>;
}
export interface RefactorRequest {
    code: string;
    instruction: string;
    language: string;
}
export interface RefactorResult {
    original: string;
    refactored: string;
    explanation: string;
}
//# sourceMappingURL=index.d.ts.map