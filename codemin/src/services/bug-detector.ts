import type { BugReport } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { languageSupport } from './language-support.js';
import { OLLAMA_HOST } from './ollama-client.js';

const BUG_DETECTOR_SYSTEM_PROMPT = `Você é um analista de código especializado em encontrar bugs.
Analise o código fornecido e identifique TODOS os possíveis bugs.

Categorias de bugs:
1. Null pointer / NoneType errors
2. Out-of-bounds / indexação inválida
3. Variáveis não utilizadas / declarações mortas
4. Type mismatch / incompatibilidade de tipos
5. Race conditions / problemas de concorrência
6. Memory leaks / vazamentos de memória
7. Lógica incorreta / off-by-one
8. Recursos não fechados (arquivos, conexões)
9. Divisão por zero / operações matemáticas inseguras
10. Strings / encoding issues

Formato de resposta: retorne APENAS uma lista JSON no formato:
[
  { "line": <número>, "type": "<tipo>", "severity": "alta|media|baixa", "description": "<descrição>", "suggestion": "<sugestão>" }
]`;

export class BugDetector {
  private baseUrl: string;

  constructor(baseUrl = OLLAMA_HOST) {
    this.baseUrl = baseUrl;
  }

  async detectBugs(code: string, language: string): Promise<BugReport[]> {
    const langInfo = languageSupport.detectLanguageByName(language);

    const userPrompt = `Analise o código ${langInfo.name} abaixo e retorne uma lista JSON de bugs encontrados:

\`\`\`${language}
${code}
\`\`\`

Lista de bugs (formato JSON):`;

    logger.debug('Detecting bugs...');

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-coder:7b',
        messages: [
          { role: 'system', content: BUG_DETECTOR_SYSTEM_PROMPT },
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
      throw new Error(`Erro na detecção de bugs: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as { message?: { content: string } };
    const content = data.message?.content ?? '[]';

    return this.parseBugReport(content);
  }

  private parseBugReport(content: string): BugReport[] {
    try {
      // Try to extract JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as BugReport[];
        return parsed.map((bug) => ({
          ...bug,
          severity: this.normalizeSeverity(bug.severity),
        }));
      }
    } catch {
      logger.warn('Falha ao parsear relatório de bugs, retornando vazio');
    }
    return [];
  }

  private normalizeSeverity(severity: string | undefined): 'alta' | 'media' | 'baixa' {
    const s = (severity ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (s.includes('alt')) return 'alta';
    if (s.includes('medi')) return 'media';
    return 'baixa';
  }
}

export const bugDetector = new BugDetector();
