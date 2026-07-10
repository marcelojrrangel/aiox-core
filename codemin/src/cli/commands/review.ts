import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import chalk from 'chalk';
import { codeReviewService } from '../../services/code-review.js';
import { languageSupport } from '../../services/language-support.js';
import { logger } from '../../utils/logger.js';

export function registerReviewCommand(program: Command): void {
  program
    .command('review')
    .description('Realizar code review em um arquivo')
    .argument('<arquivo>', 'Caminho do arquivo a revisar')
    .option('-l, --language <lang>', 'Linguagem (detectada automaticamente pela extensão)')
    .option('--json', 'Saída em formato JSON', false)
    .action(async (arquivo: string, options?: { language?: string; json?: boolean }) => {
      try {
        const fullPath = arquivo;
        const code = readFileSync(fullPath, 'utf-8');
        const language = options?.language ?? languageSupport.detectLanguage(fullPath).name.toLowerCase();

        logger.header(`📋 Code Review: ${arquivo}`);
        logger.info(`  Linguagem: ${language}`);
        logger.info('');

        const report = await codeReviewService.review(code, language);

        if (options?.json) {
          console.log(JSON.stringify(report, null, 2));
          return;
        }

        // Summary
        logger.info(`  📊 Score: ${chalk.bold(String(report.score))}/100`);
        logger.info(`  ${report.summary}`);
        logger.info('');

        if (report.issues.length === 0) {
          logger.success('  Nenhum problema encontrado! 🎉');
          return;
        }

        // Group by category
        const categories = new Map<string, typeof report.issues>();
        for (const issue of report.issues) {
          const existing = categories.get(issue.category) ?? [];
          existing.push(issue);
          categories.set(issue.category, existing);
        }

        for (const [category, issues] of categories) {
          const categoryIcons: Record<string, string> = {
            segurança: '🔒',
            performance: '⚡',
            'boas-práticas': '📐',
            manutenibilidade: '🔧',
          };
          logger.info(`  ${categoryIcons[category] ?? '•'} ${chalk.bold(category)} (${issues.length})`);

          for (const issue of issues) {
            const severityColor = {
              crítico: chalk.red,
              alto: chalk.red,
              médio: chalk.yellow,
              baixo: chalk.blue,
              info: chalk.gray,
            }[issue.severity] ?? chalk.white;

            const lineInfo = issue.line ? `[Linha ${issue.line}]` : '';
            console.log(`    ${severityColor('▸')} ${severityColor(issue.severity.toUpperCase())} ${lineInfo}`);
            console.log(`      ${issue.description}`);
            console.log(`      💡 ${chalk.gray(issue.suggestion)}`);
            console.log('');
          }
        }
      } catch (error) {
        logger.error('Erro no code review:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
