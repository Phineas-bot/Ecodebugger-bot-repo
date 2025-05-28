import * as vscode from 'vscode';

export function createEcoDebuggerDashboard(context: vscode.ExtensionContext, state: any) {
    const panel = vscode.window.createWebviewPanel(
        'ecoDebuggerDashboard',
        'EcoDebugger Dashboard',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
        }
    );

    panel.webview.html = getWebviewContent(state);

    panel.webview.onDidReceiveMessage(message => {
        if (message.command === 'replaceCode') {
            vscode.window.showInformationMessage(`Replace code: ${message.snippet}`);
        } else if (message.command === 'copySnippet') {
            vscode.env.clipboard.writeText(message.snippet);
            vscode.window.showInformationMessage('Snippet copied to clipboard!');
        }
    });
}

function getWebviewContent(state: any): string {
    const ecoTipsHtml = state.ecoTips.map((tip: any) => `
        <div class="card bg-white p-4 rounded-xl shadow-md">
            <h3 class="text-lg font-semibold">${tip.issue}</h3>
            <p>${tip.suggestion}</p>
            <div class="mt-2">
                <button class="px-4 py-2 bg-blue-500 text-white rounded" onclick="copySnippet('${tip.snippet}')">Copy Snippet</button>
                <button class="px-4 py-2 bg-green-500 text-white rounded" onclick="replaceCode('${tip.snippet}')">Replace in File</button>
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
            body {
                font-family: Arial, sans-serif;
                background-color: #f9fafb;
                color: #111827;
            }
            .card {
                transition: transform 0.3s, opacity 0.3s;
            }
            .card:hover {
                transform: scale(1.05);
                opacity: 0.9;
            }
        </style>
    </head>
    <body class="p-4">
        <h1 class="text-2xl font-bold mb-4">EcoDebugger: Greener Code Starts Here 🌱</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
