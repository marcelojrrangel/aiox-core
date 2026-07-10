import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { DocGenerator } from '../../src/services/doc-generator.js';

describe('DocGenerator', () => {
  let generator: DocGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new DocGenerator('http://localhost:11434');
  });

  describe('generateDocs', () => {
    it('should return documented code for Python (PEP 257)', async () => {
      const documentedCode = `def add(a: int, b: int) -> int:
    \"\"\"Add two numbers together.

    Args:
        a: First number to add.
        b: Second number to add.

    Returns:
        The sum of a and b.
    \"\"\"
    return a + b`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: `\`\`\`python\n${documentedCode}\n\`\`\`` },
        }),
      });

      const result = await generator.generateDocs(
        'def add(a, b): return a + b',
        'python'
      );

      expect(result.language).toBe('python');
      expect(result.docFormat).toBe('pep257');
      expect(result.documentedCode).toContain('"""');
      expect(result.documentedCode).toContain('Args:');
    });

    it('should return documented code for TypeScript (JSDoc)', async () => {
      const documentedCode = `/**
 * Adds two numbers together.
 * @param a - First number to add.
 * @param b - Second number to add.
 * @returns The sum of a and b.
 */
function add(a: number, b: number): number {
  return a + b;
}`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: `\`\`\`typescript\n${documentedCode}\n\`\`\`` },
        }),
      });

      const result = await generator.generateDocs(
        'function add(a: number, b: number): number { return a + b; }',
        'typescript'
      );

      expect(result.language).toBe('typescript');
      expect(result.docFormat).toBe('jsdoc');
      expect(result.documentedCode).toContain('@param');
      expect(result.documentedCode).toContain('@returns');
    });

    it('should return documented code for Java (JavaDoc)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: {
            content: `\`\`\`java\n/**\n * Adds two numbers.\n * @param a first number\n * @param b second number\n * @return sum\n */\npublic int add(int a, int b) { return a + b; }\n\`\`\``,
          },
        }),
      });

      const result = await generator.generateDocs(
        'public int add(int a, int b) { return a + b; }',
        'java'
      );

      expect(result.language).toBe('java');
      expect(result.docFormat).toBe('javadoc');
      expect(result.documentedCode).toContain('@param');
      expect(result.documentedCode).toContain('@return');
    });

    it('should fallback to original code on empty response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: '' },
        }),
      });

      const result = await generator.generateDocs(
        'function f() { return 1; }',
        'javascript'
      );

      expect(result.documentedCode).toBe('function f() { return 1; }');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => 'Overloaded',
      });

      await expect(
        generator.generateDocs('x = 1', 'python')
      ).rejects.toThrow('Erro na geração de docs: 503 Overloaded');
    });
  });
});
