import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { TestGenerator } from '../../src/services/test-generator.js';

describe('TestGenerator', () => {
  let generator: TestGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new TestGenerator('http://localhost:11434');
  });

  describe('generateTests', () => {
    it('should generate test code for Python with pytest', async () => {
      const testCode = `import pytest
from mymodule import add

def test_add_positive_numbers():
    result = add(2, 3)
    assert result == 5

def test_add_negative_numbers():
    result = add(-1, -2)
    assert result == -3`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: `\`\`\`python\n${testCode}\n\`\`\`` },
        }),
      });

      const result = await generator.generateTests(
        'def add(a, b): return a + b',
        'python'
      );

      expect(result.framework).toBe('pytest');
      expect(result.testCode).toContain('import pytest');
      expect(result.testCode).toContain('def test_add');
      expect(result.fileName).toContain('test_');
    });

    it('should generate test code for TypeScript with Jest', async () => {
      const testCode = `import { add } from './math';

describe('add', () => {
  it('should add two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });
});`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: `\`\`\`typescript\n${testCode}\n\`\`\`` },
        }),
      });

      const result = await generator.generateTests(
        'export function add(a: number, b: number): number { return a + b; }',
        'typescript'
      );

      expect(result.framework).toBe('jest');
      expect(result.testCode).toContain('describe');
      expect(result.testCode).toContain('expect');
    });

    it('should detect Java/Spring and use JUnit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: 'import org.junit.Test;' },
        }),
      });

      const result = await generator.generateTests(
        'public class Calculator { public int add(int a, int b) { return a + b; } }',
        'java'
      );

      expect(result.framework).toBe('junit');
      expect(result.fileName).toContain('Test.java');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server error',
      });

      await expect(
        generator.generateTests('function f() { return 1; }', 'javascript')
      ).rejects.toThrow('Erro na geração de testes: 500 Server error');
    });
  });
});
