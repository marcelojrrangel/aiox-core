import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import chalk from 'chalk';
import { bugDetector } from '../../services/bug-detector.js';
import { languageSupport } from '../../services/language-support.js';
import { logger } from '../../utils/logger.js';

export function registerDetectBugsCommand(program: Command): void {
  program
    .command('detect-bugs')
    .description('Detectar bugs em um arquivo de código')
    .argument('<arquivo>', 'Caminho do arquivo a analisar')
    .option('-l, --language <lang>', 'Linguagem (detectada automaticamente pela extensão)')
    .option('--json', 'Saída em formato JSON', false)
    .action(async (arquivo: string, options?: { language?: string; json?: boolean }) => {
      try {
        const fullPath = arquivo;
        const code = readFileSync(fullPath, 'utf-8');
        const language = options?.language ?? languageSupport.detectLanguage(fullPath).name.toLowerCase();

        logger.header(`🔍 Detectando Bugs: ${arquivo}`);
        logger.info(`  Linguagem: ${language}`);
        logger.info('');

        const bugs = await bugDetector.detectBugs(code, language);

        if (options?.json) {
          console.log(JSON.stringify(bugs, null, 2));
          return;
        }

        if (bugs.length === 0) {
          logger.success('  Nenhum bug encontrado! 🎉');
          return;
        }

        logger.warn(`  ${bugs.length} bug(s) encontrado(s):\n`);

        for (const bug of bugs) {
          const severityColor = bug.severity === 'alta'
            ? chalk.red
            : bug.severity === 'media'
              ? chalk.yellow
              : chalk.blue;

          console.log(`  ${severityColor('⬡')} [Linha ${bug.line}] ${chalk.bold(bug.type)}`);
          console.log(`     Severidade: ${severityColor(bug.severity.toUpperCase())}`);
          console.log(`     ${bug.description}`);
          console.log(`     💡 ${chalk.gray(bug.suggestion)}`);
          console.log('');
        }
      } catch (error) {
        logger.error('Erro na detecção de bugs:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
