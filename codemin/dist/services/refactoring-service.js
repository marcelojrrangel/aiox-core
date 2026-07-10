import { logger } from '../utils/logger.js';
import { languageSupport } from './language-support.js';
import { OLLAMA_HOST } from './ollama-client.js';
const REFACTOR_SYSTEM_PROMPT = `Você é um especialista em refatoração de código.
Sua função é refatorar código seguindo instruções específicas, mantendo a semântica idêntica.

Diretrizes:
- Preserve o comportamento exato do código original
- Melhore legibilidade, performance e manutenibilidade
- Siga as convenções da linguagem alvo
- Retorne APENAS o código refatorado (sem explicações extras)
- Se a instrução for ambígua, escolha a abordagem mais segura
- Adicione comentários apenas se melhorarem significativamente a compreensão`;
export class RefactoringService {
    baseUrl;
    constructor(baseUrl = OLLAMA_HOST) {
        this.baseUrl = baseUrl;
    }
    async refactor(request) {
        const { code, instruction, language } = request;
        const langInfo = languageSupport.detectLanguageByName(language);
        const systemPrompt = `${REFACTOR_SYSTEM_PROMPT}\n\n${langInfo.systemPrompt}`;
        const userPrompt = `Refatore o código abaixo seguindo a instrução: "${instruction}"

Código original (${langInfo.name}):
\`\`\`${language}
${code}
\`\`\`

Instrução: ${instruction}

Código refatorado:`;
        logger.debug(`Refactoring request: ${instruction}`);
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'qwen2.5-coder:7b',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                stream: false,
                options: {
                    temperature: 0.1,
                    num_predict: 2048,
                    top_p: 0.9,
                },
            }),
            signal: AbortSignal.timeout(60000),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na refatoração: ${response.status} ${errorText}`);
        }
        const data = (await response.json());
        const refactored = this.extractCodeBlock(data.message?.content ?? '');
        return {
            original: code,
            refactored,
            explanation: `Refatorado: ${instruction}`,
        };
    }
    extractCodeBlock(text) {
        // Extract code from markdown code blocks if present
        const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/;
        const match = text.match(codeBlockRegex);
        if (match) {
            return match[1].trim();
        }
        return text.trim();
    }
}
export const refactoringService = new RefactoringService();
//# sourceMappingURL=refactoring-service.js.map