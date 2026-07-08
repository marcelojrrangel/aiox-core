# AIOX Core — Fork com Integração Nativa para OpenCode CLI

Este repositório é um **fork do [SynkraAI/aiox-core](https://github.com/SynkraAI/aiox-core)** com uma camada adicional de integração nativa para o **[OpenCode CLI](https://opencode.ai)**.

## O que é

AIOX (Artificial Intelligence Orchestration eXperience) é um framework open-source de orquestração de IA para desenvolvimento full-stack, com 12 agentes especializados, 215+ tarefas executáveis e workflows orquestrados.

Este fork adiciona:

- **12 subagentes OpenCode** — invoque `@aiox-dev`, `@aiox-qa`, `@aiox-architect` etc. diretamente no OpenCode
- **4 comandos custom** — `/aiox-help`, `/aiox-init`, `/aiox-story`, `/aiox-workflow`
- **Skill `aiox-core`** — carregamento sob demanda do framework
- **Script de sincronização** — mantenha os agentes atualizados com `node bin/opencode-integration.js`

## Configuração do Repositório Remoto

Antes de começar, configure o remote do seu fork no GitHub:

```bash
# Crie um fork no GitHub e configure o remote
git remote add origin https://github.com/SEU_USUARIO/aiox-core.git
git branch -M main
git push -u origin main
```

> Substitua `SEU_USUARIO` pelo seu nome de usuário do GitHub.

## Início Rápido

```bash
# Clone este fork
git clone https://github.com/SEU_USUARIO/aiox-core.git meu-projeto
cd meu-projeto

# Instale as dependências do AIOX
npm install

# Abra o OpenCode
opencode

# Verifique a integração
/aiox-init
```

## Estrutura

```
├── .aiox-core/          # Core framework AIOX (orquestração, agentes, tarefas, workflows)
├── .agent/workflows/    # Instruções de ativação dos 12 agentes
├── .aiox/               # Sessões, logs, estado
├── .opencode/           # Integração OpenCode
│   ├── AGENTS.md        # Regras do ecossistema para o OpenCode
│   ├── agents/          # 12 subagentes (@aiox-dev, @aiox-qa, etc.)
│   ├── commands/        # 4 comandos custom (/aiox-*)
│   └── skills/aiox-core/SKILL.md
├── bin/                 # Script de sincronização
├── docs/                # Guia de uso completo
├── opencode.json        # Configuração global do OpenCode
└── package.json         # Dependências do AIOX
```

## Licença

MIT — assim como o projeto original.
