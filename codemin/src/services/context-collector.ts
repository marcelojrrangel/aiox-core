import { readFileSync, existsSync, statSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { type ContextInfo, type ProjectContext } from '../types/index.js';
import { languageSupport } from './language-support.js';
import { logger } from '../utils/logger.js';

const MAX_FILE_SIZE = 1024 * 1024; // 1 MB max per file
const MAX_FILES = 50; // max files to scan
const MAX_DEPTH = 5; // max directory depth

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'target', 'bin', 'obj',
  '.next', '.nuxt', 'coverage', '__pycache__', '.venv', 'venv',
  '.codemin', '.aiox-core', '.opencode', 'vendor',
]);

const SUPPORTED_EXTS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs',
  '.cpp', '.hpp', '.cc', '.cxx', '.h', '.cs', '.rb',
]);

export class ContextCollector {
  private cache: Map<string, { context: ProjectContext; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30_000; // 30 seconds

  async collectProjectContext(rootDir: string = process.cwd()): Promise<ProjectContext> {
    const cached = this.cache.get(rootDir);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.context;
    }

    logger.debug(`Coletando contexto do projeto: ${rootDir}`);
    const files: ContextInfo[] = [];
    const scanned = this.scanDirectory(rootDir, rootDir, 0);

    for (const filePath of scanned) {
      try {
        const info = this.extractContextInfo(filePath, rootDir);
        if (info) {
          files.push(info);
        }
      } catch {
        // skip files that can't be read
      }
    }

    const totalSymbols = files.reduce((sum, f) => sum + f.symbols.length, 0);
    const context: ProjectContext = {
      files,
      totalFiles: files.length,
      totalSymbols,
      lastUpdated: new Date(),
    };

    this.cache.set(rootDir, { context, timestamp: Date.now() });
    return context;
  }

  async collectFileContext(filePaths: string[]): Promise<ContextInfo[]> {
    const results: ContextInfo[] = [];
    for (const filePath of filePaths) {
      if (existsSync(filePath)) {
        const info = this.extractContextInfo(filePath, process.cwd());
        if (info) results.push(info);
      }
    }
    return results;
  }

  getContextSummary(context: ProjectContext): string {
    const lines: string[] = [];
    lines.push(`  📁 Contexto do Projeto`);
    lines.push(`  ${'─'.repeat(50)}`);
    lines.push(`  Arquivos escaneados: ${context.totalFiles}`);
    lines.push(`  Símbolos encontrados: ${context.totalSymbols}`);

    // Group by language
    const langCount = new Map<string, number>();
    for (const file of context.files) {
      const lang = languageSupport.detectLanguage(file.file).name;
      langCount.set(lang, (langCount.get(lang) ?? 0) + 1);
    }

    lines.push(`  Linguagens:`);
    for (const [lang, count] of [...langCount.entries()].sort((a, b) => b[1] - a[1])) {
      lines.push(`    • ${lang}: ${count} arquivo(s)`);
    }

    // Show top symbols
    const allSymbols = context.files.flatMap((f) => f.symbols);
    if (allSymbols.length > 0) {
      lines.push(`  Principais símbolos:`);
      const topSymbols = [...new Set(allSymbols)].slice(0, 20);
      for (const sym of topSymbols) {
        lines.push(`    • ${sym}`);
      }
    }

    lines.push(`  Última atualização: ${context.lastUpdated.toLocaleTimeString()}`);
    return lines.join('\n');
  }

