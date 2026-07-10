import { Command } from 'commander';
import { contextCollector } from '../../services/context-collector.js';
import { logger } from '../../utils/logger.js';

export function registerContextCommand(program: Command): void {
  program
    .command('context')
    .description('Exibir o contexto atual do projeto (arquivos, símbolos, imports)')
    .option('-r, --refresh', 'Forçar re-escaneamento do projeto')
    .option('--files <paths>', 'Escaneamento específico de arquivos (separados por vírgula)')
    .action(async (options?: { refresh?: boolean; files?: string }) => {
      try {
        logger.header('🔍 CodeMin — Contexto do Projeto');

        if (options?.refresh) {
          contextCollector.clearCache();
          logger.info('  Cache limpo. Re-escaneando...\n');
        }

        if (options?.files) {
          const files = options.files.split(',').map((f) => f.trim());
          logger.info(`  Escaneando ${files.length} arquivo(s) específico(s)...`);
          const contexts = await contextCollector.collectFileContext(files);
          for (const ctx of contexts) {
            console.log(`\n  📄 ${ctx.file}`);
            console.log(`     Símbolos: ${ctx.symbols.length > 0 ? ctx.symbols.join(', ') : 'nenhum'}`);
            console.log(`     Imports:  ${ctx.imports.length > 0 ? ctx.imports.join(', ') : 'nenhum'}`);
          }
          console.log('');
          return;
        }

        logger.info('  Escaneando projeto...\n');
        const context = await contextCollector.collectProjectContext();
        console.log(contextCollector.formatContext(context));
        console.log('');
        logger.info('  Dica: Use "codemin context --refresh" para re-escaneamento forçado.');
        logger.info('  Use "codemin context --files arquivo1.ts,arquivo2.ts" para arquivos específicos.\n');
      } catch (error) {
        logger.error('Erro ao coletar contexto:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
