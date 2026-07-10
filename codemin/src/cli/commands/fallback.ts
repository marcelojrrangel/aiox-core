import { Command } from 'commander';
import { fallbackService } from '../../services/fallback.js';
import { logger } from '../../utils/logger.js';
import chalk from 'chalk';

export function registerFallbackCommand(program: Command): void {
  program
    .command('fallback')
    .description('Verificar status de fallback automático do modelo')
    .option('--apply', 'Aplicar fallback automaticamente se RAM for insuficiente')
    .option('--use-small', 'Alternar para o modelo pequeno (1.5B)')
    .option('--use-full', 'Alternar de volta para o modelo completo (7B)')
    .action(async (options?: { apply?: boolean; useSmall?: boolean; useFull?: boolean }) => {
      try {
        if (options?.useSmall) {
          logger.info('🔄 Alternando para modelo pequeno (1.5B)...');
          const ok = await fallbackService.switchModel('qwen2.5-coder:1.5b');
          if (ok) {
            logger.success('Modelo alternado para qwen2.5-coder:1.5b');
          } else {
            process.exit(1);
          }
          return;
        }

        if (options?.useFull) {
          logger.info('🔄 Alternando para modelo completo (7B)...');
          const ok = await fallbackService.switchModel('qwen2.5-coder:7b');
          if (ok) {
            logger.success('Modelo alternado para qwen2.5-coder:7b');
          } else {
            process.exit(1);
          }
          return;
        }

        const status = await fallbackService.getStatus();

        logger.header('💾 CodeMin — Fallback Status\n');

        const ramColor = status.usingFallback ? chalk.yellow : chalk.green;
        console.log(`  ${ramColor('⬡')} RAM total:        ${ramColor(String(status.totalRamGB))} GB`);

        const modelColor = status.usingFallback ? chalk.yellow : chalk.green;
        console.log(`  ${modelColor('⬡')} Modelo atual:    ${modelColor(status.currentModel)}`);
        console.log(`  ${modelColor('⬡')} Modelo recomendado: ${modelColor(status.recommendedModel)}`);

        if (status.usingFallback) {
          console.log(`  ${chalk.yellow('⬡')} Status:          ${chalk.yellow('⚠ Fallback recomendado')}`);
          console.log(`     ${chalk.gray(status.reason)}`);
          console.log('');
          logger.info('  Recomendação:');
          logger.info(`  • Use "codemin fallback --use-small" para alternar para ${status.recommendedModel}`);
          logger.info('  • Use "codemin fallback --apply" para aplicar automaticamente');
        } else {
          console.log(`  ${chalk.green('⬡')} Status:          ${chalk.green('✅ RAM suficiente')}`);
        }

        console.log('');
        logger.info('  Opções:');
        logger.info('  • --apply       Aplicar fallback automaticamente');
        logger.info('  • --use-small   Alternar para modelo 1.5B');
        logger.info('  • --use-full    Alternar para modelo 7B');
        console.log('');

        if (options?.apply && status.usingFallback) {
          logger.info('Aplicando fallback...');
          await fallbackService.applyFallback();
        }
      } catch (error) {
        logger.error('Erro ao verificar fallback:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
