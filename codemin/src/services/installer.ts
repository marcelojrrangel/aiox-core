import { existsSync } from 'node:fs';
import { logger } from '../utils/logger.js';
import { getCodeMinDir, getModelsDir, getConfigsDir, getLogsDir, getCacheDir } from '../utils/paths.js';
import { executeAndCheck, execSyncSafe, isWindows, isMacOS, isLinux } from '../utils/shell.js';
import { modelManager } from './model-manager.js';
import { configGenerator } from './config-generator.js';

export interface InstallResult {
  success: boolean;
  steps: {
    name: string;
    status: 'done' | 'error' | 'skipped';
    message?: string;
  }[];
}

export class Installer {
  async install(modelName?: string, options?: { force?: boolean; from?: string }): Promise<InstallResult> {
    const steps: InstallResult['steps'] = [];
    const targetModel = modelName ?? modelManager.getDefaultModel();

    logger.header('🚀 CodeMin — Instalação');

    // Step 1: Verificar sistema
    logger.step(1, 5, 'Verificando sistema...');
    const systemOk = await this.checkSystem();
    steps.push({
      name: 'Verificação do sistema',
      status: systemOk ? 'done' : 'error',
      message: systemOk ? 'Node.js, sistema operacional OK' : 'Falha na verificação do sistema',
    });
    if (!systemOk) {
      return { success: false, steps };
    }
    logger.success(' Sistema OK');

    // Step 2: Verificar/Instalar Ollama
    logger.step(2, 5, 'Verificando Ollama...');
    const ollamaOk = await this.ensureOllama();
    steps.push({
      name: 'Ollama',
      status: ollamaOk ? 'done' : 'error',
      message: ollamaOk ? 'Ollama disponível' : 'Ollama não encontrado',
    });
    if (!ollamaOk) {
      return { success: false, steps };
    }
    logger.success(' Ollama OK');

    // Step 3: Baixar modelo
    logger.step(3, 5, `Baixando modelo ${targetModel}...`);
    try {
      await modelManager.downloadModel(targetModel, options?.force);
      steps.push({
        name: `Download do modelo ${targetModel}`,
        status: 'done',
        message: 'Modelo baixado com sucesso',
      });
      logger.success(` Modelo ${targetModel} baixado`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      steps.push({
        name: `Download do modelo ${targetModel}`,
        status: 'error',
        message: errMsg,
      });

      if (targetModel !== modelManager.getFallbackModel()) {
        logger.warn(` Tentando modelo fallback ${modelManager.getFallbackModel()}...`);
        try {
          await modelManager.downloadModel(modelManager.getFallbackModel());
          steps.push({
            name: `Download do modelo ${modelManager.getFallbackModel()}`,
            status: 'done',
            message: 'Modelo fallback baixado com sucesso',
          });
          logger.success(` Modelo ${modelManager.getFallbackModel()} baixado`);
        } catch {
          return { success: false, steps };
        }
      } else {
        return { success: false, steps };
      }
    }

    // Step 4: Criar estrutura de diretórios
    logger.step(4, 5, 'Configurando diretórios...');
    this.ensureDirectories();
    steps.push({
      name: 'Estrutura de diretórios',
      status: 'done',
      message: 'Diretórios criados em ~/.codemin/',
    });
    logger.success(' Diretórios configurados');

    // Step 5: Gerar configurações
    logger.step(5, 5, 'Gerando configurações...');
    try {
      await configGenerator.ensureConfigs();
      steps.push({
        name: 'Configurações',
        status: 'done',
        message: 'Configurações do OpenCode e Continue.dev geradas',
      });
      logger.success(' Configurações geradas');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      steps.push({
        name: 'Configurações',
        status: 'error',
        message: errMsg,
      });
      return { success: false, steps };
    }

    // Resultado final
    logger.header('✅ Instalação completa!');
    logger.info('');
    logger.info('  Próximos passos:');
    logger.info('  • codemin chat    → Chat interativo no terminal');
    logger.info('  • codemin status  → Verificar saúde do sistema');
    logger.info('  • codemin doctor  → Diagnóstico completo');
    logger.info('  • codemin config  → Ver arquivos de configuração');
    logger.info('');

    return { success: true, steps };
  }

  private async checkSystem(): Promise<boolean> {
    // Check Node.js version
    const nodeVersion = process.version.slice(1);
    const major = Number.parseInt(nodeVersion.split('.')[0] ?? '0', 10);
    if (major < 18) {
      logger.error(`Node.js ${nodeVersion} detectado. Versão mínima: 18.`);
      return false;
    }
    logger.info(`  Node.js ${nodeVersion} ✓`);

    // Check OS
    logger.info(`  Sistema: ${process.platform} ${process.arch} ✓`);
    logger.info(`  CPU: ${require('node:os').cpus().length} cores ✓`);

    return true;
  }

  private async ensureOllama(): Promise<boolean> {
    const detected = await modelManager.detectOllamaInstall();

    if (detected.installed) {
      logger.info(`  Ollama ${detected.version ?? 'encontrado'} ✓`);
      return true;
    }

    logger.warn('  Ollama não encontrado. Tentando instalar...');

    try {
      const installed = await this.installOllama();
      if (installed) {
        logger.success('  Ollama instalado com sucesso!');
        return true;
      }
      logger.error('  Não foi possível instalar o Ollama automaticamente.');
      logger.info('  Instale manualmente em: https://ollama.com/download');
      return false;
    } catch (error) {
      logger.error(`  Erro ao instalar Ollama: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      logger.info('  Instale manualmente em: https://ollama.com/download');
      return false;
    }
  }

  private async installOllama(): Promise<boolean> {
    if (isWindows()) {
      // Try winget first, then choco
      const wingetResult = await executeAndCheck('winget', [
        'install',
        '--id',
        'Ollama.Ollama',
        '--accept-source-agreements',
        '--accept-package-agreements',
      ]);
      if (wingetResult.success) return true;

      const chocoResult = await executeAndCheck('choco', ['install', 'ollama', '-y']);
      return chocoResult.success;
    }

    if (isMacOS()) {
      const result = await executeAndCheck('brew', ['install', 'ollama']);
      return result.success;
    }

    if (isLinux()) {
      const result = execSyncSafe('curl -fsSL https://ollama.com/install.sh | sh');
      return result.success;
    }

    return false;
  }

  private ensureDirectories(): void {
    getCodeMinDir();
    getModelsDir();
    getConfigsDir();
    getLogsDir();
    getCacheDir();
    logger.info('  ~/.codemin/');
    logger.info('  ├── models/');
    logger.info('  ├── configs/');
    logger.info('  ├── logs/');
    logger.info('  └── cache/downloads/');
  }
}

export const installer = new Installer();
