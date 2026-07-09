import { existsSync } from 'node:fs';
import { totalmem, freemem } from 'node:os';
import { ollamaClient } from './ollama-client.js';
import { modelManager } from './model-manager.js';
import { configGenerator } from './config-generator.js';
import { getOpenCodeConfigPath, getContinueConfigPath } from '../utils/paths.js';
import { logger } from '../utils/logger.js';
import type { HealthStatus, HealthDetail } from '../types/index.js';

const MIN_DISK_SPACE = 5 * 1024 * 1024 * 1024; // 5 GB
const MIN_NODE_VERSION = 18;

export class HealthChecker {
  async checkOllama(): Promise<HealthDetail> {
    try {
      const running = await ollamaClient.ping();
      return {
        check: 'Ollama Server',
        status: running ? 'ok' : 'error',
        message: running
          ? 'Ollama está rodando em localhost:11434'
          : 'Ollama não está rodando',
        suggestion: running ? undefined : 'Execute "ollama serve" para iniciar o servidor',
      };
    } catch {
      return {
        check: 'Ollama Server',
        status: 'error',
        message: 'Não foi possível conectar ao Ollama',
        suggestion: 'Verifique se o Ollama está instalado e rodando',
      };
    }
  }

  async checkModel(): Promise<HealthDetail> {
    try {
      const installed = await modelManager.isInstalled(modelManager.getDefaultModel());
      return {
        check: `Modelo ${modelManager.getDefaultModel()}`,
        status: installed ? 'ok' : 'warn',
        message: installed
          ? `Modelo ${modelManager.getDefaultModel()} está instalado`
          : `Modelo ${modelManager.getDefaultModel()} não encontrado`,
        suggestion: installed ? undefined : 'Execute "codemin install" para baixar o modelo',
      };
    } catch {
      return {
        check: `Modelo ${modelManager.getDefaultModel()}`,
        status: 'error',
        message: 'Erro ao verificar modelo instalado',
        suggestion: 'Execute "codemin doctor" para diagnóstico completo',
      };
    }
  }

  async checkConfigs(): Promise<HealthDetail> {
    const opencodeExists = existsSync(getOpenCodeConfigPath());
    const continueExists = existsSync(getContinueConfigPath());

    const totalConfigs = [opencodeExists, continueExists].filter(Boolean).length;

    if (opencodeExists && continueExists) {
      return {
        check: 'Arquivos de Configuração',
        status: 'ok',
        message: 'Configurações do OpenCode e Continue.dev presentes',
      };
    }

    return {
      check: 'Arquivos de Configuração',
      status: totalConfigs > 0 ? 'warn' : 'error',
      message: totalConfigs > 0
        ? `${totalConfigs}/2 configurações encontradas`
        : 'Nenhuma configuração encontrada',
      suggestion: 'Execute "codemin install" para gerar as configurações',
    };
  }

  async checkDiskSpace(): Promise<HealthDetail> {
    try {
      const { execSync } = await import('node:child_process');
      let freeBytes = 0;

      if (process.platform === 'win32') {
        const result = execSync('wmic logicaldisk where drivetype=3 get freespace', {
          encoding: 'utf-8',
        });
        const match = result.match(/(\d+)/);
        if (match) freeBytes = Number.parseInt(match[1], 10);
      } else {
        const result = execSync('df -k /', { encoding: 'utf-8' });
        const lines = result.split('\n');
        const lastLine = lines[lines.length - 2];
        if (lastLine) {
          const parts = lastLine.split(/\s+/);
          freeBytes = Number.parseInt(parts[3] ?? '0', 10) * 1024;
        }
      }

      const freeGB = (freeBytes / (1024 * 1024 * 1024)).toFixed(1);
      const ok = freeBytes > MIN_DISK_SPACE;

      return {
        check: 'Espaço em Disco',
        status: ok ? 'ok' : 'warn',
        message: ok
          ? `${freeGB} GB livres — espaço suficiente`
          : `${freeGB} GB livres — mínimo recomendado: 5 GB`,
        suggestion: ok ? undefined : 'Libere espaço em disco antes de baixar modelos',
      };
    } catch {
      return {
        check: 'Espaço em Disco',
        status: 'warn',
        message: 'Não foi possível verificar espaço em disco',
      };
    }
  }