  formatContext(context: ProjectContext): string {
    const lines: string[] = [];
    lines.push(`\n  Projeto: ${process.cwd()}`);
    lines.push(`  ${'═'.repeat(60)}`);
    lines.push(`\n  Arquivos (${context.totalFiles}):`);
    lines.push(`  ${'─'.repeat(60)}`);

    for (const file of context.files.slice(0, 30)) {
      const hasSymbols = file.symbols.length > 0 ? ` (${file.symbols.length} símbolos)` : '';
      const hasImports = file.imports.length > 0 ? ` [${file.imports.length} imports]` : '';
      lines.push(`  📄 ${file.file}${hasSymbols}${hasImports}`);
    }

    if (context.files.length > 30) {
      lines.push(`  ... e mais ${context.files.length - 30} arquivo(s)`);
    }

    lines.push(`\n  Estatísticas:`);
    lines.push(`  ${'─'.repeat(60)}`);
    lines.push(`  Total de arquivos:  ${context.totalFiles}`);
    lines.push(`  Total de símbolos:  ${context.totalSymbols}`);
    lines.push(`  Última atualização: ${context.lastUpdated.toLocaleString()}`);

    return lines.join('\n');
  }

  clearCache(): void {
    this.cache.clear();
  }

  private scanDirectory(dir: string, rootDir: string, depth: number): string[] {
    if (depth > MAX_DEPTH) return [];

    const results: string[] = [];
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relPath = relative(rootDir, fullPath);

        if (entry.isDirectory()) {
          if (!IGNORE_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
            results.push(...this.scanDirectory(fullPath, rootDir, depth + 1));
          }
        } else if (entry.isFile()) {
          const ext = extname(entry.name).toLowerCase();
          if (SUPPORTED_EXTS.has(ext)) {
            try {
              const stats = statSync(fullPath);
              if (stats.size <= MAX_FILE_SIZE) {
                results.push(fullPath);
              }
            } catch {
              // skip
            }
          }
        }
      }
    } catch {
      // skip directories we can't access
    }

    // Sort by modification time, newest first
    results.sort((a, b) => {
      try {
        return statSync(b).mtimeMs - statSync(a).mtimeMs;
      } catch {
        return 0;
      }
    });

    return results.slice(0, MAX_FILES);
  }

  private extractContextInfo(filePath: string, rootDir: string): ContextInfo | null {
    const content = readFileSync(filePath, 'utf-8');
    const relPath = relative(rootDir, filePath).replace(/\\/g, '/');
    const lang = languageSupport.detectLanguage(filePath);

    const symbols = this.extractSymbols(content, lang.extension);
    const imports = this.extractImports(content, lang.extension);
    const exports$1 = this.extractExports(content, lang.extension);

    return {
      file: relPath,
      symbols,
      imports,
      exports: exports$1,
      types: this.extractTypes(content, lang.extension),
      size: content.length,
    };
  }

  private extractSymbols(content: string, ext: string): string[] {
    const symbols: string[] = [];
    const patterns: Record<string, RegExp[]> = {
      '.ts': [/export (?:async )?(?:function|class|interface|type|enum|const|let|var) (\w+)/g,
        /(?:function|class|interface) (\w+)/g],
      '.tsx': [/export (?:async )?(?:function|class|interface|type|enum|const) (\w+)/g,
        /(?:function|class|interface) (\w+)/g],
      '.js': [/export (?:async )?(?:function|class|const|let|var) (\w+)/g,
        /(?:function|class) (\w+)/g],
      '.jsx': [/export (?:async )?(?:function|class|const) (\w+)/g,
        /(?:function|class) (\w+)/g],
      '.py': [/^(?:async )?def (\w+)/gm, /^class (\w+)/gm],
      '.java': [/(?:public|private|protected)\s+(?:static\s+)?(?:final\s+)?\w+\s+(\w+)\s*\(/g,
        /(?:public|private|protected)?\s*(?:class|interface|enum)\s+(\w+)/g],
      '.go': [/^func\s+(\w+)/gm, /^type\s+(\w+)\s+/gm, /^type\s+(\w+)\s+struct/gm],
      '.rs': [/^fn\s+(\w+)/gm, /^pub\s+fn\s+(\w+)/gm, /^struct\s+(\w+)/gm,
        /^enum\s+(\w+)/gm, /^trait\s+(\w+)/gm, /^impl\s+(\w+)/gm],
      '.cpp': [/\w+\s+(\w+)\s*\([^)]*\)\s*{/g, /class\s+(\w+)/g, /struct\s+(\w+)/g],
      '.cs': [/(?:public|private|protected|internal)?\s*(?:static\s+)?(?:async\s+)?\w+\s+(\w+)\s*\(/g,
        /(?:class|interface|struct|enum)\s+(\w+)/g],
      '.rb': [/^def\s+(\w+)/gm, /^class\s+(\w+)/gm, /^module\s+(\w+)/gm],
    };

    const filePatterns = patterns[ext] ?? patterns['.ts'];
    for (const pattern of filePatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && !symbols.includes(match[1])) {
          symbols.push(match[1]);
        }
      }
    }

    return symbols;
  }

  private extractImports(content: string, ext: string): string[] {
    const imports: string[] = [];
    const patterns: Record<string, RegExp> = {
      '.ts': /(?:import\s+(?:\w+\s*,?\s*)?{(?:[^}]*)}|import\s+\w+)\s+from\s+['"]([^'"]+)['"]/g,
      '.tsx': /(?:import\s+(?:\w+\s*,?\s*)?{(?:[^}]*)}|import\s+\w+)\s+from\s+['"]([^'"]+)['"]/g,
      '.js': /(?:import\s+(?:\w+\s*,?\s*)?{(?:[^}]*)}|import\s+\w+)\s+from\s+['"]([^'"]+)['"]/g,
      '.jsx': /(?:import\s+(?:\w+\s*,?\s*)?{(?:[^}]*)}|import\s+\w+)\s+from\s+['"]([^'"]+)['"]/g,
      '.py': /^(?:from\s+(\S+)\s+)?import\s+\S+/gm,
      '.java': /^import\s+([\w.]+);/gm,
      '.go': /^import\s+(?:"([^"]+)"|\(([^)]*)\))/gm,
      '.rs': /^use\s+([\w:]+)/gm,
      '.cpp': /^#include\s+[<"]([^>"]+)[>"]/gm,
      '.cs': /^using\s+([\w.]+);/gm,
      '.rb': /^require\s+['"]([^'"]+)['"]/gm,
    };

    const pattern = patterns[ext];
    if (pattern) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && !imports.includes(match[1])) {
          imports.push(match[1]);
        }
      }
    }

    return imports;
  }

  private extractExports(content: string, ext: string): string[] {
    const exports$1: string[] = [];
    const patterns: Record<string, RegExp> = {
      '.ts': /export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type|enum)\s+(\w+)/g,
      '.tsx': /export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type|enum)\s+(\w+)/g,
      '.js': /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g,
      '.jsx': /export\s+(?:default\s+)?(?:function|class|const)\s+(\w+)/g,
      '.py': /^def\s+(\w+)|^class\s+(\w+)/gm,
      '.java': /(?:public\s+)?(?:static\s+)?(?:final\s+)?\w+\s+(\w+)\s*\(/g,
      '.go': /^func\s+([A-Z]\w+)/gm,
      '.rs': /^pub\s+(?:fn|struct|enum|trait|type|const)\s+(\w+)/gm,
    };

    const pattern = patterns[ext];
    if (pattern) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const name = match[1] || match[2];
        if (name && !exports$1.includes(name)) {
          exports$1.push(name);
        }
      }
    }

    return exports$1;
  }

  private extractTypes(content: string, ext: string): string[] {
    const types: string[] = [];
    const patterns: Record<string, RegExp> = {
      '.ts': /(?:interface|type)\s+(\w+)/g,
      '.tsx': /(?:interface|type)\s+(\w+)/g,
      '.java': /(?:class|interface|enum)\s+(\w+)/g,
      '.go': /^type\s+(\w+)\s+(?:struct|interface|map|chan|\w+)/gm,
      '.rs': /(?:struct|enum|trait|type)\s+(\w+)/g,
      '.cs': /(?:class|interface|struct|enum|record)\s+(\w+)/g,
    };

    const pattern = patterns[ext];
    if (pattern) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && !types.includes(match[1])) {
          types.push(match[1]);
        }
      }
    }

    return types;
  }
}

export const contextCollector = new ContextCollector();
