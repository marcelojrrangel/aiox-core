import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir, cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { logger } from '../utils/logger.js';
import { getOpenCodeConfigPath, getContinueConfigPath } from '../utils/paths.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATES_DIR = join(__dirname, '..', 'templates');
const MODEL = 'qwen2.5-coder:7b';
const API_BASE = 'http://localhost:11434/v1';
function loadTemplate(name) {
    try {
        const templatePath = join(TEMPLATES_DIR, name);
        if (existsSync(templatePath)) {
            return readFileSync(templatePath, 'utf-8');
        }
    }
    catch {
        // fallback para o template inline
    }
    return null;
}
const OPENCODE_TEMPLATE = {
    $schema: 'https://opencode.ai/config.json',
    model: 'codemin-local/qwen2.5-coder:1.5b',
    provider: {
        'codemin-local': {
            npm: '@ai-sdk/openai-compatible',
            name: 'CodeMin (Local Ollama)',
            options: {
                baseURL: API_BASE,
            },
            models: {
                'qwen2.5-coder:7b': {
                    name: 'Qwen 2.5 Coder 7B',
                },
                'qwen2.5-coder:1.5b': {
                    name: 'Qwen 2.5 Coder 1.5B (Leve)',
                },
                'qwen3:8b': {
                    name: 'Qwen 3 8B',
                    tools: true,
                    reasoning: true,
                },
            },
        },
    },
};
const SYSTEM_MESSAGE = `Você é CodeMin, um assistente de codificação especializado.
Você ajuda desenvolvedores a escrever, revisar, refatorar e entender código.
Suas respostas são:
- Claras e objetivas, focadas em código
- Em português ou inglês, conforme o usuário preferir
- Sempre que possível, inclua exemplos de código
- Priorize boas práticas, performance e legibilidade

Linguagens suportadas: Python, JavaScript, TypeScript, Java, Go, Rust, C++, C#`;
function createContinueConfig() {
    const numCores = cpus().length;
    return {
        models: [
            {
                title: 'CodeMin Qwen 7B',
                provider: 'ollama',
                model: MODEL,
                apiKey: 'codemin-local',
                apiBase: API_BASE,
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
            model: MODEL,
            apiKey: 'codemin-local',
            apiBase: API_BASE,
            completionOptions: {
                maxTokens: 64,
                temperature: 0.2,
                topP: 0.9,
            },
        },
        systemMessage: SYSTEM_MESSAGE,
    };
}
export class ConfigGenerator {
    async generateOpenCodeConfig() {
        const configPath = getOpenCodeConfigPath();
        const config = OPENCODE_TEMPLATE;
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        logger.success(` Arquivo gerado: ${configPath}`);
        return configPath;
    }
    async generateContinueConfig() {
        const configPath = getContinueConfigPath();
        const config = createContinueConfig();
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        logger.success(` Arquivo gerado: ${configPath}`);
        return configPath;
    }
    async ensureConfigs() {
        const opencodePath = await this.generateOpenCodeConfig();
        const continuePath = await this.generateContinueConfig();
        this.printInstructions();
        return { opencode: opencodePath, continue: continuePath };
    }
    printInstructions() {
        logger.divider();
        logger.info('\n📋  Instruções de uso:');
        logger.info('');
        logger.info('  Para usar com OpenCode:');
        logger.info(`    Copie o arquivo gerado para a raiz do seu projeto como opencode.json:`);
        logger.info(`    copy "${getOpenCodeConfigPath()}" .\\opencode.json`);
        logger.info('  No OpenCode, selecione "CodeMin (Local Ollama)" como provider.');
        logger.info('');
        logger.info('  Para usar com Continue.dev (VS Code):');
        logger.info(`    Copie o arquivo para ~/.continue/config.json:`);
        logger.info(`    copy "${getContinueConfigPath()}" "${join(homedir(), '.continue', 'config.json')}"`);
        logger.info('');
        logger.info('  Comandos disponíveis:');
        logger.info('    codemin chat     → Chat interativo no terminal');
        logger.info('    codemin status   → Verificar saúde do sistema');
        logger.info('    codemin doctor   → Diagnóstico completo');
        logger.divider();
    }
    configsExist() {
        return existsSync(getOpenCodeConfigPath()) || existsSync(getContinueConfigPath());
    }
    countExistingConfigs() {
        let count = 0;
        if (existsSync(getOpenCodeConfigPath()))
            count++;
        if (existsSync(getContinueConfigPath()))
            count++;
        return count;
    }
}
export const configGenerator = new ConfigGenerator();
//# sourceMappingURL=config-generator.js.map