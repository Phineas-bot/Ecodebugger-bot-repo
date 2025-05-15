// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
// Variables to track XP, level, and achievements
let xp = 0;
let level = 1;
let statusBarItem: vscode.StatusBarItem;
const achievements: { [key: string]: boolean } = {}; // Track unlocked achievements

//  calculate the XP needed for the next level
function xpForNextLevel(level: number): number {
    return level * 100; // Example: Level 1 → 100 XP, Level 2 → 200 XP, etc.
}

//  update the status bar
function updateStatusBar() {
    if (statusBarItem) {
        statusBarItem.text = `$(star) Level: ${level} | XP: ${xp}/${xpForNextLevel(level)}`;
        statusBarItem.show();
    }
}

//  check and unlock achievements
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

// analyze the active editor's code and provide eco tips
function provideEcoTips() {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showInformationMessage('No active editor found. Open a file to analyze.');
        return;
    }

    const document = editor.document;
    const text = document.getText();

    // Example: Check for nested loops as an inefficient pattern
    const nestedLoopPattern = /for\s*\(.*\)\s*{[^{}]*for\s*\(.*\)/;
    if (nestedLoopPattern.test(text)) {
        vscode.window.showWarningMessage(
            '⚡ Eco Tip: Avoid nested loops when possible. Consider using more efficient algorithms or data structures.'
        );
    } else {
        vscode.window.showInformationMessage('✅ Your code looks eco-friendly!');
    }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // here we create a status bar item @phineas 
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);
    updateStatusBar();

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "Ecodebugger" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const disposable = vscode.commands.registerCommand('Ecodebugger.helloWorld', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage('welcome to eco-debugger start coding clean and green.!');
          const panel = vscode.window.createWebviewPanel(
      'ecoDebugger',
      'Eco Debugger',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
      }
    );

    const htmlPath = path.join(context.extensionPath, 'media', 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    const cssUri = panel.webview.asWebviewUri(vscode.Uri.file(
      path.join(context.extensionPath, 'media', 'style.css')
    ));
    html = html.replace('style.css', cssUri.toString());
    panel.webview.html = html;
    });

    context.subscriptions.push(disposable);

    // here we register the "ecoDebugger.awardXP" command
    const awardXPCommand = vscode.commands.registerCommand('ecoDebugger.awardXP', () => {
        // Award 50 XP
        xp += 50;

        // Check if the user leveled up
        if (xp >= xpForNextLevel(level)) {
            xp -= xpForNextLevel(level); // Carry over extra XP
            level++;
            vscode.window.showInformationMessage(`Congratulations! You reached Level ${level}!`);
        }

        // Check for achievements
        checkAchievements();

        // Update the status bar
        updateStatusBar();
    });

    context.subscriptions.push(awardXPCommand);

    // Register the "ecoDebugger.provideEcoTips" command
    const ecoTipsCommand = vscode.commands.registerCommand('ecoDebugger.provideEcoTips', () => {
        provideEcoTips();
    });

    context.subscriptions.push(ecoTipsCommand);


    
}

// The following method is called when your extension is deactivated 
export function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}

//@phineas baby coder