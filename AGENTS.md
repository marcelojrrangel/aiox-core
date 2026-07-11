# AIOX Core — OpenCode Fork

Fork de [SynkraAI/aiox-core](https://github.com/SynkraAI/aiox-core) com integração nativa OpenCode.
Remote: `https://github.com/marcelojrrangel/aiox-core.git`

## Estrutura

| Caminho | Papel |
|---------|-------|
| `.aiox-core/` | Framework core (orquestração, 215+ tasks, workflows) |
| `.opencode/` | Camada de integração OpenCode (13 subagentes, 5 comandos, 11 skills) |
| `.agent/workflows/` | Instruções de ativação dos agentes (12 arquivos) |
| `opencode.json` | Config global OpenCode — define permissões, subagentes, comandos |
| `bin/opencode-integration.js` | Script de sincronização: `node bin/opencode-integration.js sync` |
| `docs/` | Guia de uso (`docs/opencode-usage-guide.md`) |
| `exemplos/` | Template de estrutura — **não** é o projeto real |

## Comandos Essenciais

- **Iniciar sessão:** `opencode` no diretório raiz
- **Verificar instalação:** `/aiox-init` (dentro do OpenCode)
- **Ajuda geral:** `/aiox-help`
- **Executar workflow:** `/aiox-workflow <name> --story <path>`
- **Sincronizar agentes:** `node bin/opencode-integration.js sync`
- **Criar projeto novo:** `npx @marcelojrrangel/create-aiox-core <nome>`
- **Dependências:** `npm install` em `.opencode/` (plugin `@opencode-ai/plugin`)

## Agentes (@aiox-*)

13 subagentes definidos em `opencode.json`. Permissões granulares:
- `@aiox-devops` é o **único** autorizado a `git push`
- `@aiox-qa` deve ser **diferente** do executor da história
- Comandos de agente usam prefixo `*` (ex: `*help`, `*develop`, `*gate`)

Tasks em `.aiox-core/development/tasks/<name>.md` (215+). Workflows em `.aiox-core/development/workflows/<name>.yaml`.

## Configuração Principal

- `.aiox-core/core-config.yaml` — projeto, QA, PRD, arquitetura, stories, lazy loading, boundary protection
- `.aiox-core/development/tasks/` — todas as tasks executáveis
- `devStoryLocation: docs/stories` — localização das histórias
- `prdFile: docs/prd.md`, `architectureFile: docs/architecture.md`
- Arquivos protegidos (não editar): `.aiox-core/core/`, `tasks/`, `templates/`, `checklists/`, `workflows/`, `bin/aiox*.js`

## Skills Instaladas (Tech Leads Club)

10 skills em `.opencode/skills/` — carregue com `skill` tool:

| Skill | Uso | Agente |
|-------|-----|--------|
| `tlc-spec-driven` | Planejamento em 4 fases (Spec→Design→Tasks→Impl) | master/orchestrator |
| `security-best-practices` | Revisão OWASP/CWE por linguagem | qa |
| `playwright-skill` | Automação de testes E2E | qa |
| `tactical-ddd` | DDD tático (aggregates, repositories) | architect |
| `figma` | Design-to-code via Figma | ux |
| `web-quality-audit` | Auditoria completa de qualidade web | qa |
| `aws-advisor` | Arquitetura AWS (custo, segurança, performance) | devops |
| `skill-architect` | Criação de novas skills pro framework | master |
| `codenavi` | Navegação inteligente em codebase | dev |
| `sentry` | Monitoramento de erros | devops |
| `loop-engineering` | Ciclo auto-corretivo (roadmap → code → test → fix) | dev (via `/loop-architect`) |

## Environment

- Node.js >= 18, npm >= 9
- OpenCode CLI: `npm install -g opencode-ai`
- Windows: `%APPDATA%\Python\Python314\Scripts` precisa estar no PATH para `whisper`
- YouTube 403: `yt-dlp --cookies-from-browser chrome -x --audio-format mp3 <url>`
