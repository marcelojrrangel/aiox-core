import type { LanguageInfo } from '../types/index.js';

const LANGUAGE_CATALOG: LanguageInfo[] = [
  {
    name: 'Python',
    extension: '.py',
    systemPrompt: `You are a Python coding expert. Follow PEP 8 style guidelines.
Use type hints where appropriate. Prefer list comprehensions over map/filter.
Write docstrings in PEP 257 format (Google style). Use snake_case for functions/variables.`,
    docFormat: 'pep257',
    testFramework: 'pytest',
    commentStyle: '#',
    linter: 'ruff',
  },
  {
    name: 'JavaScript',
    extension: '.js',
    systemPrompt: `You are a JavaScript coding expert. Follow modern ES2022+ standards.
Use const/let over var. Prefer arrow functions and async/await over callbacks.
Write JSDoc comments for functions. Use camelCase for functions/variables.`,
    docFormat: 'jsdoc',
    testFramework: 'jest',
    commentStyle: '//',
    linter: 'eslint',
  },
  {
    name: 'TypeScript',
    extension: '.ts',
    systemPrompt: `You are a TypeScript coding expert. Use strict typing and interfaces.
Prefer type inference where clear. Use async/await, generics, and utility types.
Write JSDoc comments for public APIs. Use camelCase for functions/variables, PascalCase for types.`,
    docFormat: 'jsdoc',
    testFramework: 'jest',
    commentStyle: '//',
    linter: 'eslint',
  },
  {
    name: 'Java',
    extension: '.java',
    systemPrompt: `You are a Java coding expert. Follow Oracle coding standards.
Use proper OOP principles: encapsulation, inheritance, polymorphism.
Write JavaDoc comments for all public methods and classes.
Use camelCase for methods/variables, PascalCase for classes.`,
    docFormat: 'javadoc',
    testFramework: 'junit',
    commentStyle: '//',
    linter: 'checkstyle',
  },
  {
    name: 'Go',
    extension: '.go',
    systemPrompt: `You are a Go coding expert. Follow effective Go conventions and gofmt style.
Use proper error handling (never ignore errors). Prefer composition over inheritance.
Write Go-style comments (doc comments for exported symbols). Use camelCase for local variables, PascalCase for exports.`,
    docFormat: 'godoc',
    testFramework: 'go test',
    commentStyle: '//',
    linter: 'golangci-lint',
  },
  {
    name: 'Rust',
    extension: '.rs',
    systemPrompt: `You are a Rust coding expert. Follow Rust 2021 edition idioms.
Embrace ownership, borrowing, and lifetimes. Use Result/Option for error handling.
Write rustdoc comments (///) for all public items. Use snake_case for functions/variables, PascalCase for types.`,
    docFormat: 'rustdoc',
    testFramework: 'cargo test',
    commentStyle: '//',
    linter: 'clippy',
  },
  {
    name: 'C++',
    extension: '.cpp',
    systemPrompt: `You are a C++ coding expert. Follow C++20/23 standards.
Use RAII, smart pointers, and STL. Prefer modern C++ over C-style code.
Write Doxygen/JavaDoc-style comments for public APIs.
Use snake_case for functions, PascalCase for classes, UPPER_CASE for constants.`,
    docFormat: 'javadoc',
    testFramework: 'gtest',
    commentStyle: '//',
    linter: 'clang-tidy',
  },
  {
    name: 'C#',
    extension: '.cs',
    systemPrompt: `You are a C# coding expert. Follow .NET conventions and Microsoft guidelines.
Use async/await, LINQ, and proper OOP/functional patterns.
Write XML doc comments (///) for all public members.
Use PascalCase for methods/classes/properties, camelCase for local variables.`,
    docFormat: 'javadoc',
    testFramework: 'xunit',
    commentStyle: '//',
    linter: 'dotnet-format',
  },
  {
    name: 'Ruby',
    extension: '.rb',
    systemPrompt: `You are a Ruby coding expert. Follow Ruby style guide and convention over configuration.
Prefer iterators over loops, symbols over strings for identifiers.
Write YARD doc comments. Use snake_case for methods/variables, PascalCase for classes.`,
    docFormat: 'docstring',
    testFramework: 'rspec',
    commentStyle: '#',
    linter: 'rubocop',
  },
];

