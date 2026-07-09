import { ollamaClient } from './ollama-client.js';
import { logger } from '../utils/logger.js';
const BENCHMARK_PROMPTS = [
    'Write a function that implements a binary search tree in Python with insert, delete, and search operations.',
    'Create a React component that displays a paginated table with sorting and filtering capabilities.',
    'Write a Go function that reads a CSV file, parses it, and returns a slice of structs.',
    'Explain the concept of dependency injection and provide a TypeScript example.',
    'Generate a SQL query to find duplicate emails in a users table and return the count.',
];
const WARMUP_ROUNDS = 1;
const TEST_ROUNDS = 2;
export class BenchmarkEngine {
    async runBenchmark(model) {
        logger.info(`\n  🔬 Executando benchmark para ${model}...`);
        // Warmup
        logger.info('  Aquecendo modelo...');
        for (let i = 0; i < WARMUP_ROUNDS; i++) {
            try {
                await ollamaClient.generate('Say "warmup"', { model, maxTokens: 10, temperature: 0 });
            }
            catch {
                // ignore warmup errors
            }
        }
        // Test
        let totalTokens = 0;
        let totalDurationMs = 0;
        let firstTokenLatencyMs = 0;
        let promptTokens = 0;
        for (let i = 0; i < TEST_ROUNDS; i++) {
            for (const prompt of BENCHMARK_PROMPTS) {
                try {
                    const startTime = performance.now();
                    let firstToken = true;
                    const stream = ollamaClient.generateStream(model, [{ role: 'user', content: prompt }], { temperature: 0.1, maxTokens: 512 });
                    for await (const chunk of stream) {
                        if (firstToken) {
                            firstTokenLatencyMs += performance.now() - startTime;
                            firstToken = false;
                        }
                        totalTokens++;
                    }
                    const duration = performance.now() - startTime;
                    totalDurationMs += duration;
                    promptTokens += prompt.length;
                }
                catch (error) {
                    logger.warn(`  Erro no benchmark: ${error instanceof Error ? error.message : 'Erro'}`);
                }
            }
        }
        const avgDurationMs = totalDurationMs / (TEST_ROUNDS * BENCHMARK_PROMPTS.length);
        const tokensPerSecond = totalTokens / (totalDurationMs / 1000);
        const avgFirstTokenLatency = firstTokenLatencyMs / (TEST_ROUNDS * BENCHMARK_PROMPTS.length);
        return {
            model,
            tokensPerSecond: Math.round(tokensPerSecond * 100) / 100,
            firstTokenLatencyMs: Math.round(avgFirstTokenLatency * 100) / 100,
            totalTokens,
            durationMs: Math.round(avgDurationMs),
            promptTokens: Math.round(promptTokens / (TEST_ROUNDS * BENCHMARK_PROMPTS.length)),
        };
    }
    async compareBenchmarks(models) {
        const results = [];
        for (const model of models) {
            try {
                const result = await this.runBenchmark(model);
                results.push(result);
            }
            catch (error) {
                logger.warn(`  Falha ao executar benchmark para ${model}: ${error instanceof Error ? error.message : 'Erro'}`);
            }
        }
        return results;
    }
    formatBenchmarkResult(result) {
        const lines = [];
        lines.push(`\n  📊 Benchmark: ${result.model}`);
        lines.push(`  ${'─'.repeat(50)}`);
        lines.push(`  Tokens/s:      ${result.tokensPerSecond.toFixed(2)}`);
        lines.push(`  Latência 1º token: ${result.firstTokenLatencyMs.toFixed(0)} ms`);
        lines.push(`  Tokens gerados:   ${result.totalTokens}`);
        lines.push(`  Duração média:    ${result.durationMs.toFixed(0)} ms`);
        lines.push(`  Tamanho prompt:   ${result.promptTokens} chars`);
        return lines.join('\n');
    }
    formatComparison(results) {
        const lines = [];
        lines.push(`\n  📊 Comparação de Modelos`);
        lines.push(`  ${'═'.repeat(70)}`);
        lines.push(`  ${'Modelo'.padEnd(25)} ${'Tokens/s'.padStart(10)} ${'1º Token (ms)'.padStart(14)} ${'Tokens'.padStart(8)}`);
        lines.push(`  ${'─'.repeat(60)}`);
        // Sort by tokens/s descending
        const sorted = [...results].sort((a, b) => b.tokensPerSecond - a.tokensPerSecond);
        for (const r of sorted) {
            lines.push(`  ${r.model.padEnd(25)} ${String(r.tokensPerSecond.toFixed(1)).padStart(10)} ${String(r.firstTokenLatencyMs.toFixed(0)).padStart(14)} ${String(r.totalTokens).padStart(8)}`);
        }
        lines.push(`  ${'─'.repeat(60)}`);
        if (sorted.length > 0) {
            lines.push(`\n  🏆 Mais rápido: ${sorted[0].model} (${sorted[0].tokensPerSecond.toFixed(1)} tokens/s)`);
        }
        return lines.join('\n');
    }
}
export const benchmarkEngine = new BenchmarkEngine();
//# sourceMappingURL=benchmark-engine.js.map