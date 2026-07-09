import { writeFileSync } from 'node:fs';
import { getOpenCodeConfigPath, getContinueConfigPath, getCodeMinDir } from '../../utils/paths.js';
import { configGenerator } from '../../services/config-generator.js';
import { logger } from '../../utils/logger.js';
import { join } from 'node:path';
export function registerConfigCommand(program) {
    const configCmd = program
        .command('config')
        .description('Gerenciar arquivos de configuração do CodeMin');
    configCmd
        .command('show')
        .description('Mostrar caminhos dos arquivos de configuração')
        .action(() => {
        logger.header('📁 Caminhos do CodeMin');
        logger.info('');
        logger.info(`  Diretório base:    ${getCodeMinDir()}`);
        logger.info(`  OpenCode:          ${getOpenCodeConfigPath()}`);
        logger.info(`  Continue.dev:      ${getContinueConfigPath()}`);
        logger.info('');
        const count = configGenerator.countExistingConfigs();
        if (count > 0) {
            logger.success(`${count}/2 arquivos de configuração existentes`);
        }
        else {
            logger.warn('Nenhum arquivo de configuração encontrado');
            logger.info('Execute "codemin install" para gerar as configurações.');
        }
    });
    configCmd
        .command('generate')
        .description('Gerar novamente os arquivos de configuração')
        .option('--ide <ide>', 'Gerar configuração para IDE específica (vscode, jetbrains)')
        .action(async (options) => {
        try {
            if (options?.ide === 'jetbrains') {
                await generateJetBrainsConfig();
                return;
            }
            if (options?.ide === 'vscode') {
                await configGenerator.ensureConfigs();
                logger.success('Arquivos de configuração VS Code gerados com sucesso!');
                return;
            }
            await configGenerator.ensureConfigs();
            logger.success('Arquivos de configuração gerados com sucesso!');
        }
        catch (error) {
            logger.error('Erro ao gerar configurações:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
}
async function generateJetBrainsConfig() {
    logger.header('🛠️  CodeMin — Configuração para JetBrains');
    const jetBrainsConfig = {
        models: [
            {
                title: 'CodeMin Qwen 7B',
                provider: 'ollama',
                model: 'qwen2.5-coder:7b',
                apiBase: 'http://localhost:11434/v1',
                apiKey: 'codemin-local',
                contextLength: 8192,
                completionOptions: {
                    maxTokens: 4096,
                    temperature: 0.2,
                    topP: 0.9,
                },
            },
        ],
        tabAutocompleteModel: {
            title: 'CodeMin Autocomplete',
            provider: 'ollama',
            model: 'qwen2.5-coder:7b',
            apiBase: 'http://localhost:11434/v1',
            apiKey: 'codemin-local',
            completionOptions: {
                maxTokens: 128,
                temperature: 0.2,
                topP: 0.9,
            },
        },
        systemMessage: `Você é CodeMin, um assistente de codificação especializado.
Você ajuda desenvolvedores a escrever, revisar, refatorar e entender código.
Suas respostas são claras, objetivas e focadas em boas práticas.`,
        disablePromptCaching: false,
        requestOptions: {
            timeout: 60000,
        },
    };
    const configPath = join(getCodeMinDir(), 'configs', 'codemin-jetbrains.json');
    writeFileSync(configPath, JSON.stringify(jetBrainsConfig, null, 2), 'utf-8');
    logger.success(` Configuração JetBrains gerada: ${configPath}`);
    logger.info('');
    logger.info('  Para usar no JetBrains:');
    logger.info('  1. Instale o plugin Continue.dev no JetBrains:');
    logger.info('     Settings → Plugins → Marketplace → "Continue"');
    logger.info('');
    logger.info('  2. Copie o arquivo de configuração:');
    logger.info(`     cp "${configPath}" ~/.continue/config.json`);
    logger.info('     (ou em projetos: .continue/config.json na raiz do projeto)');
    logger.info('');
    logger.info('  3. Reinicie o JetBrains IDE');
    logger.info('  4. Use Ctrl+I para abrir o chat, Ctrl+Shift+I para autocomplete');
    logger.info('');
    logger.info('  Compatível com:');
    logger.info('  • IntelliJ IDEA (Community/Ultimate)');
    logger.info('  • PyCharm (Professional/Community)');
    logger.info('  • GoLand');
    logger.info('  • WebStorm / PhpStorm / Rider');
    logger.info('');
}
//# sourceMappingURL=config.js.map