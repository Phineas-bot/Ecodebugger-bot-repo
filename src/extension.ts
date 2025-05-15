// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// Variables to track XP, level, and achievements 
let xp = 0;
let level = 1;
let statusBarItem: vscode.StatusBarItem;
const achievements: { [key: string]: boolean } = {};
let debounceTimer: NodeJS.Timeout | undefined;

// Calculate the XP needed for the next level
function xpForNextLevel(level: number): number {
    return level * 100;
}

// Update the status bar
function updateStatusBar() {
    if (statusBarItem) {
        statusBarItem.text = `$(star) Level: ${level} | XP: ${xp}/${xpForNextLevel(level)}`;
        statusBarItem.show();
    }
}

// to check and unlock achievements
function checkAchievements() {
    if (!achievements['First 100 XP'] && xp >= 100) {
        achievements['First 100 XP'] = true;
        vscode.window.showInformationMessage('🎉 Achievement Unlocked: First 100 XP!');
    }

    if (!achievements['Level 5'] && level >= 5) {
        achievements['Level 5'] = true;
        vscode.window.showInformationMessage('🎉 Achievement Unlocked: Level 5!');
    }
}

// this is the Reusable function to detect nested loops
function detectNestedLoops(text: string): boolean {
    const nestedLoopPattern = /for\s*\(.*\)\s*{[^{}]*for\s*\(.*\)/;
    return nestedLoopPattern.test(text);
}

// to Analyze the active editor's code and provide eco tips notably .py .ts .js files only 
function provideEcoTips() {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showInformationMessage('No active editor found. Open a file to analyze.');
        return;
    }

    const text = editor.document.getText();

    if (detectNestedLoops(text)) {
        vscode.window.showWarningMessage(
            '⚡ Eco Tip: Avoid nested loops when possible. Consider using more efficient algorithms or data structures.'
        );
    } else {
        vscode.window.showInformationMessage('✅ Your code looks eco-friendly!');
    }
}

// to check for bugs in the active editor 
function checkForBugs(): boolean {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showInformationMessage('No active editor found. Open a file to analyze.');
        return false;
    }

    const text = editor.document.getText();

    if (detectNestedLoops(text)) {
        vscode.window.showWarningMessage(
            '⚡ Eco Tip: Avoid nested loops when possible. Consider using more efficient algorithms or data structures.'
        );
        return true; // Bug detected
    }

    vscode.window.showInformationMessage('✅ No bugs detected in your code!');
    return false; // No bugs detected
}

// Use the debounce logic to analyse the code in real time in editor 
function analyzeCodeInRealTime(event: vscode.TextDocumentChangeEvent) {
    console.log('Document change detected'); // Debug log

    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
            console.log('No active editor found'); // Debug log
            return; // No active editor
        }

        if (event.document.languageId !== 'javascript' && event.document.languageId !== 'python') {
            console.log(`Unsupported file type: ${event.document.languageId}`); // Debug log
            return; // Skip unsupported file types
        }

        console.log('Analyzing document...'); // Debug log
        const text = editor.document.getText();

        // Check for bugs
        if (detectNestedLoops(text)) {
            console.log('Nested loops detected'); // Debug log
            vscode.window.showWarningMessage(
                '⚡ Eco Tip: Avoid nested loops when possible. Consider using more efficient algorithms or data structures.'
            );
        } else {
            console.log('No bugs detected'); // Debug log
            vscode.window.showInformationMessage('✅ Your code looks eco-friendly!');

            // this logic utomatically award XP if no bugs are detected
            xp += 50;

            if (xp >= xpForNextLevel(level)) {
                xp -= xpForNextLevel(level);
                level++;
                vscode.window.showInformationMessage(`🎉 Congratulations! You reached Level ${level}!`);
            }

            checkAchievements();
            updateStatusBar();
        }
    }, 500); // Delay of 500ms
}

// This method is called when the extension is activated 
export function activate(context: vscode.ExtensionContext) {
    // Create a status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);
    updateStatusBar();

    console.log('Congratulations, your extension "Ecodebugger" is now active!');

    // Register the "helloWorld" command
    const helloWorldCommand = vscode.commands.registerCommand('Ecodebugger.helloWorld', () => {
        vscode.window.showInformationMessage('Welcome to EcoDebugger! Start coding clean and green!');
    });
    context.subscriptions.push(helloWorldCommand);

    // Register the "awardXP" command
    const awardXPCommand = vscode.commands.registerCommand('ecoDebugger.awardXP', () => {
        if (checkForBugs()) {
            vscode.window.showInformationMessage('❌ Fix the bugs in your code before earning XP!'); 
            return;
        }

        xp += 50;

        if (xp >= xpForNextLevel(level)) {
            xp -= xpForNextLevel(level);
            level++;
            vscode.window.showInformationMessage(`🎉 Congratulations! You reached Level ${level}!`);
        }

        checkAchievements();
        updateStatusBar();
    });
    context.subscriptions.push(awardXPCommand);

    // Register the "provideEcoTips" command 
    const ecoTipsCommand = vscode.commands.registerCommand('ecoDebugger.provideEcoTips', () => {
        provideEcoTips();
    });
    context.subscriptions.push(ecoTipsCommand);

    // Register the code listener for real-time code analysis
    const realTimeListener = vscode.workspace.onDidChangeTextDocument(analyzeCodeInRealTime);
    context.subscriptions.push(realTimeListener);
}

// This method is called to  return when the  extension is deactivated 
export function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}