  async checkNodeVersion(): Promise<HealthDetail> {
    const version = process.version.slice(1); // Remove 'v' prefix
    const major = Number.parseInt(version.split('.')[0] ?? '0', 10);
    const ok = major >= MIN_NODE_VERSION;

    return {
      check: 'Node.js',
      status: ok ? 'ok' : 'error',
      message: ok
        ? `Node.js ${version} (${major >= MIN_NODE_VERSION ? 'compatível' : 'desatualizado'})`
        : `Node.js ${version} — versão mínima: ${MIN_NODE_VERSION}`,
      suggestion: ok ? undefined : `Atualize o Node.js para v${MIN_NODE_VERSION}+ em https://nodejs.org`,
    };
  }

  async checkRam(): Promise<HealthDetail> {
    const total = totalmem();
    const free = freemem();
    const totalGB = (total / (1024 * 1024 * 1024)).toFixed(1);
    const freeGB = (free / (1024 * 1024 * 1024)).toFixed(1);
    const ok = total >= 8 * 1024 * 1024 * 1024; // 8 GB

    return {
      check: 'Memória RAM',
      status: ok ? 'ok' : 'warn',
      message: ok
        ? `${totalGB} GB total (${freeGB} GB livres) — suficiente para o modelo 7B`
        : `${totalGB} GB total — mínimo recomendado: 8 GB para o modelo 7B`,
      suggestion: ok
        ? undefined
        : 'Considere usar "codemin install qwen2.5-coder:1.5b" para modelo menor',
    };
  }

  async run(): Promise<HealthStatus> {
    const details = await Promise.all([
      this.checkNodeVersion(),
      this.checkOllama(),
      this.checkModel(),
      this.checkConfigs(),
      this.checkDiskSpace(),
      this.checkRam(),
    ]);

    const successCount = details.filter((d) => d.status === 'ok').length;
    const totalCount = details.length;
    const allOk = successCount === totalCount;

    return {
      ollamaRunning: details[1]?.status === 'ok',
      modelInstalled: details[2]?.status === 'ok',
      configsExist: details[3]?.status === 'ok',
      diskSpaceOk: details[4]?.status === 'ok',
      nodeVersionOk: details[0]?.status === 'ok',
      details,
    };
  }

  printHealthStatus(status: HealthStatus): void {
    const icon = (s: boolean | 'ok' | 'warn' | 'error') => {
      if (s === true || s === 'ok') return '✅';
      if (s === 'warn') return '⚠️';
      return '❌';
    };

    logger.header('CodeMin — Status do Sistema');
    logger.info('');

    for (const detail of status.details) {
      const statusIcon = icon(detail.status);
      const colorFn = detail.status === 'ok'
        ? (s: string) => s
        : detail.status === 'warn'
          ? logger.warn
          : logger.error;

      const prefix = statusIcon;
      console.log(`  ${prefix} ${detail.check}`);
      console.log(`     ${detail.message}`);
      if (detail.suggestion) {
        console.log(`     💡 ${detail.suggestion}`);
      }
      console.log('');
    }

    const okCount = status.details.filter((d) => d.status === 'ok').length;
    const totalCount = status.details.length;

    logger.divider();
    if (okCount === totalCount) {
      logger.success(` ${okCount}/${totalCount} verificações — tudo funcionando! 🚀\n`);
    } else {
      logger.warn(` ${okCount}/${totalCount} verificações OK — ${totalCount - okCount} pendente(s)\n`);
    }
  }
}

export const healthChecker = new HealthChecker();
