import type { TestGenerationResult } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { languageSupport } from './language-support.js';
import { OLLAMA_HOST } from './ollama-client.js';

const TEST_GENERATOR_SYSTEM_PROMPT = `Você é um especialista em geração de testes unitários.
Gere testes completos e robustos seguindo as melhores práticas.

Diretrizes:
- Cubra: caso feliz (happy path), casos de erro, edge cases, casos limite
- Siga as convenções de nomenclatura da linguagem/framework
- Use mocks quando necessário para isolar a unidade testada
- Inclua assertions significativas (não apenas "não lançou exceção")
- Teste valores limite, entradas vazias, null/undefined, tipos inesperados
- Retorne APENAS o código de teste, sem explicações extras`;

export class TestGenerator {
  private baseUrl: string;

  constructor(baseUrl = OLLAMA_HOST) {
    this.baseUrl = baseUrl;
  }

  async generateTests(code: string, language: string): Promise<TestGenerationResult> {
    const langInfo = languageSupport.detectLanguageByName(language);
    const framework = langInfo.testFramework;
    const commentStyle = langInfo.commentStyle;

    const userPrompt = `Gere testes unitários para o código abaixo usando ${framework}.

${commentStyle} Código fonte (${langInfo.name}):
\`\`\`${language}
${code}
\`\`\`

${commentStyle} Testes gerados com ${framework}:`;

    logger.debug(`Generating tests with framework: ${framework}`);

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-coder:7b',
        messages: [
          { role: 'system', content: TEST_GENERATOR_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
        options: {
          temperature: 0.2,
          num_predict: 4096,
          top_p: 0.9,
        },
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na geração de testes: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as { message?: { content: string } };
    const testCode = this.extractCodeBlock(data.message?.content ?? '');
    const testFileName = this.buildTestFileName(language);

    return {
      framework,
      testCode,
      fileName: testFileName,
    };
  }

  private extractCodeBlock(text: string): string {
    const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/;
    const match = text.match(codeBlockRegex);
    if (match) {
      return match[1].trim();
    }
    return text.trim();
  }

  private buildTestFileName(language: string): string {
    const langInfo = languageSupport.detectLanguageByName(language);
    const ext = langInfo.extension;
    const framework = langInfo.testFramework;

    if (framework === 'pytest') {
      return `test_*${ext}`;
    }
    if (framework === 'jest') {
      return `*.test${ext}`;
    }
    if (framework === 'junit') {
      return `*Test.java`;
    }
    return `*.test${ext}`;
  }
}

export const testGenerator = new TestGenerator();
