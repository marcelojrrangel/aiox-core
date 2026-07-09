import { installer } from '../../services/installer.js';
import { logger } from '../../utils/logger.js';
export function registerInstallCommand(program) {
    program
        .command('install [modelo]')
        .description('Instalar o CodeMin e baixar o modelo de linguagem local')
        .option('-f, --force', 'Forçar reinstalação')
        .option('--from <source>', 'Instalar a partir de uma fonte específica')
        .action(async (modelo, options) => {
        try {
            const result = await installer.install(modelo, options);
            if (!result.success) {
                const failedSteps = result.steps.filter((s) => s.status === 'error');
                logger.error('\n❌ Instalação concluída com erros:');
                for (const step of failedSteps) {
                    logger.error(`  • ${step.name}: ${step.message}`);
                }
                process.exit(1);
            }
        }
        catch (error) {
            logger.error('Erro durante a instalação:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=install.js.map