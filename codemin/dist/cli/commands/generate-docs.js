import { readFileSync, writeFileSync } from 'node:fs';
import { docGenerator } from '../../services/doc-generator.js';
import { languageSupport } from '../../services/language-support.js';
import { logger } from '../../utils/logger.js';
export function registerGenerateDocsCommand(program) {
    program
        .command('generate-docs')
        .description('Gerar documentação automática para código')
        .argument('<arquivo>', 'Caminho do arquivo a documentar')
        .option('-l, --language <lang>', 'Linguagem (detectada automaticamente pela extensão)')
        .option('-o, --output <path>', 'Caminho de saída para salvar o arquivo documentado')
        .action(async (arquivo, options) => {
        try {
            const fullPath = arquivo;
            const code = readFileSync(fullPath, 'utf-8');
            const language = options?.language ?? languageSupport.detectLanguage(fullPath).name.toLowerCase();
            logger.header(`📝 Gerando Documentação: ${arquivo}`);
            logger.info(`  Linguagem: ${language}`);
            logger.info('');
            const result = await docGenerator.generateDocs(code, language);
            logger.success(`  Formato de documentação: ${result.docFormat}`);
            logger.divider();
            console.log(`\n${result.documentedCode}\n`);
            logger.divider();
            // Save to file if output specified
            if (options?.output) {
                writeFileSync(options.output, result.documentedCode, 'utf-8');
                logger.success(`  Código documentado salvo em: ${options.output}`);
            }
            else {
                logger.info('\n  Use -o, --output <caminho> para salvar o resultado em um arquivo');
                console.log('');
            }
        }
        catch (error) {
            logger.error('Erro na geração de documentação:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=generate-docs.js.map