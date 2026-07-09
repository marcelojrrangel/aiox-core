import * as vscode from 'vscode';

const OLLAMA_API_BASE = 'http://localhost:11434';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function activate(context: vscode.ExtensionContext): void {
  console.log('CodeMin extension activating...');

  // Register commands
  const chatCommand = vscode.commands.registerCommand('codemin.chat', () => {
    ChatPanel.createOrShow(context.extensionUri);
  });

  const explainCommand = vscode.commands.registerCommand('codemin.explain', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('Nenhum editor ativo. Selecione um código primeiro.');
      return;
    }

    const selection = editor.selection;
    const text = editor.document.getText(selection);
    if (!text) {
      vscode.window.showErrorMessage('Selecione um trecho de código para explicar.');
      return;
    }

    await explainCode(text);
  });

  const reviewCommand = vscode.commands.registerCommand('codemin.review', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('Nenhum editor ativo.');
      return;
    }

    const selection = editor.selection;
    const text = editor.document.getText(selection);
    if (!text) {
      vscode.window.showErrorMessage('Selecione um trecho de código para revisar.');
      return;
    }

    await reviewCode(text);
  });

  const generateTestsCommand = vscode.commands.registerCommand('codemin.generateTests', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('Nenhum editor ativo.');
      return;
    }

    const selection = editor.selection;
    const text = editor.document.getText(selection);
    if (!text) {
      vscode.window.showErrorMessage('Selecione um trecho de código para gerar testes.');
      return;
    }

    await generateTests(text);
  });

  const statusCommand = vscode.commands.registerCommand('codemin.status', async () => {
    await showCodeMinStatus();
  });

  context.subscriptions.push(
    chatCommand,
    explainCommand,
    reviewCommand,
    generateTestsCommand,
    statusCommand
  );

  // Register sidebar webview provider
  const provider = new ChatSidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('codemin.chatView', provider)
  );

  // Status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(codicon) CodeMin';
  statusBarItem.command = 'codemin.status';
  statusBarItem.tooltip = 'CodeMin: Clique para ver status';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Check CodeMin CLI availability
  checkCliAvailability();
}

