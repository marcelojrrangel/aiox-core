import { healthChecker } from '../../services/health-check.js';
import { logger } from '../../utils/logger.js';
export function registerStatusCommand(program) {
    program
        .command('status')
        .description('Verificar a saúde do sistema CodeMin')
        .action(async () => {
        try {
            logger.header('🔄 Verificando status do CodeMin...\n');
            const status = await healthChecker.run();
            healthChecker.printHealthStatus(status);
            if (!status.ollamaRunning || !status.modelInstalled) {
                process.exit(1);
            }
        }
        catch (error) {
            logger.error('Erro ao verificar status:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=status.js.map