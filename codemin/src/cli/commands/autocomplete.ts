import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fimService } from '../../services/fim-service.js';
import { logger } from '../../utils/logger.js';

export function registerAutocompleteCommand(program: Command): void {
  program
    .command('autocomplete')
    .description('Testar autocomplete FIM (Fill-in-the-Middle) manualmente')
    .argument('[prefixo]', 'Código prefixo (ou use --file)')
    .option('-s, --suffix <suffix>', 'Código sufixo (opcional)')
    .option('-f, --file <path>', 'Arquivo para usar como contexto')
    .option('-l, --language <lang>', 'Linguagem (padrão: typescript)')
    .option('--stream', 'Habilitar streaming de resposta', false)
    .action(async (prefixo?: string, options?: { suffix?: string; file?: string; language?: string; stream?: boolean }) => {
      try {
        const language = options?.language ?? 'typescript';

        let prefix = prefixo ?? '';
        let suffix = options?.suffix ?? '';

        if (options?.file) {
          const content = readFileSync(options.file, 'utf-8');
          if (!prefix) {
            prefix = content;
          }
        }

        if (!prefix) {
          logger.error('Informe um prefixo ou use --file <caminho>');
          process.exit(1);
        }

        logger.info(`🤖 Autocomplete FIM (${language})`);
        logger.info(`  Prefixo: ${prefix.slice(0, 100)}${prefix.length > 100 ? '...' : ''}`);
        if (suffix) {
          logger.info(`  Sufixo: ${suffix.slice(0, 100)}${suffix.length > 100 ? '...' : ''}`);
        }
        logger.info('');

        if (options?.stream) {
          process.stdout.write('  Resposta: ');
          const stream = fimService.streamCompletion(prefix, suffix, language);
          for await (const chunk of stream) {
            process.stdout.write(chunk);
          }
          console.log('\n');
        } else {
          const result = await fimService.getCompletion(prefix, suffix, language);
          logger.info('  Resposta:');
          console.log(`\n${result.completion}\n`);
          if (result.tokensUsed) {
            logger.info(`  Tokens usados: ${result.tokensUsed}`);
          }
        }
      } catch (error) {
        logger.error('Erro no autocomplete:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
