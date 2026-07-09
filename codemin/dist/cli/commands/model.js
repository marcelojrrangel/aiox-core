import { modelManager } from '../../services/model-manager.js';
import { benchmarkEngine } from '../../services/benchmark-engine.js';
import { logger } from '../../utils/logger.js';
export function registerModelCommand(program) {
    const modelCmd = program
        .command('model')
        .description('Gerenciar modelos de linguagem');
    // codemin model list
    modelCmd
        .command('list')
        .description('Listar modelos instalados')
        .action(async () => {
        try {
            logger.header('📦 CodeMin — Modelos Instalados\n');
            const installed = await modelManager.listInstalledModels();
            console.log(modelManager.formatModelList(installed));
            console.log('');
            // Show available models in catalog
            logger.info('  Modelos Disponíveis no Catálogo:');
            logger.info('  ' + '─'.repeat(70));
            const catalog = modelManager.getCatalog();
            for (const model of catalog) {
                const isInstalled = installed.some((m) => m.name === model.id);
                const installedMark = isInstalled ? '✅' : '  ';
                const detail = modelManager.getModelDetail(model.id);
                const desc = detail ? detail.description.slice(0, 55) : '';
                console.log(`  ${installedMark} ${model.id.padEnd(25)} ${model.size.padStart(8)}  ${desc}`);
            }
            console.log('');
            logger.info('  Use "codemin model download <modelo>" para baixar um modelo.');
            logger.info('  Use "codemin model switch <modelo>" para alternar o modelo ativo.\n');
        }
        catch (error) {
            logger.error('Erro ao listar modelos:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
    // codemin model download <modelo>
    modelCmd
        .command('download')
        .description('Baixar um modelo de linguagem')
        .argument('<modelo>', 'Nome do modelo (ex: qwen2.5-coder:7b)')
        .option('-f, --force', 'Forçar redownload')
        .action(async (modelo, options) => {
        try {
            const detail = modelManager.getModelDetail(modelo);
            if (detail) {
                logger.header(`📥 Baixando: ${detail.name}\n`);
                logger.info(`  Tamanho: ${detail.size}`);
                logger.info(`  RAM necessária: ${detail.ramRequired}`);
                logger.info(`  Descrição: ${detail.description}\n`);
            }
            else {
                logger.header(`📥 Baixando: ${modelo}\n`);
            }
            await modelManager.downloadModel(modelo, options?.force ?? false);
            logger.success(`\n  ✅ Modelo ${modelo} pronto para uso!`);
            logger.info(`  Use "codemin model switch ${modelo}" para ativá-lo.\n`);
        }
        catch (error) {
            logger.error('Erro ao baixar modelo:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
    // codemin model remove <modelo>
    modelCmd
        .command('remove')
        .description('Remover um modelo de linguagem')
        .argument('<modelo>', 'Nome do modelo a remover')
        .option('-f, --force', 'Pular confirmação')
        .action(async (modelo, options) => {
        try {
            const installed = await modelManager.listInstalledModels();
            const found = installed.find((m) => m.name === modelo);
            if (!found) {
                logger.warn(`Modelo "${modelo}" não está instalado.`);
                return;
            }
            if (!options?.force) {
                logger.warn(`  Tem certeza que deseja remover "${modelo}"?`);
                logger.info('  Use --force para pular esta confirmação.\n');
                logger.info('  Para confirmar, execute:');
                logger.info(`  codemin model remove ${modelo} --force`);
                return;
            }
            logger.info(`Removendo modelo ${modelo}...`);
            const ok = await modelManager.removeModel(modelo);
            if (!ok) {
                process.exit(1);
            }
        }
        catch (error) {
            logger.error('Erro ao remover modelo:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
    // codemin model switch <modelo>
    modelCmd
        .command('switch')
        .description('Alternar o modelo ativo')
        .argument('<modelo>', 'Nome do modelo para ativar')
        .action(async (modelo) => {
        try {
            logger.info(`Alternando para modelo: ${modelo}...`);
            const ok = await modelManager.switchModel(modelo);
            if (ok) {
                logger.success(`\n  ✅ Modelo ativo: ${modelo}`);
                logger.info('  Execute "codemin status" para verificar o status.\n');
            }
            else {
                process.exit(1);
            }
        }
        catch (error) {
            logger.error('Erro ao alternar modelo:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
    // codemin model info <modelo>
    modelCmd
        .command('info')
        .description('Mostrar detalhes de um modelo')
        .argument('<modelo>', 'Nome do modelo')
        .action(async (modelo) => {
        try {
            const details = modelManager.getModelDetail(modelo);
            if (details) {
                logger.header(`ℹ️  ${details.name}`);
                console.log(modelManager.formatModelDetails(modelo));
            }
            else {
                logger.warn(`Modelo "${modelo}" não encontrado no catálogo.`);
                logger.info('Modelos disponíveis:');
                for (const m of modelManager.getCatalog()) {
                    console.log(`  • ${m.id} — ${m.name}`);
                }
            }
            console.log('');
        }
        catch (error) {
            logger.error('Erro ao buscar detalhes:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
    // codemin model bench <modelo>
    modelCmd
        .command('bench')
        .description('Executar benchmark de performance do modelo')
        .argument('[modelo]', 'Nome do modelo (padrão: modelo ativo)')
        .option('--compare', 'Comparar todos os modelos instalados')
        .action(async (modelo, options) => {
        try {
            if (options?.compare) {
                const installed = await modelManager.listInstalledModels();
                if (installed.length === 0) {
                    logger.warn('Nenhum modelo instalado para comparar.');
                    return;
                }
                const modelNames = installed.map((m) => m.name);
                logger.info(`Comparando ${modelNames.length} modelo(s)...`);
                const results = await benchmarkEngine.compareBenchmarks(modelNames);
                console.log(benchmarkEngine.formatComparison(results));
                console.log('');
                return;
            }
            const target = modelo ?? modelManager.getDefaultModel();
            const result = await benchmarkEngine.runBenchmark(target);
            console.log(benchmarkEngine.formatBenchmarkResult(result));
            console.log('');
            logger.info('  Use "codemin model bench --compare" para comparar modelos.\n');
        }
        catch (error) {
            logger.error('Erro no benchmark:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=model.js.map