export function deactivate(): void {
  // Cleanup
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

class ChatPanel {
  public static currentPanel: ChatPanel | undefined;
  private static readonly viewType = 'codeminChat';
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _messages: ChatMessage[] = [
    { role: 'system', content: 'Você é CodeMin, um assistente de codificação especializado. Ajude o usuário com código.' },
  ];

  public static createOrShow(extensionUri: vscode.Uri): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (ChatPanel.currentPanel) {
      ChatPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      ChatPanel.viewType,
      'CodeMin Chat',
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    ChatPanel.currentPanel = new ChatPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._update();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.onDidReceiveMessage(
      async (message: { type: string; text?: string }) => {
        if (message.type === 'sendMessage' && message.text) {
          await this._handleUserMessage(message.text);
        }
      },
      null,
      this._disposables
    );
  }

  private _update(): void {
    this._panel.webview.html = this._getHtmlForWebview();
  }

  private async _handleUserMessage(text: string): Promise<void> {
    this._messages.push({ role: 'user', content: text });

    try {
      const model = await getActiveModel();
      const response = await fetch(`${OLLAMA_API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || 'qwen2.5-coder:7b',
          messages: this._messages,
          stream: false,
          options: { temperature: 0.2, num_predict: 4096 },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as { message?: { content: string } };
      const reply = data.message?.content ?? 'Sem resposta do modelo.';

      this._messages.push({ role: 'assistant', content: reply });
      this._panel.webview.postMessage({
        type: 'addResponse',
        text: reply,
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      this._panel.webview.postMessage({
        type: 'addResponse',
        text: `❌ Erro: ${errMsg}\n\nVerifique se o Ollama está rodando.`,
      });
    }
  }

  private _getHtmlForWebview(): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 10px; }
    #messages { height: 70vh; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 4px; }
    .message { margin-bottom: 8px; padding: 6px 8px; border-radius: 4px; }
    .user { background: #e3f2fd; text-align: right; }
    .assistant { background: #f5f5f5; }
    .system { background: #fff3e0; font-style: italic; }
    #input-area { display: flex; gap: 8px; }
    #input { flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
    #send { padding: 8px 16px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer; }
    #send:hover { background: #005a9e; }
    .error { color: #d32f2f; }
    pre { background: #f5f5f5; padding: 8px; border-radius: 4px; overflow-x: auto; }
    code { font-size: 13px; }
  </style>
</head>
<body>
  <div id="messages"></div>
  <div id="input-area">
    <textarea id="input" rows="2" placeholder="Digite sua mensagem..." style="flex:1;padding:8px;border:1px solid #ccc;border-radius:4px;resize:none;"></textarea>
    <button id="send" onclick="sendMessage()">Enviar</button>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    const messagesDiv = document.getElementById('messages');
    const input = document.getElementById('input');

    function sendMessage() {
      const text = input.value.trim();
      if (!text) return;
      
      const msgDiv = document.createElement('div');
      msgDiv.className = 'message user';
      msgDiv.textContent = text;
      messagesDiv.appendChild(msgDiv);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
      
      vscode.postMessage({ type: 'sendMessage', text });
      input.value = '';
    }

    window.addEventListener('message', event => {
      const message = event.data;
      if (message.type === 'addResponse') {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message assistant';
        msgDiv.innerHTML = message.text.replace(/\\n/g, '<br>').replace(/$(.*?)$/gm, '<pre><code>$1</code></pre>');
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  </script>
</body>
</html>`;
  }

  public dispose(): void {
    ChatPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) d.dispose();
    }
  }
}

// ─── Chat Sidebar Provider ────────────────────────────────────────────────────

class ChatSidebarProvider implements vscode.WebviewViewProvider {
  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this._getHtml();
  }

  private _getHtml(): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    body { padding: 8px; font-family: -apple-system, sans-serif; }
    h3 { margin: 0 0 8px 0; font-size: 14px; }
    .status { padding: 8px; background: #f5f5f5; border-radius: 4px; margin-bottom: 8px; font-size: 12px; }
    .status-item { margin: 4px 0; }
    .ok { color: #2e7d32; }
    .error { color: #d32f2f; }
    .warn { color: #f57f17; }
    .btn { display: block; width: 100%; padding: 6px; margin: 4px 0; background: #0078d4; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; }
    .btn:hover { background: #005a9e; }
  </style>
</head>
<body>
  <h3>CodeMin</h3>
  <div class="status">
    <div class="status-item" id="ollama-status">⟳ Verificando Ollama...</div>
    <div class="status-item" id="model-status">⟳ Verificando modelo...</div>
  </div>
  <button class="btn" onclick="vscode.postMessage({type:'chat'})">💬 Abrir Chat</button>
  <button class="btn" onclick="vscode.postMessage({type:'status'})">⟳ Atualizar Status</button>
  <script>
    const vscode = acquireVsCodeApi();
    async function checkStatus() {
      try {
        const resp = await fetch('http://localhost:11434/api/tags');
        const data = await resp.json();
        document.getElementById('ollama-status').innerHTML = '✅ Ollama: Online';
        document.getElementById('ollama-status').className = 'status-item ok';
        const models = (data.models || []).map(m => m.name).join(', ');
        document.getElementById('model-status').innerHTML = '📦 Modelos: ' + (models || 'Nenhum');
        document.getElementById('model-status').className = 'status-item ok';
      } catch {
        document.getElementById('ollama-status').innerHTML = '❌ Ollama: Offline';
        document.getElementById('ollama-status').className = 'status-item error';
        document.getElementById('model-status').innerHTML = '❌ Modelo: Não disponível';
        document.getElementById('model-status').className = 'status-item error';
      }
    }
    checkStatus();
    setInterval(checkStatus, 30000);
  </script>
</body>
</html>`;
  }
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

async function getActiveModel(): Promise<string | null> {
  try {
    const resp = await fetch(`${OLLAMA_API_BASE}/api/tags`);
    const data = (await resp.json()) as { models?: { name: string }[] };
    const models = data.models ?? [];
    if (models.length === 0) return null;

    // Prefer qwen2.5-coder:7b, then first available
    const preferred = models.find((m) => m.name.includes('qwen2.5-coder'));
    return preferred?.name ?? models[0]?.name ?? null;
  } catch {
    return null;
  }
}

async function explainCode(code: string): Promise<void> {
  const model = await getActiveModel();
  if (!model) {
    vscode.window.showErrorMessage('Nenhum modelo disponível. Execute "codemin install" no terminal.');
    return;
  }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'CodeMin: Explicando código...' },
    async () => {
      try {
        const response = await fetch(`${OLLAMA_API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: 'Você é um especialista em explicar código. Seja didático, mencione propósito, algoritmos, complexidade e padrões.' },
              { role: 'user', content: `Explique o seguinte código:\n\n\`\`\`\n${code}\n\`\`\`` },
            ],
            stream: false,
            options: { temperature: 0.2, num_predict: 2048 },
          }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = (await response.json()) as { message?: { content: string } };
        const explanation = data.message?.content ?? 'Não foi possível gerar explicação.';

        const doc = await vscode.workspace.openTextDocument({
          content: `# CodeMin — Explicação\n\n${explanation}`,
          language: 'markdown',
        });
        await vscode.window.showTextDocument(doc, { preview: true });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro desconhecido';
        vscode.window.showErrorMessage(`Erro: ${msg}`);
      }
    }
  );
}

async function reviewCode(code: string): Promise<void> {
  const model = await getActiveModel();
  if (!model) {
    vscode.window.showErrorMessage('Nenhum modelo disponível.');
    return;
  }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'CodeMin: Revisando código...' },
    async () => {
      try {
        const response = await fetch(`${OLLAMA_API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: 'Você é um revisor de código. Analise segurança, performance, boas práticas e sugira melhorias.' },
              { role: 'user', content: `Revise o código:\n\n\`\`\`\n${code}\n\`\`\`` },
            ],
            stream: false,
            options: { temperature: 0.1, num_predict: 4096 },
          }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = (await response.json()) as { message?: { content: string } };
        const review = data.message?.content ?? 'Não foi possível gerar revisão.';

        const doc = await vscode.workspace.openTextDocument({
          content: `# CodeMin — Code Review\n\n${review}`,
          language: 'markdown',
        });
        await vscode.window.showTextDocument(doc, { preview: true });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro desconhecido';
        vscode.window.showErrorMessage(`Erro: ${msg}`);
      }
    }
  );
}

