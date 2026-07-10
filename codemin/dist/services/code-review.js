import { logger } from '../utils/logger.js';
import { languageSupport } from './language-support.js';
import { OLLAMA_HOST } from './ollama-client.js';
const CODE_REVIEW_SYSTEM_PROMPT = `Você é um revisor de código especializado em segurança, performance, boas práticas e manutenibilidade.

Categorias de análise:
1. SEGURANÇA: SQL injection, XSS, hardcoded secrets, eval/exec, shell injection, validação de entrada
2. PERFORMANCE: loops ineficientes, alocações desnecessárias, N+1 queries, falta de cache
3. BOAS PRÁTICAS: SOLID violations, code smells, duplicação, nomes inadequados, falta de testes
4. MANUTENIBILIDADE: complexidade ciclomática alta, falta de modularização, documentação ausente

Formato de resposta: retorne APENAS um JSON no formato:
{
  "summary": "<resumo da revisão>",
  "issues": [
    { "category": "segurança|performance|boas-práticas|manutenibilidade", "severity": "crítico|alto|médio|baixo|info", "line": <número>, "description": "<descrição>", "suggestion": "<sugestão>" }
  ],
  "score": <0-100>
}`;
export class CodeReviewService {
    baseUrl;
    constructor(baseUrl = OLLAMA_HOST) {
        this.baseUrl = baseUrl;
    }
    async review(code, language) {
        const langInfo = languageSupport.detectLanguageByName(language);
        const userPrompt = `Revise o código ${langInfo.name} abaixo e retorne um relatório JSON:

\`\`\`${language}
${code}
\`\`\`

Relatório de revisão (formato JSON):`;
        logger.debug('Running code review...');
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'qwen2.5-coder:7b',
                messages: [
                    { role: 'system', content: CODE_REVIEW_SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt },
                ],
                stream: false,
                options: {
                    temperature: 0.1,
                    num_predict: 4096,
                    top_p: 0.9,
                },
            }),
            signal: AbortSignal.timeout(60000),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro no code review: ${response.status} ${errorText}`);
        }
        const data = (await response.json());
        const content = data.message?.content ?? '{}';
        return this.parseReviewReport(content);
    }
    parseReviewReport(content) {
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    summary: parsed.summary ?? 'Nenhum resumo disponível',
                    issues: Array.isArray(parsed.issues) ? parsed.issues : [],
                    score: parsed.score ?? 0,
                };
            }
        }
        catch {
            logger.warn('Falha ao parsear relatório de revisão');
        }
        return { summary: 'Falha ao gerar relatório', issues: [], score: 0 };
    }
}
export const codeReviewService = new CodeReviewService();
//# sourceMappingURL=code-review.js.map