import type { BugReport } from '../types/index.js';
export declare class BugDetector {
    private baseUrl;
    constructor(baseUrl?: string);
    detectBugs(code: string, language: string): Promise<BugReport[]>;
    private parseBugReport;
    private normalizeSeverity;
}
export declare const bugDetector: BugDetector;
//# sourceMappingURL=bug-detector.d.ts.map