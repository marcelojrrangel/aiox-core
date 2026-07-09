import { ollamaClient } from './ollama-client.js';
import { logger } from '../utils/logger.js';
import { executeAndCheck } from '../utils/shell.js';
import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getCodeMinDir } from '../utils/paths.js';
const DEFAULT_MODEL = 'qwen2.5-coder:7b';
const FALLBACK_MODEL = 'qwen2.5-coder:1.5b';
const MODEL_CATALOG = [
    {
        id: 'qwen2.5-coder:7b',
        name: 'Qwen2.5-Coder 7B Instruct',
        size: '4.7 GB',
        url: 'qwen2.5-coder:7b',
        sha256: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
    },
    {
        id: 'qwen2.5-coder:1.5b',
        name: 'Qwen2.5-Coder 1.5B Instruct',
        size: '1.0 GB',
        url: 'qwen2.5-coder:1.5b',
        sha256: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c',
    },
    {
        id: 'qwen3:8b',
        name: 'Qwen3 8B (Tool-use/Reasoning)',
        size: '5.0 GB',
        url: 'qwen3:8b',
        sha256: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
    },
    {
        id: 'deepseek-coder-v2:16b',
        name: 'DeepSeek-Coder V2 16B (MoE)',
        size: '9.0 GB',
        url: 'deepseek-coder-v2:16b',
        sha256: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
    },
    {
        id: 'phi-3:3.8b',
        name: 'Phi-3 3.8B (Ultra-rápido)',
        size: '2.3 GB',
        url: 'phi-3:3.8b',
        sha256: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
    },
    {
        id: 'codellama:7b',
        name: 'CodeLlama 7B (Alternativa)',
        size: '3.8 GB',
        url: 'codellama:7b',
        sha256: 'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
    },
];
const MODEL_DETAILS = {
    'qwen2.5-coder:7b': {
        id: 'qwen2.5-coder:7b',
        name: 'Qwen2.5-Coder 7B Instruct',
        size: '4.7 GB',
        url: 'qwen2.5-coder:7b',
        description: 'Modelo principal recomendado. Excelente para geração, chat, FIM e refatoração. Melhor custo-benefício em CPU.',
        ramRequired: '8 GB',
        speed: 'medium',
        bestFor: ['Geral', 'Chat', 'FIM', 'Refatoração', 'Explicação'],
    },
    'qwen2.5-coder:1.5b': {
        id: 'qwen2.5-coder:1.5b',
        name: 'Qwen2.5-Coder 1.5B Instruct',
        size: '1.0 GB',
        url: 'qwen2.5-coder:1.5b',
        description: 'Modelo leve para fallback em hardware limitado. Funciona com 4 GB RAM.',
        ramRequired: '4 GB',
        speed: 'fast',
        bestFor: ['Fallback', 'Chat simples', 'Autocomplete básico'],
    },
    'qwen3:8b': {
        id: 'qwen3:8b',
        name: 'Qwen3 8B (Tool-use/Reasoning)',
        size: '5.0 GB',
        url: 'qwen3:8b',
        description: 'Modelo de última geração com suporte a tool-use e raciocínio avançado. Melhor para tarefas complexas.',
        ramRequired: '12 GB',
        speed: 'medium',
        bestFor: ['Raciocínio', 'Tool-use', 'Tarefas complexas', 'Code review'],
    },
    'deepseek-coder-v2:16b': {
        id: 'deepseek-coder-v2:16b',
        name: 'DeepSeek-Coder V2 16B (MoE)',
        size: '9.0 GB',
        url: 'deepseek-coder-v2:16b',
        description: 'Modelo MoE eficiente que oferece performance de 16B com consumo de ~9B. Excelente para código.',
        ramRequired: '16 GB',
        speed: 'slow',
        bestFor: ['Geração avançada', 'Refatoração complexa', 'Projetos grandes'],
    },
    'phi-3:3.8b': {
        id: 'phi-3:3.8b',
        name: 'Phi-3 3.8B (Ultra-rápido)',
        size: '2.3 GB',
        url: 'phi-3:3.8b',
        description: 'Modelo ultra-rápido da Microsoft. Ideal para autocomplete em tempo real e tarefas simples.',
        ramRequired: '4 GB',
        speed: 'ultra-fast',
        bestFor: ['Autocomplete', 'Chat rápido', 'Explicações simples'],
    },
    'codellama:7b': {
        id: 'codellama:7b',
        name: 'CodeLlama 7B (Alternativa)',
        size: '3.8 GB',
        url: 'codellama:7b',
        description: 'Alternativa da Meta especializada em código. Suporte nativo a FIM e infill.',
        ramRequired: '8 GB',
        speed: 'medium',
        bestFor: ['FIM', 'Geração de código', 'Chat'],
    },
};
const CONFIG_FILE = 'active-model.json';
function getActiveModelPath() {
    return join(getCodeMinDir(), CONFIG_FILE);
}
function readActiveModel() {
    try {
        const path = getActiveModelPath();
        if (existsSync(path)) {
            const data = JSON.parse(readFileSync(path, 'utf-8'));
            return data.model ?? DEFAULT_MODEL;
        }
    }
    catch {
        // ignore, use default
    }
    return DEFAULT_MODEL;
}
function writeActiveModel(model) {
    const path = getActiveModelPath();
    writeFileSync(path, JSON.stringify({ model, updatedAt: new Date().toISOString() }, null, 2), 'utf-8');
}
export class ModelManager {
    activeModel;
    constructor() {
        this.activeModel = readActiveModel();
    }
    async resolve(modelName) {
        const target = modelName ?? this.activeModel;
        const model = MODEL_CATALOG.find((m) => m.id === target);
        if (model)
            return model;
        return {
            id: target,
            name: target,
            size: 'desconhecido',
            url: target,
        };
    }
    async isInstalled(modelName) {
        return ollamaClient.modelExists(modelName);
    }
    async downloadModel(modelName, force) {
        logger.info(`\n  📥 Baixando modelo ${modelName} (~${this.getModelSize(modelName)})...`);
        logger.info(`  Isso pode levar alguns minutos dependendo da sua conexão.\n`);
        if (force) {
            logger.info('  🔄 Forçando redownload...');
        }
        try {
            let lastStatus = '';
            let lastPct = -1;
            await ollamaClient.pullModel(modelName, (status, completed, total) => {
                if (total > 0 && completed > 0) {
                    const pct = Math.min(Math.round((completed / total) * 100), 100);
                    if (pct !== lastPct) {
                        lastPct = pct;
                        logger.progress(pct, `${modelName} — ${status}`);
                    }
                }
                else if (status !== lastStatus) {
                    lastStatus = status;
                    const icons = {
                        pulling: '⬇️',
                        downloading: '📥',
                        verifying: '🔍',
                        unpacking: '📦',
                        success: '✅',
                    };
                    process.stdout.write(`\n  ${icons[status] ?? '⏳'} ${status}...`);
                }
            });
            logger.progress(100, `${modelName} — concluído`);
            logger.success(` Modelo ${modelName} baixado com sucesso!`);
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('timeout')) {
                throw new Error('Timeout ao baixar o modelo. Verifique sua conexão e tente novamente.');
            }
            throw error;
        }
    }
    getModelSize(modelName) {
        for (const entry of Object.values(MODEL_DETAILS)) {
            if (entry.id === modelName)
                return entry.size;
        }
        return '?';
    }
    async removeModel(modelName) {
        try {
            const response = await fetch(`${ollamaClient['baseUrl']}/api/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName }),
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Falha ao remover modelo: ${response.status} ${errorBody}`);
            }
            logger.success(` Modelo ${modelName} removido com sucesso!`);
            return true;
        }
        catch (error) {
            logger.error(`Erro ao remover modelo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            return false;
        }
    }
    async switchModel(modelName) {
        try {
            const exists = await this.isInstalled(modelName);
            if (!exists) {
                logger.warn(`Modelo ${modelName} não encontrado localmente.`);
                logger.info('Baixe-o primeiro com: codemin model download ' + modelName);
                return false;
            }
            writeActiveModel(modelName);
            this.activeModel = modelName;
            logger.success(` Modelo ativo alterado para: ${modelName}`);
            return true;
        }
        catch (error) {
            logger.error(`Erro ao alternar modelo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            return false;
        }
    }
    async listInstalledModels() {
        try {
            const models = await ollamaClient.listModels();
            return models.map((m) => ({
                name: m.name,
                size: m.size,
                details: MODEL_DETAILS[m.name],
            }));
        }
        catch (error) {
            logger.error(`Erro ao listar modelos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            return [];
        }
    }
    async verifyModel(modelName) {
        const exists = await this.isInstalled(modelName);
        if (!exists)
            return false;
        try {
            const response = await ollamaClient.chat(modelName, [
                { role: 'user', content: 'Responda apenas: OK' },
            ], { maxTokens: 10, temperature: 0 });
            return response.length > 0;
        }
        catch {
            return false;
        }
    }
    getDefaultModel() {
        return this.activeModel;
    }
    getFallbackModel() {
        return FALLBACK_MODEL;
    }
    getCatalog() {
        return [...MODEL_CATALOG];
    }
    getModelDetails() {
        return { ...MODEL_DETAILS };
    }
    getModelDetail(id) {
        return MODEL_DETAILS[id];
    }
    formatModelList(installed) {
        const lines = [];
        lines.push('  Modelos Instalados:');
        lines.push('  ' + '─'.repeat(70));
        if (installed.length === 0) {
            lines.push('  Nenhum modelo instalado. Execute "codemin install" para baixar o modelo padrão.');
            return lines.join('\n');
        }
        for (const model of installed) {
            const isActive = model.name === this.activeModel;
            const activeMarker = isActive ? ' ◀ ATIVO' : '';
            const sizeGB = (model.size / (1024 * 1024 * 1024)).toFixed(1);
            const details = model.details;
            const desc = details ? details.description.slice(0, 60) : 'Modelo de linguagem';
            lines.push(`  ${isActive ? '●' : '○'} ${model.name.padEnd(25)} ${sizeGB.padStart(5)} GB  ${desc}${activeMarker}`);
        }
        return lines.join('\n');
    }
    formatModelDetails(id) {
        const details = MODEL_DETAILS[id];
        if (!details) {
            return `  Modelo "${id}" não encontrado no catálogo.`;
        }
        return `
  ┌─────────────────────────────────────────────────────────────┐
  │ ${details.name}
  ├─────────────────────────────────────────────────────────────┤
  │ ID:            ${details.id}
  │ Tamanho:       ${details.size}
  │ RAM Mínima:    ${details.ramRequired}
  │ Velocidade:    ${details.speed}
  │ Melhor para:   ${details.bestFor.join(', ')}
  │ Descrição:     ${details.description}
  └─────────────────────────────────────────────────────────────┘`;
    }
    async detectOllamaInstall() {
        const result = await executeAndCheck('ollama', ['--version']);
        if (result.success) {
            return { installed: true, version: result.stdout };
        }
        const commonPaths = [
            'C:\\Program Files\\Ollama\\ollama.exe',
            `${process.env.LOCALAPPDATA}\\Programs\\Ollama\\ollama.exe`,
            `${process.env.USERPROFILE}\\AppData\\Local\\Programs\\Ollama\\ollama.exe`,
        ];
        for (const p of commonPaths) {
            if (existsSync(p)) {
                const dir = p.replace(/\\ollama\.exe$/, '');
                return { installed: true, version: `encontrado em ${dir}` };
            }
        }
        return { installed: false };
    }
    async detectOllamaServer() {
        return ollamaClient.ping();
    }
}
export const modelManager = new ModelManager();
//# sourceMappingURL=model-manager.js.map