import { Command } from 'commander';
import { benchmarkEngine } from '../../services/benchmark-engine.js';
import { modelManager } from '../../services/model-manager.js';
import { logger } from '../../utils/logger.js';

export function registerBenchCommand(program: Command): void {
  program
    .command('bench')
    .description('Executar benchmark de performance do modelo ativo')
    .argument('[modelo]', 'Nome do modelo (padrão: modelo ativo)')
    .option('--compare', 'Comparar todos os modelos instalados')
    .action(async (modelo?: string, options?: { compare?: boolean }) => {
      try {
        if (options?.compare) {
          const installed = await modelManager.listInstalledModels();
          if (installed.length === 0) {
            logger.warn('Nenhum modelo instalado para comparar.');
            return;
          }
          const modelNames = installed.map((m) => m.name);
          logger.info(`Comparando ${modelNames.length} modelo(s)...`);
          const results = await benchmarkEngine.compareBenchmarks(modelNames);
          console.log(benchmarkEngine.formatComparison(results));
          console.log('');
          return;
        }

        const target = modelo ?? modelManager.getDefaultModel();
        const result = await benchmarkEngine.runBenchmark(target);
        console.log(benchmarkEngine.formatBenchmarkResult(result));
        console.log('');
      } catch (error) {
        logger.error('Erro no benchmark:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
