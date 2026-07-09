# CodeMin — Assistente de Codificação LLM Local (CPU-only)

> **CodeMin: Seu copiloto local, gratuito e privado — sem GPU, sem assinatura, sem desculpas.**

CodeMin é um assistente de codificação que roda **100% local** na sua máquina, usando modelos de linguagem otimizados para CPU. Integra-se ao OpenCode e VS Code (via Continue.dev) para oferecer chat contextual, geração de código e autocomplete — tudo offline e com privacidade total.

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Node](https://img.shields.io/badge/Node.js-18%2B-339933)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![GitHub Repo](https://img.shields.io/badge/GitHub-marcelojrrangel%2Fcodemin-181717?logo=github)

## ✨ Funcionalidades

| Funcionalidade | Status | Descrição |
|---------------|--------|-----------|
| 🚀 Instalação em 2 comandos | ✅ MVP | `npm install -g codemin` + `codemin install` |
| 💬 Chat contextual (OpenCode) | ✅ MVP | Selecione código e faça perguntas |
| 💻 Chat nativo no terminal | ✅ MVP | `codemin chat` — sem precisar de IDE |
| ⚙️ Config Generator | ✅ MVP | Gera `opencode.json` e `continue.config.json` |
| 📊 Status Check | ✅ MVP | `codemin status` — saúde do sistema |
| 🔍 Diagnóstico | ✅ MVP | `codemin doctor` — 6 verificações completas |
| 🎯 Geração de código | ✅ MVP | Descreva em linguagem natural, receba código |
| 📝 Explicação de código | ✅ MVP | Selecione código e peça explicação |
| 🔄 Autocomplete FIM (V2) | ✅ V2 | Autocomplete inline via Continue.dev |
| 🎨 Refatoração (V2) | ✅ V2 | Refatore código com instruções naturais |
| 🐛 Detecção de Bugs (V2) | ✅ V2 | Encontre bugs automaticamente |
| 📋 Code Review (V2) | ✅ V2 | Análise de segurança e boas práticas |
| 🧪 Geração de Testes (V2) | ✅ V2 | Testes unitários automáticos |
| 📝 Documentação Automática (V2) | ✅ V2 | Gera docstrings/JSDoc/JavaDoc |
| 🔄 Fallback Automático (V2) | ✅ V2 | Detecta RAM baixa e sugere modelo menor |
| 🌐 9 Linguagens (V3) | ✅ V3 | Python, JS, TS, Java, Go, Rust, C++, C#, Ruby |
| 📦 Múltiplos Modelos (V3) | ✅ V3 | 6 modelos selecionáveis com benchmark |
| 📁 Contexto Multi-Arquivo (V3) | ✅ V3 | Autocomplete consciente do projeto |
| 🖥️ Plugin VS Code (V3) | ✅ V3 | Extensão oficial com chat e comandos |
| 🛠️ Suporte JetBrains (V3) | ✅ V3 | Configuração para IntelliJ, PyCharm, GoLand |

## 📦 Publicação no npm

### Criar conta
```bash
# 1. Acesse https://www.npmjs.com/signup
# 2. Preencha: nome de usuário, email, senha
# 3. Confirme o código enviado ao email
# 4. No terminal:
npm login
```

### Publicar
```bash
cd D:\projetos\IA\llm-local\codemin
npm publish
```

### Instalar globalmente
```bash
npm install -g codemin
codemin --help
```

### Testar localmente (sem publicar)
```bash
cd D:\projetos\IA\llm-local\codemin
npm install -g .
codemin --help
```

---

## 📋 Pré-requisitos

- **Node.js** 18+ ([download](https://nodejs.org/))
- **4 GB RAM** (mínimo) | **8 GB+** (recomendado)
- **5 GB** de espaço livre em disco
- Conexão com internet para o download inicial do modelo (~4.7 GB)

## 🚀 Instalação (2 comandos)

```bash
# 1. Instalar o CLI
npm install -g codemin

# 2. Instalar CodeMin (Ollama + modelo + configurações)
codemin install
```

O comando `codemin install` faz tudo automaticamente:
1. ✅ Verifica Node.js e sistema
2. ✅ Detecta ou instala o Ollama
3. ✅ Baixa o modelo Qwen2.5-Coder 7B (~4.7 GB)
4. ✅ Cria diretório `~/.codemin/` com estrutura completa
5. ✅ Gera arquivos de configuração para OpenCode e Continue.dev

## 📖 Uso

### Chat interativo no terminal
```bash
codemin chat
```
Comandos especiais: `/exit`, `/clear`, `/help`, `/generate <descrição>`, `/explain <código>`

### Verificar saúde do sistema
```bash
codemin status
```

### Diagnóstico completo
```bash
codemin doctor
```

### Gerenciar configurações
```bash
codemin config show              # Mostrar caminhos dos arquivos
codemin config generate          # Regenerar configurações
codemin config generate --ide jetbrains  # Configuração para JetBrains
codemin config generate --ide vscode     # Configuração para VS Code
```

### Listar linguagens suportadas
```bash
codemin languages
```

### Gerenciar modelos
```bash
codemin model list          # Listar modelos instalados e disponíveis
codemin model download <modelo>  # Baixar um modelo
codemin model remove <modelo>    # Remover um modelo
codemin model switch <modelo>    # Alternar modelo ativo
codemin model info <modelo>      # Detalhes de um modelo
codemin model bench [modelo]     # Benchmark de performance
codemin model bench --compare    # Comparar todos os modelos
```

### Contexto do projeto
```bash
codemin context              # Exibir contexto do projeto
codemin context --refresh    # Forçar re-escaneamento
codemin context --files a.ts,b.ts  # Arquivos específicos
```

### Benchmark de performance
```bash
codemin bench               # Benchmark do modelo ativo
codemin bench --compare     # Comparar modelos instalados
```

## 🔧 Integrações

### OpenCode
Copie o arquivo gerado para a raiz do seu projeto:
```bash
copy %USERPROFILE%\.codemin\configs\opencode.json .\opencode.json
```

### Continue.dev (VS Code)
Copie o arquivo de configuração:
```bash
copy %USERPROFILE%\.codemin\configs\continue.config.json %USERPROFILE%\.continue\config.json
```

## 🏗️ Estrutura do Projeto

```
codemin/
├── src/
│   ├── cli/
│   │   ├── index.ts              # Entry point (Commander.js)
│   │   └── commands/
│   │       ├── install.ts        # codemin install
│   │       ├── status.ts         # codemin status
│   │       ├── chat.ts           # codemin chat
│   │       ├── config.ts         # codemin config (com --ide jetbrains)
│   │       ├── doctor.ts         # codemin doctor
│   │       ├── autocomplete.ts   # codemin autocomplete
│   │       ├── refactor.ts       # codemin refactor
│   │       ├── detect-bugs.ts    # codemin detect-bugs
│   │       ├── review.ts         # codemin review
│   │       ├── generate-tests.ts # codemin generate-tests
│   │       ├── generate-docs.ts  # codemin generate-docs
│   │       ├── update.ts         # codemin update
│   │       ├── fallback.ts       # codemin fallback
│   │       ├── languages.ts      # codemin languages (V3)
│   │       ├── model.ts          # codemin model (V3)
│   │       ├── context.ts        # codemin context (V3)
│   │       └── bench.ts          # codemin bench (V3)
│   ├── services/
│   │   ├── installer.ts          # Lógica de instalação
│   │   ├── model-manager.ts      # Gerenciamento de modelos (6 modelos)
│   │   ├── ollama-client.ts      # API client para Ollama
│   │   ├── config-generator.ts   # Geração de configurações
│   │   ├── health-check.ts       # Diagnóstico do sistema
│   │   ├── language-support.ts   # Suporte a 9 linguagens (V3)
│   │   ├── fim-service.ts        # Fill-in-the-Middle
│   │   ├── refactoring-service.ts# Refatoração
│   │   ├── bug-detector.ts       # Detecção de bugs
│   │   ├── code-review.ts        # Code review
│   │   ├── test-generator.ts     # Geração de testes
│   │   ├── doc-generator.ts      # Documentação automática
│   │   ├── fallback.ts           # Fallback automático
│   │   ├── context-collector.ts  # Contexto multi-arquivo (V3)
│   │   └── benchmark-engine.ts   # Benchmark de modelos (V3)
│   ├── types/
│   │   └── index.ts              # Tipos TypeScript
│   └── utils/
│       ├── logger.ts             # Logger com cores
│       ├── paths.ts              # Gerenciamento de caminhos
│       └── shell.ts              # Execução de comandos
├── vscode-extension/             # Plugin VS Code oficial (V3)
│   ├── package.json              # Manifesto da extensão
│   ├── tsconfig.json
│   └── src/
│       └── extension.ts          # Chat, explicar, revisar, testes
├── tests/
│   ├── unit/                     # 13 suites de teste
│   └── integration/
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## 🛠️ Stack Tecnológica

| Componente | Tecnologia |
|-----------|------------|
| CLI | Node.js + TypeScript + Commander.js |
| Runtime LLM | Ollama + llama.cpp |
| Modelo Padrão | Qwen2.5-Coder 7B (Q4_K_M) |
| Modelos (6) | Qwen2.5-Coder (7B/1.5B), Qwen3 8B, DeepSeek-Coder V2 16B, Phi-3 3.8B, CodeLlama 7B |
| Integração OpenCode | API compatível com OpenAI |
| Integração VS Code | Extensão oficial + Continue.dev |
| Integração JetBrains | Continue.dev (IntelliJ, PyCharm, GoLand) |
| Linguagens | 9: Python, JS, TS, Java, Go, Rust, C++, C#, Ruby |
| Testes | Vitest (96 testes, 15 suites) |
| Linter | Biome |
| Distribuição | npm + VS Code Marketplace |

## 🤝 Contribuição

Contribuições são bem-vindas! Veja nosso [guia de contribuição](CONTRIBUTING.md).

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'feat: add amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## 📄 Licença

Distribuído sob licença MIT. Veja `LICENSE` para mais informações.

## 🔮 Roadmap

- ✅ **MVP (Sprint 1-2)**: Instalação, chat, geração de código, configurações, status
- ✅ **V2 (Sprint 3-6)**: Autocomplete FIM, refatoração, detecção de bugs, code review, geração de testes, documentação automática, fallback
- ✅ **V3 (Sprint 7-12)**: 9 linguagens, 6 modelos selecionáveis, gerenciamento de modelos, contexto multi-arquivo, plugin VS Code oficial, suporte JetBrains
- 🔜 **V4 (Futuro)**: Interface web local, fine-tuning com LoRA, benchmark comparativo, plugin JetBrains nativo

---

<p align="center">Feito com ❤️ para desenvolvedores que acreditam em software livre e privacidade.</p>
