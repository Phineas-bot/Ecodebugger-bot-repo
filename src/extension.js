"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const achievements_1 = require("./utils/achievements");
const ecoTips_1 = require("./utils/ecoTips");
const xp_1 = require("./utils/xp");
const statusBar_1 = require("./utils/statusBar");
const bugs_1 = require("./utils/bugs");
let xp = 0;
let level = 1;
let statusBarItem;
let debounceTimer;
function analyzeCodeInRealTime(event) {
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
        if ((0, bugs_1.detectNestedLoops)(text)) {
            vscode.window.showWarningMessage('⚡ Eco Tip: Avoid nested loops when possible. Consider using more efficient algorithms or data structures.');
        }
        else {
            xp += 50;
            if (xp >= (0, xp_1.xpForNextLevel)(level)) {
                xp -= (0, xp_1.xpForNextLevel)(level);
                level++;
                vscode.window.showInformationMessage(`🎉 Congratulations! You reached Level ${level}!`);
            }
            (0, achievements_1.checkAchievements)(xp, level);
            (0, statusBar_1.updateStatusBar)(statusBarItem, xp, level);
        }
    }, 500);
}
function activate(context) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);
    (0, statusBar_1.updateStatusBar)(statusBarItem, xp, level);
    console.log('Congratulations, your extension "Ecodebugger" is now active!');
    const helloWorldCommand = vscode.commands.registerCommand('Ecodebugger.helloWorld', () => {
        vscode.window.showInformationMessage('Welcome to EcoDebugger! Start coding clean and green!');
    });
    context.subscriptions.push(helloWorldCommand);
    const awardXPCommand = vscode.commands.registerCommand('ecoDebugger.awardXP', () => {
        (0, ecoTips_1.provideEcoTips)();
    });
    context.subscriptions.push(awardXPCommand);
    const ecoTipsCommand = vscode.commands.registerCommand('ecoDebugger.provideEcoTips', () => {
        (0, ecoTips_1.provideEcoTips)();
    });
    context.subscriptions.push(ecoTipsCommand);
    const realTimeListener = vscode.workspace.onDidChangeTextDocument(analyzeCodeInRealTime);
    context.subscriptions.push(realTimeListener);
    // New command to open the webview panel
    context.subscriptions.push(vscode.commands.registerCommand('ecodebugger.openPanel', () => {
        // Create and show a new webview panel
        const panel = vscode.window.createWebviewPanel('ecodebugger', // Internal identifier
        'EcoDebugger', // Title of the panel
        vscode.ViewColumn.One, // Editor column to show the panel in
        {
            enableScripts: true, // Allow JavaScript in the webview
            localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))], // Restrict access to media folder
        });
        // Set the HTML content for the webview
        panel.webview.html = getWebviewContent(panel.webview, context.extensionPath);
    }));
}
function getWebviewContent(webview, extensionPath) {
    const mediaPath = vscode.Uri.file(path.join(extensionPath, 'media'));
    const mediaUri = webview.asWebviewUri(mediaPath);
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
            <div id="app"></div>
            <script src="${scriptUri}"></script>
        </body>
        </html>
    `;
}
function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}
//# sourceMappingURL=extension.js.map