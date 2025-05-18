import * as vscode from 'vscode';
import { checkAchievements } from './utils/achievements';
import { provideEcoTips } from './utils/ecoTips';
import { xpForNextLevel } from './utils/xp';
import { updateStatusBar } from './utils/statusBar';
import { detectNestedLoops } from './utils/bugs';

let xp = 0;
let level = 1;
let statusBarItem: vscode.StatusBarItem;
let debounceTimer: NodeJS.Timeout | undefined;

function analyzeCodeInRealTime(event: vscode.TextDocumentChangeEvent): void {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
            console.log('No active editor found');
            return;
        }

        const text = editor.document.getText();

        if (detectNestedLoops(text)) {
            vscode.window.showWarningMessage(
                '⚡ Eco Tip: Avoid nested loops when possible. Consider using more efficient algorithms or data structures.'
            );
        } else {
            xp += 50;

            if (xp >= xpForNextLevel(level)) {
                xp -= xpForNextLevel(level);
                level++;
                vscode.window.showInformationMessage(`🎉 Congratulations! You reached Level ${level}!`);
            }

            checkAchievements(xp, level);
            updateStatusBar(statusBarItem, xp, level);
        }
    }, 500);
}

export function activate(context: vscode.ExtensionContext): void {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);
    updateStatusBar(statusBarItem, xp, level);

    console.log('Congratulations, your extension "Ecodebugger" is now active!');

    context.subscriptions.push(
        vscode.commands.registerCommand('Ecodebugger.helloWorld', () => {
            vscode.window.showInformationMessage('Welcome to EcoDebugger! Start coding clean and green!');
        }),

        vscode.commands.registerCommand('ecoDebugger.awardXP', () => {
            provideEcoTips();
        }),

        vscode.commands.registerCommand('ecoDebugger.provideEcoTips', () => {
            provideEcoTips();
        }),

        vscode.commands.registerCommand('ecoDebugger.showUI', () => {
            const panel = vscode.window.createWebviewPanel(
                'ecoDebuggerUI',
                'Eco Debugger',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')],
                }
            );

            panel.webview.html = getWebviewContent(panel.webview, context);
        }),

        vscode.workspace.onDidChangeTextDocument(analyzeCodeInRealTime)
    );
}

function getWebviewContent(webview: vscode.Webview, context: vscode.ExtensionContext): string {
    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'style.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'main.js'));
    const htmlPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'index.html');

    const fs = require('fs');
    let html = fs.readFileSync(htmlPath.fsPath, 'utf8');

    // Replace local CSS/script links with VS Code-compatible URIs
    html = html.replace('style.css', cssUri.toString());
    html = html.replace('main.js', scriptUri.toString());

    return html;
}

export function deactivate(): void {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}
