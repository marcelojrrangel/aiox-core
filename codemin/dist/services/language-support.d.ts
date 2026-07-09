import type { LanguageInfo } from '../types/index.js';
export declare class LanguageSupport {
    getSupportedLanguages(): LanguageInfo[];
    formatLanguagesTable(): string;
    private getAllExtensions;
    detectLanguage(filePath: string): LanguageInfo;
    detectLanguageByName(name: string): LanguageInfo;
    getSystemPrompt(language: string): string;
    getTestFramework(language: string): string;
    getDocFormat(language: string): string;
    getCommentStyle(language: string): string;
    buildLanguagePrompt(basePrompt: string, language: string): string;
}
export declare const languageSupport: LanguageSupport;
//# sourceMappingURL=language-support.d.ts.map