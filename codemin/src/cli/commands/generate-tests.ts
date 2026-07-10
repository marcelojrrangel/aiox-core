import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'node:fs';
import { testGenerator } from '../../services/test-generator.js';
import { languageSupport } from '../../services/language-support.js';
import { logger } from '../../utils/logger.js';
import chalk from 'chalk';

export function registerGenerateTestsCommand(program: Command): void {
  program
    .command('generate-tests')
    .description('Gerar testes unitários para um arquivo de código')
    .argument('<arquivo>', 'Caminho do arquivo para gerar testes')
    .option('-l, --language <lang>', 'Linguagem (detectada automaticamente pela extensão)')
    .option('-o, --output <path>', 'Caminho de saída para salvar o arquivo de teste')
    .action(async (arquivo: string, options?: { language?: string; output?: string }) => {
      try {
        const fullPath = arquivo;
        const code = readFileSync(fullPath, 'utf-8');
        const language = options?.language ?? languageSupport.detectLanguage(fullPath).name.toLowerCase();

        logger.header(`🧪 Gerando Testes: ${arquivo}`);
        logger.info(`  Linguagem: ${language}`);
        logger.info('');

        const result = await testGenerator.generateTests(code, language);

        logger.success(`  Framework detectado: ${result.framework}`);
        logger.info(`  Nome sugerido: ${result.fileName}`);
        logger.divider();
        console.log(`\n${result.testCode}\n`);
        logger.divider();

        // Save to file if output specified
        if (options?.output) {
          writeFileSync(options.output, result.testCode, 'utf-8');
          logger.success(`  Testes salvos em: ${options.output}`);
        }

        logger.info('\n  Opções:');
        logger.info('  • Use -o, --output <caminho> para salvar o arquivo de teste');
        logger.info('  • Copie e cole no arquivo de teste do seu projeto');
        console.log('');
      } catch (error) {
        logger.error('Erro na geração de testes:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
