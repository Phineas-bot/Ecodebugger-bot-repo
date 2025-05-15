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

    const helloWorldCommand = vscode.commands.registerCommand('Ecodebugger.helloWorld', () => {
        vscode.window.showInformationMessage('Welcome to EcoDebugger! Start coding clean and green!');
    });
    context.subscriptions.push(helloWorldCommand);

    const awardXPCommand = vscode.commands.registerCommand('ecoDebugger.awardXP', () => {
        provideEcoTips();
    });
    context.subscriptions.push(awardXPCommand);

    const ecoTipsCommand = vscode.commands.registerCommand('ecoDebugger.provideEcoTips', () => {
        provideEcoTips();
    });
    context.subscriptions.push(ecoTipsCommand);

    const realTimeListener = vscode.workspace.onDidChangeTextDocument(analyzeCodeInRealTime);
    context.subscriptions.push(realTimeListener);
}

export function deactivate(): void {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}