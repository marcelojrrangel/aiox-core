import { type BenchmarkResult } from '../types/index.js';
export declare class BenchmarkEngine {
    runBenchmark(model: string): Promise<BenchmarkResult>;
    compareBenchmarks(models: string[]): Promise<BenchmarkResult[]>;
    formatBenchmarkResult(result: BenchmarkResult): string;
    formatComparison(results: BenchmarkResult[]): string;
}
export declare const benchmarkEngine: BenchmarkEngine;
//# sourceMappingURL=benchmark-engine.d.ts.map