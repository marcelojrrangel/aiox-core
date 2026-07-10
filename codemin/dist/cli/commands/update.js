import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { logger } from '../../utils/logger.js';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
function getPackageVersion() {
    try {
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const pkgPath = resolve(__dirname, '..', '..', '..', '..', 'package.json');
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        return pkg.version ?? '1.0.0';
    }
    catch {
        return '1.0.0';
    }
}
export function registerUpdateCommand(program) {
    program
        .command('update')
        .description('Verificar e atualizar o CodeMin para a versão mais recente')
        .option('--check', 'Apenas verificar versão disponível sem atualizar')
        .option('--models', 'Verificar atualizações para modelos instalados')
        .action(async (options) => {
        try {
            const currentVersion = getPackageVersion();
            logger.header('🔄 CodeMin — Atualização');
            logger.info(`  Versão atual: ${currentVersion}`);
            if (options?.models) {
                logger.info('\n  Verificando atualizações de modelos...');
                logger.info('  Execute "ollama pull qwen2.5-coder:7b" para atualizar o modelo.');
                return;
            }
            logger.info('\n  Verificando nova versão no npm...');
            try {
                const npmOutput = execSync('npm view codemin version', {
                    encoding: 'utf-8',
                    timeout: 10000,
                }).trim();
                logger.info(`  Última versão disponível: ${npmOutput}`);
                if (npmOutput === currentVersion) {
                    logger.success('\n  ✅ CodeMin já está na versão mais recente!');
                    return;
                }
                if (options?.check) {
                    logger.info(`\n  ⚠️ Nova versão disponível: ${currentVersion} → ${npmOutput}`);
                    logger.info('  Execute "codemin update" sem --check para atualizar.');
                    return;
                }
                logger.info(`\n  Atualizando para ${npmOutput}...`);
                execSync('npm update -g codemin', {
                    encoding: 'utf-8',
                    timeout: 60000,
                    stdio: 'inherit',
                });
                logger.success(`\n  ✅ CodeMin atualizado para ${npmOutput}!`);
            }
            catch {
                logger.warn('\n  Não foi possível verificar versão no npm.');
                logger.info('  Verifique sua conexão com a internet.');
                logger.info('  Ou atualize manualmente com: npm update -g codemin');
            }
        }
        catch (error) {
            logger.error('Erro na atualização:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=update.js.map