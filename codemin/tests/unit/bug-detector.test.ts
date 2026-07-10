import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { BugDetector } from '../../src/services/bug-detector.js';

describe('BugDetector', () => {
  let detector: BugDetector;

  beforeEach(() => {
    vi.clearAllMocks();
    detector = new BugDetector('http://localhost:11434');
  });

  describe('detectBugs', () => {
    it('should parse bug report from JSON response', async () => {
      const mockBugs = [
        {
          line: 5,
          type: 'Null Pointer',
          severity: 'alta',
          description: 'Variable `obj` can be null',
          suggestion: 'Add null check before accessing properties',
        },
        {
          line: 12,
          type: 'Unused Variable',
          severity: 'baixa',
          description: 'Variable `temp` is declared but never used',
          suggestion: 'Remove unused variable',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: {
            content: JSON.stringify(mockBugs),
          },
        }),
      });

      const bugs = await detector.detectBugs(
        'const obj = null;\nconsole.log(obj.value);',
        'javascript'
      );

      expect(bugs).toHaveLength(2);
      expect(bugs[0].line).toBe(5);
      expect(bugs[0].type).toBe('Null Pointer');
      expect(bugs[0].severity).toBe('alta');
      expect(bugs[0].description).toContain('null');
      expect(bugs[1].severity).toBe('baixa');
    });

    it('should extract JSON from markdown code blocks', async () => {
      const mockBugs = [{ line: 3, type: 'Type Error', severity: 'media', description: 'Type mismatch', suggestion: 'Fix type' }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: {
            content: `Here are the bugs:\n\`\`\`json\n${JSON.stringify(mockBugs)}\n\`\`\``,
          },
        }),
      });

      const bugs = await detector.detectBugs('let x: number = "string";', 'typescript');
      expect(bugs).toHaveLength(1);
      expect(bugs[0].type).toBe('Type Error');
    });

    it('should return empty array on parse failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: 'No bugs found. The code looks good!' },
        }),
      });

      const bugs = await detector.detectBugs('const x = 1;', 'typescript');
      expect(bugs).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => 'Service unavailable',
      });

      await expect(
        detector.detectBugs('code', 'typescript')
      ).rejects.toThrow('Erro na detecção de bugs: 503 Service unavailable');
    });

    it('should normalize severity values', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: {
            content: JSON.stringify([
              { line: 1, type: 'Bug', severity: 'Alta', description: 'd', suggestion: 's' },
              { line: 2, type: 'Bug', severity: 'Média', description: 'd', suggestion: 's' },
              { line: 3, type: 'Bug', severity: 'baixa', description: 'd', suggestion: 's' },
            ]),
          },
        }),
      });

      const bugs = await detector.detectBugs('code', 'typescript');
      expect(bugs[0].severity).toBe('alta');
      expect(bugs[1].severity).toBe('media');
      expect(bugs[2].severity).toBe('baixa');
    });
  });
});
