import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { CodeReviewService } from '../../src/services/code-review.js';

describe('CodeReviewService', () => {
  let service: CodeReviewService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CodeReviewService('http://localhost:11434');
  });

  describe('review', () => {
    it('should parse review report from JSON response', async () => {
      const mockReport = {
        summary: 'Good code with minor issues',
        issues: [
          {
            category: 'segurança',
            severity: 'alto',
            line: 15,
            description: 'SQL injection possible',
            suggestion: 'Use parameterized queries',
          },
          {
            category: 'boas-práticas',
            severity: 'baixo',
            line: 3,
            description: 'Magic number',
            suggestion: 'Extract to constant',
          },
        ],
        score: 75,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: JSON.stringify(mockReport) },
        }),
      });

      const report = await service.review(
        'const query = `SELECT * FROM users WHERE id = ${userId}`;',
        'javascript'
      );

      expect(report.summary).toBe('Good code with minor issues');
      expect(report.score).toBe(75);
      expect(report.issues).toHaveLength(2);
      expect(report.issues[0].category).toBe('segurança');
      expect(report.issues[0].severity).toBe('alto');
    });

    it('should return default report on parse failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: 'Invalid response without JSON' },
        }),
      });

      const report = await service.review('x = 1', 'python');
      expect(report.summary).toBe('Falha ao gerar relatório');
      expect(report.issues).toEqual([]);
      expect(report.score).toBe(0);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad request',
      });

      await expect(
        service.review('code', 'typescript')
      ).rejects.toThrow('Erro no code review: 400 Bad request');
    });

    it('should categorize issues correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: {
            content: JSON.stringify({
              summary: 'Review complete',
              issues: [
                { category: 'performance', severity: 'médio', description: 'Slow loop', suggestion: 'Optimize' },
                { category: 'manutenibilidade', severity: 'info', description: 'Long function', suggestion: 'Split' },
              ],
              score: 60,
            }),
          },
        }),
      });

      const report = await service.review('for() { }', 'javascript');
      expect(report.issues).toHaveLength(2);
      expect(report.issues[1].category).toBe('manutenibilidade');
    });
  });
});
