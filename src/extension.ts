import * as vscode from 'vscode';
import * as path from 'path';
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

    // Register the webview view provider
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('ecodebuggerView', new EcoDebuggerViewProvider(context))
    );
}

class EcoDebuggerViewProvider implements vscode.WebviewViewProvider {
    private readonly context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    resolveWebviewView(webviewView: vscode.WebviewView): void {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'media'))],
        };

        webviewView.webview.html = getWebviewContent(webviewView.webview, this.context.extensionPath);
    }
}

function getWebviewContent(webview: vscode.Webview, extensionPath: string): string {
    const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'media', 'style.css')));
    const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'out', 'main.js')));

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>EcoDebugger</title>
            <link rel="stylesheet" href="${styleUri}">
        </head>
        <body>
            <div class="sidebar">
                <div class="level-box">
                    <span class="level">Level <span id="level">1</span></span>
                    <span class="xp"><span id="current-xp">0</span> XP</span>
                    <div class="progress-bar">
                        <div id="progress-fill" style="width: 60%;"></div>
                    </div>
                </div>

                <h4>Eco Tips</h4>
                <div class="eco-tip">
                    <p id="analysis-text">🌱 This loop wastes CPU → try map()</p>
                    <p class="carbon">Et: 0.4 g</p>
                    <button id="copy-code-btn">Copy Selected Code</button>
                </div>

                <h4>Achievements</h4>
                <div class="achievements">
                    <button id="green-coder">✅ Green Coder</button>
                    <button id="bug-slayer">🚫 Bug Slayer</button>
                </div>

                <div id="achievement-modal" class="modal hidden">
                    <div class="modal-content">
                        <span id="close-modal">&times;</span>
                        <h3 id="achievement-title"></h3>
                        <p id="achievement-description"></p>
                    </div>
                </div>

                <h4>Classroom Mode</h4>
                <div class="classroom">
                    <ul id="player-list"></ul>
                </div>
            </div>
            <script src="${scriptUri}"></script>
        </body>
        </html>
    `;
}

export function deactivate(): void {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}