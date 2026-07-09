import { describe, it, expect } from 'vitest';
import { LanguageSupport } from '../../src/services/language-support.js';

describe('LanguageSupport', () => {
  const support = new LanguageSupport();

  describe('detectLanguage', () => {
    it('should detect Python from .py extension', () => {
      const info = support.detectLanguage('main.py');
      expect(info.name).toBe('Python');
      expect(info.docFormat).toBe('pep257');
      expect(info.testFramework).toBe('pytest');
    });

    it('should detect JavaScript from .js extension', () => {
      const info = support.detectLanguage('app.js');
      expect(info.name).toBe('JavaScript');
      expect(info.docFormat).toBe('jsdoc');
      expect(info.testFramework).toBe('jest');
    });

    it('should detect TypeScript from .ts extension', () => {
      const info = support.detectLanguage('component.ts');
      expect(info.name).toBe('TypeScript');
      expect(info.docFormat).toBe('jsdoc');
      expect(info.testFramework).toBe('jest');
    });

    it('should detect TypeScript from .tsx extension', () => {
      const info = support.detectLanguage('component.tsx');
      expect(info.name).toBe('TypeScript');
    });

    it('should detect Java from .java extension', () => {
      const info = support.detectLanguage('Main.java');
      expect(info.name).toBe('Java');
      expect(info.docFormat).toBe('javadoc');
      expect(info.testFramework).toBe('junit');
    });

    it('should detect Go from .go extension', () => {
      const info = support.detectLanguage('main.go');
      expect(info.name).toBe('Go');
      expect(info.docFormat).toBe('godoc');
      expect(info.testFramework).toBe('go test');
    });

    it('should detect Rust from .rs extension', () => {
      const info = support.detectLanguage('lib.rs');
      expect(info.name).toBe('Rust');
      expect(info.docFormat).toBe('rustdoc');
      expect(info.testFramework).toBe('cargo test');
    });

    it('should detect C++ from .cpp extension', () => {
      const info = support.detectLanguage('main.cpp');
      expect(info.name).toBe('C++');
      expect(info.testFramework).toBe('gtest');
    });

    it('should detect C++ from .hpp extension', () => {
      const info = support.detectLanguage('header.hpp');
      expect(info.name).toBe('C++');
    });

    it('should detect C# from .cs extension', () => {
      const info = support.detectLanguage('Program.cs');
      expect(info.name).toBe('C#');
      expect(info.testFramework).toBe('xunit');
    });

    it('should detect Ruby from .rb extension', () => {
      const info = support.detectLanguage('app.rb');
      expect(info.name).toBe('Ruby');
      expect(info.testFramework).toBe('rspec');
      expect(info.docFormat).toBe('docstring');
    });

    it('should handle paths with directories', () => {
      const info = support.detectLanguage('/home/user/project/src/index.ts');
      expect(info.name).toBe('TypeScript');
    });
  });

  describe('detectLanguageByName', () => {
    it('should detect by language name', () => {
      expect(support.detectLanguageByName('python').name).toBe('Python');
      expect(support.detectLanguageByName('javascript').name).toBe('JavaScript');
      expect(support.detectLanguageByName('typescript').name).toBe('TypeScript');
      expect(support.detectLanguageByName('java').name).toBe('Java');
      expect(support.detectLanguageByName('go').name).toBe('Go');
      expect(support.detectLanguageByName('rust').name).toBe('Rust');
      expect(support.detectLanguageByName('c++').name).toBe('C++');
      expect(support.detectLanguageByName('c#').name).toBe('C#');
      expect(support.detectLanguageByName('ruby').name).toBe('Ruby');
    });

    it('should detect by extension string', () => {
      expect(support.detectLanguageByName('.py').name).toBe('Python');
      expect(support.detectLanguageByName('.ts').name).toBe('TypeScript');
      expect(support.detectLanguageByName('.go').name).toBe('Go');
      expect(support.detectLanguageByName('.rs').name).toBe('Rust');
    });
  });

  describe('getSystemPrompt', () => {
    it('should return a non-empty system prompt for each language', () => {
      const languages = ['python', 'javascript', 'typescript', 'java', 'go', 'rust', 'c++', 'c#', 'ruby'];
      for (const lang of languages) {
        const prompt = support.getSystemPrompt(lang);
        expect(prompt.length).toBeGreaterThan(0);
        expect(prompt).toContain('coding expert');
      }
    });
  });

  describe('getTestFramework', () => {
    it('should return correct test frameworks', () => {
      expect(support.getTestFramework('python')).toBe('pytest');
      expect(support.getTestFramework('javascript')).toBe('jest');
      expect(support.getTestFramework('typescript')).toBe('jest');
      expect(support.getTestFramework('java')).toBe('junit');
      expect(support.getTestFramework('go')).toBe('go test');
      expect(support.getTestFramework('rust')).toBe('cargo test');
      expect(support.getTestFramework('c++')).toBe('gtest');
      expect(support.getTestFramework('c#')).toBe('xunit');
      expect(support.getTestFramework('ruby')).toBe('rspec');
    });
  });

  describe('getDocFormat', () => {
    it('should return correct doc formats', () => {
      expect(support.getDocFormat('python')).toBe('pep257');
      expect(support.getDocFormat('javascript')).toBe('jsdoc');
      expect(support.getDocFormat('typescript')).toBe('jsdoc');
      expect(support.getDocFormat('java')).toBe('javadoc');
      expect(support.getDocFormat('go')).toBe('godoc');
      expect(support.getDocFormat('rust')).toBe('rustdoc');
    });
  });

  describe('buildLanguagePrompt', () => {
    it('should prepend system prompt to base prompt', () => {
      const result = support.buildLanguagePrompt('Write code', 'python');
      expect(result).toContain('Python');
      expect(result).toContain('Write code');
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return all 9 languages', () => {
      const langs = support.getSupportedLanguages();
      expect(langs).toHaveLength(9);
      const names = langs.map((l) => l.name);
      expect(names).toContain('Python');
      expect(names).toContain('JavaScript');
      expect(names).toContain('TypeScript');
      expect(names).toContain('Java');
      expect(names).toContain('Go');
      expect(names).toContain('Rust');
      expect(names).toContain('C++');
      expect(names).toContain('C#');
      expect(names).toContain('Ruby');
    });
  });

  describe('formatLanguagesTable', () => {
    it('should return a formatted table string', () => {
      const table = support.formatLanguagesTable();
      expect(table).toContain('Python');
      expect(table).toContain('Go');
      expect(table).toContain('Rust');
      expect(table).toContain('9 linguagens');
    });
  });
});
