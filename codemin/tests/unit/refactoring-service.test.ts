import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { RefactoringService } from '../../src/services/refactoring-service.js';

describe('RefactoringService', () => {
  let service: RefactoringService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RefactoringService('http://localhost:11434');
  });

  describe('refactor', () => {
    it('should return refactored code', async () => {
      const refactoredCode = 'function add(a: number, b: number): number {\n  return a + b;\n}';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: {
            content: `\`\`\`typescript\n${refactoredCode}\n\`\`\``,
          },
        }),
      });

      const result = await service.refactor({
        code: 'function add(a, b) { return a + b; }',
        instruction: 'Adicione tipos TypeScript',
        language: 'typescript',
      });

      expect(result.original).toContain('function add');
      expect(result.refactored).toContain('number');
      expect(result.refactored).toContain(': number');
      expect(result.explanation).toContain('Adicione tipos');
    });

    it('should handle non-code-block responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: {
            content: 'const x = 1;',
          },
        }),
      });

      const result = await service.refactor({
        code: 'var x = 1;',
        instruction: 'Use const',
        language: 'javascript',
      });

      expect(result.refactored).toBe('const x = 1;');
    });

    it('should send request with correct system prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: '// refactored' },
        }),
      });

      await service.refactor({
        code: 'let a = 1;',
        instruction: 'Use const',
        language: 'javascript',
      });

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe('http://localhost:11434/api/chat');

      const body = JSON.parse(callArgs[1].body);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[0].content).toContain('refatoração');
      expect(body.messages[1].role).toBe('user');
      expect(body.messages[1].content).toContain('Use const');
      expect(body.options.temperature).toBe(0.1);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal error',
      });

      await expect(
        service.refactor({
          code: 'x',
          instruction: 'fix',
          language: 'typescript',
        })
      ).rejects.toThrow('Erro na refatoração: 500 Internal error');
    });
  });
});
