import { healthChecker } from '../../services/health-check.js';
import { logger } from '../../utils/logger.js';
export function registerDoctorCommand(program) {
    program
        .command('doctor')
        .description('Diagnóstico completo do sistema CodeMin')
        .action(async () => {
        try {
            logger.header('🔍 CodeMin — Diagnóstico Completo\n');
            const status = await healthChecker.run();
            let allOk = true;
            for (const detail of status.details) {
                const icon = detail.status === 'ok'
                    ? '✅'
                    : detail.status === 'warn'
                        ? '⚠️'
                        : '❌';
                console.log(`  ${icon} ${detail.check}`);
                console.log(`     ${detail.message}`);
                if (detail.suggestion) {
                    console.log(`     💡 ${detail.suggestion}`);
                }
                console.log('');
                if (detail.status === 'error')
                    allOk = false;
            }
            logger.divider();
            const okCount = status.details.filter((d) => d.status === 'ok').length;
            const total = status.details.length;
            if (allOk) {
                logger.success(` ${okCount}/${total} verificações — tudo funcionando! 🚀`);
            }
            else {
                logger.warn(` ${okCount}/${total} verificações OK`);
                logger.info('\nSugestões para resolver os problemas:');
                logger.info('  1. Certifique-se de que o Ollama está instalado: https://ollama.com/download');
                logger.info('  2. Execute "ollama serve" para iniciar o servidor');
                logger.info('  3. Execute "codemin install" para baixar o modelo');
                logger.info('  4. Execute "codemin config generate" para gerar configurações');
            }
            console.log('');
        }
        catch (error) {
            logger.error('Erro ao executar diagnóstico:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=doctor.js.map