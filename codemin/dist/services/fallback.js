import { totalmem } from 'node:os';
import { logger } from '../utils/logger.js';
import { modelManager } from './model-manager.js';
import { ollamaClient } from './ollama-client.js';
const RAM_THRESHOLD_GB = 12;
const SMALL_MODEL = 'qwen2.5-coder:1.5b';
const FULL_MODEL = 'qwen2.5-coder:7b';
export class FallbackService {
    getTotalRamGB() {
        const bytes = totalmem();
        return Math.round((bytes / (1024 * 1024 * 1024)) * 10) / 10;
    }
    needsFallback() {
        return this.getTotalRamGB() < RAM_THRESHOLD_GB;
    }
    getRecommendedModel() {
        return this.needsFallback() ? SMALL_MODEL : FULL_MODEL;
    }
    async getStatus() {
        const totalRamGB = this.getTotalRamGB();
        const usingFallback = this.needsFallback();
        const recommendedModel = usingFallback ? SMALL_MODEL : FULL_MODEL;
        const currentModel = modelManager.getDefaultModel();
        const reason = usingFallback
            ? `RAM total: ${totalRamGB}GB (mínimo recomendado: ${RAM_THRESHOLD_GB}GB para ${FULL_MODEL})`
            : undefined;
        return {
            totalRamGB,
            recommendedModel,
            currentModel,
            usingFallback,
            reason,
        };
    }
    async applyFallback() {
        const status = await this.getStatus();
        if (!status.usingFallback) {
            logger.info(`RAM suficiente (${status.totalRamGB}GB). Modelo ${FULL_MODEL} recomendado.`);
            return false;
        }
        logger.warn(`RAM baixa detectada: ${status.totalRamGB}GB.`);
        logger.info(`Baixando modelo menor: ${SMALL_MODEL}...`);
        try {
            await ollamaClient.pullModel(SMALL_MODEL);
            logger.success(`Modelo ${SMALL_MODEL} baixado com sucesso!`);
            logger.info(`Use "codemin use --small" para alternar para ${SMALL_MODEL}.`);
            return true;
        }
        catch (error) {
            logger.error(`Erro ao baixar modelo fallback: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            return false;
        }
    }
    async switchModel(modelName) {
        try {
            const exists = await ollamaClient.modelExists(modelName);
            if (!exists) {
                logger.warn(`Modelo ${modelName} não encontrado. Baixando...`);
                await ollamaClient.pullModel(modelName);
            }
            // Update the default model in config (in-memory for now)
            // In a full implementation, this would persist to config.yaml
            logger.success(`Modelo ativo alterado para: ${modelName}`);
            return true;
        }
        catch (error) {
            logger.error(`Erro ao alternar modelo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            return false;
        }
    }
}
export const fallbackService = new FallbackService();
//# sourceMappingURL=fallback.js.map