async function generateTests(code: string): Promise<void> {
  const model = await getActiveModel();
  if (!model) {
    vscode.window.showErrorMessage('Nenhum modelo disponível.');
    return;
  }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'CodeMin: Gerando testes...' },
    async () => {
      try {
        const response = await fetch(`${OLLAMA_API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: 'Você é um especialista em testes. Gere testes unitários com cobertura de happy path, edge cases e erros.' },
              { role: 'user', content: `Gere testes para:\n\n\`\`\`\n${code}\n\`\`\`` },
            ],
            stream: false,
            options: { temperature: 0.2, num_predict: 4096 },
          }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = (await response.json()) as { message?: { content: string } };
        const tests = data.message?.content ?? 'Não foi possível gerar testes.';

        const doc = await vscode.workspace.openTextDocument({
          content: tests,
          language: vscode.window.activeTextEditor?.document.languageId ?? 'typescript',
        });
        await vscode.window.showTextDocument(doc, { preview: false });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro desconhecido';
        vscode.window.showErrorMessage(`Erro: ${msg}`);
      }
    }
  );
}

async function showCodeMinStatus(): Promise<void> {
  try {
    const ollamaResp = await fetch(`${OLLAMA_API_BASE}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!ollamaResp.ok) throw new Error('Ollama offline');

    const data = (await ollamaResp.json()) as { models?: { name: string; size: number }[] };
    const models = data.models ?? [];

    let statusMsg = '✅ **CodeMin — Status**\n\n';
    statusMsg += '**Ollama**: Online ✅\n';

    if (models.length === 0) {
      statusMsg += '**Modelos**: Nenhum instalado ❌\n';
      statusMsg += '\nExecute `codemin install` no terminal para baixar o modelo.';
    } else {
      statusMsg += `**Modelos instalados**: ${models.length}\n`;
      for (const m of models) {
        const sizeGB = (m.size / (1024 * 1024 * 1024)).toFixed(1);
        statusMsg += `- ${m.name} (${sizeGB} GB)\n`;
      }
    }

    const doc = await vscode.workspace.openTextDocument({
      content: statusMsg,
      language: 'markdown',
    });
    await vscode.window.showTextDocument(doc, { preview: true });
  } catch {
    const doc = await vscode.workspace.openTextDocument({
      content: '❌ **CodeMin — Status**\n\n**Ollama**: Offline ❌\n\nVerifique se o Ollama está rodando:\n1. Abra um terminal\n2. Execute `ollama serve`\n3. Execute `codemin install`',
      language: 'markdown',
    });
    await vscode.window.showTextDocument(doc, { preview: true });
  }
}

async function checkCliAvailability(): Promise<void> {
  try {
    const { execFile } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const exec = promisify(execFile);
    await exec('codemin', ['--version']);
    console.log('CodeMin CLI detected');
  } catch {
    vscode.window.showWarningMessage(
      'CodeMin CLI não encontrado. Execute "npm install -g codemin" para instalar.',
      'Instalar'
    ).then((selection) => {
      if (selection === 'Instalar') {
        const terminal = vscode.window.createTerminal('CodeMin Install');
        terminal.sendText('npm install -g codemin');
        terminal.show();
      }
    });
  }
}
