import { readFileSync } from 'node:fs';
import { refactoringService } from '../../services/refactoring-service.js';
import { languageSupport } from '../../services/language-support.js';
import { logger } from '../../utils/logger.js';
export function registerRefactorCommand(program) {
    program
        .command('refactor')
        .description('Refatorar código com instruções em linguagem natural')
        .argument('<arquivo>', 'Caminho do arquivo a refatorar')
        .argument('<instrucao>', 'Instrução de refatoração')
        .option('-l, --language <lang>', 'Linguagem (detectada automaticamente pela extensão)')
        .option('--diff', 'Mostrar diff antes de aplicar', false)
        .action(async (arquivo, instrucao, options) => {
        try {
            const fullPath = arquivo;
            const code = readFileSync(fullPath, 'utf-8');
            const language = options?.language ?? languageSupport.detectLanguage(fullPath).name.toLowerCase();
            logger.header(`🔧 Refatorando: ${arquivo}`);
            logger.info(`  Instrução: ${instrucao}`);
            logger.info(`  Linguagem: ${language}`);
            logger.info('');
            const result = await refactoringService.refactor({
                code,
                instruction: instrucao,
                language,
            });
            logger.success('  Código refatorado:');
            logger.divider();
            console.log(`\n${result.refactored}\n`);
            logger.divider();
            logger.info('\n  Opções:');
            logger.info('  • O código refatorado está exibido acima');
            logger.info('  • Copie e cole no arquivo original se desejar');
            logger.info(`  • Arquivo original: ${arquivo}`);
            console.log('');
        }
        catch (error) {
            logger.error('Erro na refatoração:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=refactor.js.map