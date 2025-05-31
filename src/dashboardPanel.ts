import * as vscode from 'vscode';

export function createEcoDebuggerDashboard(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'ecoDebuggerDashboard',
    'EcoDebugger Dashboard',
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  const mockState = {
    ecoTips: [
      {
        issue: "Loop Inefficiency",
        suggestion: "Use list comprehension instead of traditional for-loops when filtering data.",
        snippet: "filtered = [x for x in items if x > 0]"
      }, 
      {
        issue: "Redundant Computation",
        suggestion: "Store repeated calculations in a variable to save CPU cycles.",
        snippet: "result = expensive_call()\nif result > 10:\n    print(result)"
      },
      {
        issue: "Unnecessary Imports",
        suggestion: "Remove unused imports to reduce load time and memory usage.",
        snippet: "# Removed: import pandas as pd"
      }
    ]
  };

  panel.webview.html = getWebviewContent(mockState);

  panel.webview.onDidReceiveMessage(message => {
    if (message.command === 'copySnippet') {
      vscode.env.clipboard.writeText(message.snippet);
      vscode.window.showInformationMessage('✅ Snippet copied!');
    } else if (message.command === 'replaceCode') {
      vscode.window.showInformationMessage(`🔄 Replace with:\n${message.snippet}`);
    }
  });
}

function getWebviewContent(state: any): string {
  const ecoTipsHtml = state.ecoTips.map((tip: any, i: number) => `
    <div class="card bg-white p-5 rounded-2xl shadow-md transform transition duration-300 hover:scale-105 animate-fade-in delay-${i * 100}">
      <h3 class="text-xl font-bold text-green-700 mb-2">${tip.issue}</h3>
      <p class="text-gray-700">${tip.suggestion}</p>
      <pre class="bg-gray-100 p-3 mt-2 rounded text-sm text-black"><code>${tip.snippet}</code></pre>
      <div class="mt-3 flex gap-3">
        <button class="btn-copy" onclick="copySnippet(\`${tip.snippet}\`)">📋 Copy</button>
        <button class="btn-replace" onclick="replaceCode(\`${tip.snippet}\`)">🔄 Replace</button>
      </div>
    </div>
  `).join('');

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EcoDebugger Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in {
        animation: fadeIn 0.5s ease-out forwards;
      }
      .btn-copy, .btn-replace {
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        color: white;
        font-weight: 600;
        transition: background-color 0.3s ease;
      }
      .btn-copy {
        background-color: #3b82f6;
      }
      .btn-copy:hover {
        background-color: #2563eb;
      }
      .btn-replace {
        background-color: #10b981;
      }
      .btn-replace:hover {
        background-color: #059669;
      }
    </style>
  </head>
  <body class="bg-gray-50 text-gray-800 p-6">
    <h1 class="text-3xl font-bold mb-6 text-green-800">🌱 EcoDebugger Dashboard</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      ${ecoTipsHtml}
    </div>
    <script>
      const vscode = acquireVsCodeApi();
      function copySnippet(snippet) {
        vscode.postMessage({ command: 'copySnippet', snippet });
      }
      function replaceCode(snippet) {
        vscode.postMessage({ command: 'replaceCode', snippet });
      }
    </script>
  </body>
  </html>
  `;
}
