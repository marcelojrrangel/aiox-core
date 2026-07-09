import { logger } from '../utils/logger.js';
import { languageSupport } from './language-support.js';
import { OLLAMA_HOST } from './ollama-client.js';
const DOC_GENERATOR_SYSTEM_PROMPT = `Você é um especialista em documentação de código.
Gere documentação no formato apropriado para a linguagem.

Diretrizes:
- PEP 257 (Python): docstrings com descrição, parâmetros, retorno, raises
- JSDoc (JS/TS): @param, @returns, @throws, @example
- JavaDoc (Java): @param, @return, @throws, @since, @see
- Inclua: descrição clara da função, tipo e descrição dos parâmetros, valor de retorno, exceções
- Adicione exemplo de uso quando relevante
- Preserve qualquer documentação existente
- Retorne APENAS o código com a documentação adicionada`;
export class DocGenerator {
    baseUrl;
    constructor(baseUrl = OLLAMA_HOST) {
        this.baseUrl = baseUrl;
    }
    async generateDocs(code, language) {
        const langInfo = languageSupport.detectLanguageByName(language);
        const docFormat = langInfo.docFormat;
        const userPrompt = `Adicione documentação no formato ${docFormat} para o código ${langInfo.name} abaixo:

\`\`\`${language}
${code}
\`\`\`

Código com documentação:`;
        logger.debug(`Generating docs in format: ${docFormat}`);
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'qwen2.5-coder:7b',
                messages: [
                    { role: 'system', content: DOC_GENERATOR_SYSTEM_PROMPT },
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
            throw new Error(`Erro na geração de docs: ${response.status} ${errorText}`);
        }
        const data = (await response.json());
        const documentedCode = this.extractCodeBlock(data.message?.content ?? '');
        return {
            language,
            docFormat,
            documentedCode: documentedCode || code,
        };
    }
    extractCodeBlock(text) {
        const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/;
        const match = text.match(codeBlockRegex);
        if (match) {
            return match[1].trim();
        }
        return text.trim();
    }
}
export const docGenerator = new DocGenerator();
//# sourceMappingURL=doc-generator.js.map