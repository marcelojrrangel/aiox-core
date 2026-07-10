import { Command } from 'commander';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { ollamaClient } from '../../services/ollama-client.js';
import { modelManager } from '../../services/model-manager.js';
import { logger } from '../../utils/logger.js';
import chalk from 'chalk';

const SYSTEM_PROMPT = `Você é CodeMin, um assistente de codificação especializado.
Ajude o usuário com código: gere, explique, refatore, revise.
Responda de forma clara, direta e com exemplos de código quando relevante.
Mantenha as respostas concisas e acionáveis.`;

interface ChatSessionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function registerChatCommand(program: Command): void {
  program
    .command('chat')
    .description('Iniciar sessão de chat interativa no terminal')
    .option('-m, --model <modelo>', 'Modelo a usar (padrão: qwen2.5-coder:7b)')
    .option('--no-stream', 'Desabilitar streaming de resposta')
    .action(async (options?: { model?: string; stream?: boolean }) => {
      const modelName = options?.model ?? modelManager.getDefaultModel();
      const shouldStream = options?.stream ?? true;

      try {
        // Verificar se modelo está disponível
        logger.info(`Verificando modelo ${modelName}...`);
        const available = await ollamaClient.modelExists(modelName);
        if (!available) {
          logger.error(`Modelo "${modelName}" não encontrado.`);
          logger.info('Execute "codemin install" para baixar o modelo padrão.');
          process.exit(1);
        }

        await startChatSession(modelName, shouldStream);
      } catch (error) {
        logger.error('Erro ao iniciar chat:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}

async function startChatSession(model: string, useStream: boolean): Promise<void> {
  const history: ChatSessionMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  console.clear();
  logger.header(`💬 CodeMin Chat — Modelo: ${model}`);
  logger.info('  Comandos: /exit (sair)  /clear (limpar)  /help (ajuda)');
  logger.info('  Use Shift+Enter para pular linha.\n');

  const rl = createInterface({
    input,
    output,
    prompt: chalk.cyan('\n❯ '),
  });

  rl.prompt();

  let multiLineBuffer = '';

  for await (const line of rl) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      if (multiLineBuffer) {
        // Send accumulated multi-line input
        await processUserInput(model, multiLineBuffer, history, useStream);
        multiLineBuffer = '';
      }
      rl.prompt();
      continue;
    }

    // Handle commands
    if (trimmedLine.startsWith('/')) {
      const command = trimmedLine.toLowerCase();

      if (command === '/exit' || command === '/quit') {
        break;
      }

      if (command === '/clear') {
        console.clear();
        logger.header(`💬 CodeMin Chat — Modelo: ${model}`);
        logger.info('  Comandos: /exit (sair)  /clear (limpar)  /help (ajuda)\n');
        history.length = 1; // Keep only system prompt
        rl.prompt();
        continue;
      }

      if (command === '/help') {
        console.log('');
        logger.info('📖 Comandos disponíveis:');
        logger.info('  /exit    — Sair do chat');
        logger.info('  /clear   — Limpar histórico da conversa');
        logger.info('  /help    — Mostrar esta ajuda');
        console.log('');
        logger.info('💡 Dicas:');
        logger.info('  • Digite "/generate <descrição>" para gerar código');
        logger.info('  • Digite "/explain <código>" para explicar um trecho');
        logger.info('  • Use Shift+Enter para digitar mensagens com várias linhas');
        console.log('');
        rl.prompt();
        continue;
      }

      // Handle /generate command
      if (command.startsWith('/generate ')) {
        const description = trimmedLine.slice('/generate '.length);
        const prompt = buildGeneratePrompt(description);
        await processUserInput(model, prompt, history, useStream);
        rl.prompt();
        continue;
      }

      // Handle /explain command
      if (command.startsWith('/explain ')) {
        const codeToExplain = trimmedLine.slice('/explain '.length);
        const prompt = buildExplainPrompt(codeToExplain);
        await processUserInput(model, prompt, history, useStream);
        rl.prompt();
        continue;
      }

      logger.warn(`Comando desconhecido: ${command}`);
      logger.info('Digite /help para ver os comandos disponíveis.');
      rl.prompt();
      continue;
    }

    // Handle multi-line input (accumulate if has more)
    multiLineBuffer = multiLineBuffer ? `${multiLineBuffer}\n${trimmedLine}` : trimmedLine;

    // Check if user pressed Enter with more lines
    // Simple heuristic: if the line ends with a code block start or incomplete statement
    if (trimmedLine.endsWith('```') || trimmedLine.endsWith('{') || trimmedLine.endsWith('(')) {
      continue; // Continue accumulating
    }

    // For single lines, process immediately
    if (!multiLineBuffer.includes('\n')) {
      const inputToProcess = multiLineBuffer;
      multiLineBuffer = '';
      await processUserInput(model, inputToProcess, history, useStream);
    }

    rl.prompt();
  }

  rl.close();
  console.log(chalk.yellow('\nChat encerrado. Até logo!\n'));
}

async function processUserInput(
  model: string,
  input: string,
  history: ChatSessionMessage[],
  useStream: boolean
): Promise<void> {
  history.push({ role: 'user', content: input });

  try {
    if (useStream) {
      process.stdout.write(chalk.green('\n  CodeMin: '));

      let fullResponse = '';
      const stream = ollamaClient.generateStream(
        model,
        history, // includes the user message just pushed above
        { temperature: 0.2, maxTokens: 4096 }
      );

      for await (const chunk of stream) {
        fullResponse += chunk;
        process.stdout.write(chalk.white(chunk));
      }

      history.push({ role: 'assistant', content: fullResponse });
      console.log('\n');
    } else {
      process.stdout.write(chalk.green('\n  CodeMin: '));
      const response = await ollamaClient.chat(model, history, {
        temperature: 0.2,
        maxTokens: 4096,
      });
      console.log(chalk.white(response));
      console.log('');
      history.push({ role: 'assistant', content: response });
    }
  } catch (error) {
    logger.error(`\n  Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

function buildGeneratePrompt(description: string): string {
  return `Gere código para a seguinte tarefa. Retorne APENAS o código, sem explicações extras, a menos que solicitado.

Tarefa: ${description}

Código:`;
}

function buildExplainPrompt(code: string): string {
  return `Explique o seguinte código de forma didática. Identifique o propósito, algoritmos usados, complexidade de tempo/espaço e padrões empregados.

\`\`\`
${code}
\`\`\`

Explique:`;
}