const EXTENSION_MAP = new Map<string, LanguageInfo>();
for (const lang of LANGUAGE_CATALOG) {
  EXTENSION_MAP.set(lang.extension, lang);
  // Also map by file extension variations
  const altExt = lang.extension.replace('.', '').toLowerCase();
  EXTENSION_MAP.set(`.${altExt}x`, lang); // .tsx, .jsx
}

// Additional extension mappings
EXTENSION_MAP.set('.jsx', LANGUAGE_CATALOG[1]); // JavaScript JSX
EXTENSION_MAP.set('.tsx', LANGUAGE_CATALOG[2]); // TypeScript TSX
EXTENSION_MAP.set('.hpp', LANGUAGE_CATALOG[6]); // C++ header
EXTENSION_MAP.set('.h', LANGUAGE_CATALOG[6]);   // C++ header
EXTENSION_MAP.set('.cc', LANGUAGE_CATALOG[6]);  // C++ source
EXTENSION_MAP.set('.cxx', LANGUAGE_CATALOG[6]); // C++ source

export class LanguageSupport {
  getSupportedLanguages(): LanguageInfo[] {
    return [...LANGUAGE_CATALOG];
  }

  formatLanguagesTable(): string {
    const rows = LANGUAGE_CATALOG.map((lang) => {
      const exts = this.getAllExtensions(lang.extension);
      return `  ${lang.name.padEnd(14)} ${(lang.extension + (exts.length > 1 ? `,${exts.slice(0, 3).join(',')}` : '')).padEnd(18)} ${lang.docFormat.padEnd(10)} ${lang.testFramework.padEnd(12)} ${lang.linter ?? '-'}`;
    });
    const header = '  Linguagem      Extensões           Doc        Test Framework   Linter';
    const sep = '  ' + '─'.repeat(72);
    return `\n${header}\n${sep}\n${rows.join('\n')}\n${sep}\n  Total: ${LANGUAGE_CATALOG.length} linguagens\n`;
  }

  private getAllExtensions(primaryExt: string): string[] {
    const exts: string[] = [];
    for (const [ext, lang] of EXTENSION_MAP.entries()) {
      if (lang.extension === primaryExt && ext !== primaryExt) {
        exts.push(ext);
      }
    }
    return exts;
  }

  detectLanguage(filePath: string): LanguageInfo {
    const lower = filePath.toLowerCase();
    for (const [ext, lang] of EXTENSION_MAP.entries()) {
      if (lower.endsWith(ext)) return lang;
    }
    // Default to TypeScript
    const ts = LANGUAGE_CATALOG.find((l) => l.extension === '.ts');
    return ts ?? LANGUAGE_CATALOG[0];
  }

  detectLanguageByName(name: string): LanguageInfo {
    const lower = name.toLowerCase();
    const found = LANGUAGE_CATALOG.find(
      (l) => l.name.toLowerCase() === lower || l.extension === `.${lower}`
    );
    if (found) return found;
    return this.detectLanguage(`file.${name.startsWith('.') ? name : `.${name}`}`);
  }

  getSystemPrompt(language: string): string {
    const info = this.detectLanguageByName(language);
    return info.systemPrompt;
  }

  getTestFramework(language: string): string {
    const info = this.detectLanguageByName(language);
    return info.testFramework;
  }

  getDocFormat(language: string): string {
    const info = this.detectLanguageByName(language);
    return info.docFormat;
  }

  getCommentStyle(language: string): string {
    const info = this.detectLanguageByName(language);
    return info.commentStyle;
  }

  buildLanguagePrompt(basePrompt: string, language: string): string {
    const info = this.detectLanguageByName(language);
    return `${info.systemPrompt}\n\n${basePrompt}`;
  }
}

export const languageSupport = new LanguageSupport();
