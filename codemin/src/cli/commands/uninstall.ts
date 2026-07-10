import { Command } from 'commander';
import { rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { logger } from '../../utils/logger.js';
import { executeAndCheck, isWindows, isMacOS } from '../../utils/shell.js';

export function registerUninstallCommand(program: Command): void {
  program
    .command('uninstall')
    .description('Remover o CodeMin, modelos baixados e configurações')
    .option('--keep-ollama', 'Manter o Ollama instalado')
    .action(async (options?: { keepOllama?: boolean }) => {
      logger.header('🗑️  CodeMin — Desinstalação');

      const steps: { name: string; status: string; message?: string }[] = [];

      // Step 1: Remover diretório ~/.codemin/
      logger.step(1, 4, 'Removendo diretório ~/.codemin/...');
      const codeminDir = join(homedir(), '.codemin');
      if (existsSync(codeminDir)) {
        try {
          rmSync(codeminDir, { recursive: true, force: true });
          steps.push({ name: 'Diretório ~/.codemin/', status: 'done', message: 'Removido' });
          logger.success('  ~/.codemin/ removido');
        } catch (e) {
          steps.push({ name: 'Diretório ~/.codemin/', status: 'error', message: String(e) });
          logger.error(`  Erro: ${e}`);
        }
      } else {
        steps.push({ name: 'Diretório ~/.codemin/', status: 'skipped', message: 'Não encontrado' });
        logger.info('  ~/.codemin/ não encontrado');
      }

      // Step 2: Remover modelos do Ollama
      logger.step(2, 3, 'Removendo modelos baixados...');
      const models = [
        'qwen2.5-coder:7b',
        'qwen2.5-coder:1.5b',
        'qwen3:8b',
        'deepseek-coder-v2:16b',
        'phi-3:3.8b',
        'codellama:7b',
      ];

      let removedCount = 0;
      for (const model of models) {
        const result = await executeAndCheck('ollama', ['rm', model]);
        if (result.success) {
          removedCount++;
          logger.info(`  Removido: ${model}`);
        }
      }

      if (removedCount > 0) {
        steps.push({ name: 'Modelos', status: 'done', message: `${removedCount} modelos removidos` });
        logger.success(`  ${removedCount} modelos removidos`);
      } else {
        steps.push({ name: 'Modelos', status: 'skipped', message: 'Nenhum modelo encontrado' });
        logger.info('  Nenhum modelo CodeMin encontrado');
      }

      // Step 3: Remover Ollama (opcional)
      logger.step(3, 3, 'Removendo Ollama...');
      if (options?.keepOllama) {
        steps.push({ name: 'Ollama', status: 'skipped', message: 'Mantido (--keep-ollama)' });
        logger.info('  Ollama mantido (--keep-ollama)');
      } else {
        try {
          if (isWindows()) {
            logger.info('  Abrindo página de desinstalação do Ollama...');
            logger.info('  Vá em: Configurações > Aplicativos > Ollama > Desinstalar');
            await executeAndCheck('cmd', ['/c', 'start', 'ms-settings:appsfeatures']);
          } else if (isMacOS()) {
            const result = await executeAndCheck('brew', ['uninstall', 'ollama']);
            if (result.success) {
              steps.push({ name: 'Ollama', status: 'done', message: 'Removido via brew' });
              logger.success('  Ollama desinstalado');
            }
          } else {
            logger.info('  Execute: sudo apt remove ollama (ou equivalente na sua distro)');
          }
        } catch {
          steps.push({ name: 'Ollama', status: 'error', message: 'Desinstalação manual necessária' });
          logger.info('  Desinstale manualmente o Ollama');
        }
      }

      logger.header('✅ Desinstalação concluída!');
      logger.info(' CodeMin foi removido do sistema.');
    });
}