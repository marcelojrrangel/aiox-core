import { Command } from 'commander';
import { languageSupport } from '../../services/language-support.js';
import { logger } from '../../utils/logger.js';

export function registerLanguagesCommand(program: Command): void {
  program
    .command('languages')
    .description('Listar todas as linguagens de programação suportadas')
    .action(() => {
      logger.header('🌍 CodeMin — Linguagens Suportadas');
      const table = languageSupport.formatLanguagesTable();
      console.log(table);
      logger.divider();
      logger.info('\n  CodeMin suporta 8+ linguagens com system prompts otimizados,');
      logger.info('  detecção automática por extensão, e frameworks de teste específicos.\n');
    });
}
