import * as vscode from 'vscode';
import { checkAchievements } from './utils/achievements';
import { provideEcoTips } from './utils/ecoTips';
import { xpForNextLevel } from './utils/xp';
import { updateStatusBar } from './utils/statusBar';
import { detectNestedLoops, detectUnusedVariables } from './utils/bugs';
import { createEcoDebuggerDashboard } from './dashboardPanel';
import { getEcoDebuggerWebviewContent } from './utils/webviewContent';

// Gamified XP system
let xp = 0;
let level = 1;
let xpLog: string[] = [];
let statusBarItem: vscode.StatusBarItem;
let debounceTimer: NodeJS.Timeout | undefined;

let ecoTipsEnabled = true;
let classroom = {
    code: 'ABC123',
    leaderboard: [
        { name: 'Victory-1', xp: 200 },
        { name: 'Maria', xp: 120 }
    ],
    weeklyTop: 'Victory-1'
};

// Central XP awarder
function gainXP(amount: number, reason: string) {
    xp += amount;
    xpLog.push(`+${amount} XP for ${reason} (${new Date().toLocaleTimeString()})`);

    while (xp >= xpForNextLevel(level)) {
        xp -= xpForNextLevel(level);
        level++;
        vscode.window.showInformationMessage(`🎉 Congratulations! You reached Level ${level}!`);
    }

    checkAchievements(xp, level);
    updateStatusBar(statusBarItem, xp, level);
}

let lastBugState = { nestedLoops: false, unusedVars: false };

// Real-time code analysis
function analyzeCodeInRealTime(event: vscode.TextDocumentChangeEvent): void {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const text = editor.document.getText();

        // Detect bugs in current text
        const hasNestedLoops = detectNestedLoops(text);
        const hasUnusedVars = detectUnusedVariables(text);

        // Give feedback if issues are detected
        if (hasNestedLoops && !lastBugState.nestedLoops) {
            vscode.window.showWarningMessage('EcoDebugger: Nested loops detected! Consider refactoring for efficiency.');
        }
        if (hasUnusedVars && !lastBugState.unusedVars) {
            vscode.window.showWarningMessage('EcoDebugger: Unused variable detected! Remove it for cleaner code.');
        }

        // Award XP only if a bug or unused variable was fixed
        if ((lastBugState.nestedLoops && !hasNestedLoops) || (lastBugState.unusedVars && !hasUnusedVars)) {
            gainXP(10, 'fixing a bug or removing unused variable');
        }

        // Update last bug state
        lastBugState = { nestedLoops: hasNestedLoops, unusedVars: hasUnusedVars };
    }, 500);
}

// VS Code Extension Entry
export function activate(context: vscode.ExtensionContext): void {
    // Setup status bar
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'ecoDebugger.openUI';
    statusBarItem.tooltip = 'Open EcoDebugger Panel';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    updateStatusBar(statusBarItem, xp, level);

    console.log('🎉 EcoDebugger is now active!');

    // Welcome command
    context.subscriptions.push(
        vscode.commands.registerCommand('Ecodebugger.helloWorld', () => {
            vscode.window.showInformationMessage('Welcome to EcoDebugger! Start coding clean and green!');
        })
    );

    // Webview state builder
    const getState = () => ({
        xp,
        level,
        xpLog,
        ecoTips: [
            { tip: 'This loop wastes CPU → try map()!' },
            { tip: 'Use list comprehensions for efficiency.' }
        ],
        achievements: [
            { name: 'Green Coder', unlocked: true, icon: '🌱', description: 'Apply 10 eco tips.' },
            { name: 'Bug Slayer', unlocked: true, icon: '🪲', description: 'Fix 20 bugs.' },
            { name: 'Efficient Thinker', unlocked: false, icon: '⚡', description: 'Reach 500 XP.' },
            { name: 'Team Leader', unlocked: false, icon: '👑', description: 'Top leaderboard in classroom mode.' },
            { name: 'XP Novice', unlocked: true, icon: '⭐', description: 'Earn your first XP.' },
            { name: 'Eco Streak', unlocked: false, icon: '🔥', description: 'Apply eco tips 5 times in a row.' }
        ],
        leaderboard: classroom.leaderboard,
        classroom,
        ecoTipsEnabled
    });

    // Main Panel Command
    context.subscriptions.push(
        vscode.commands.registerCommand('ecoDebugger.openUI', () => {
            const panel = vscode.window.createWebviewPanel(
                'ecoDebuggerUI',
                'EcoDebugger',
                vscode.ViewColumn.One,
                { enableScripts: true, retainContextWhenHidden: true }
            );
            panel.webview.html = getEcoDebuggerWebviewContent(getState());

            panel.webview.onDidReceiveMessage(
                (message) => {
                    if (message.command === 'fixBug') {
                        gainXP(10, 'fixing a bug');
                        panel.webview.postMessage({ command: 'bugFixed', bugsFixed: message.bugsFixed });
                    }
                },
                undefined,
                context.subscriptions
            );
        })
    );

    // XP award command for eco tips
    context.subscriptions.push(
        vscode.commands.registerCommand('ecoDebugger.awardXP', () => {
            provideEcoTips();
            gainXP(5, 'applying an eco tip');
        })
    );

    // Eco tips viewer command
    context.subscriptions.push(
        vscode.commands.registerCommand('ecoDebugger.showEcoTips', (suggestions: any[]) => {
            const panel = vscode.window.createWebviewPanel(
                'ecoDebuggerUI',
                'EcoDebugger - Tips',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );
            panel.webview.html = getEcoDebuggerWebviewContent({
                ...getState(),
                ecoTips: suggestions
            });
        })
    );

    // Code tracking for XP on replace
    context.subscriptions.push(
        vscode.commands.registerCommand('ecoDebugger.trackReplace', () => {
            gainXP(10, 'replacing code');
        })
    );

    // Show dashboard panel
    context.subscriptions.push(
        vscode.commands.registerCommand('ecoDebugger.showDashboard', () => {
            createEcoDebuggerDashboard(context); // You can enhance it with getState()
        })
    );

    // Auto-show panel on activation
    vscode.commands.executeCommand('ecoDebugger.openUI');

    // Realtime listener
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(analyzeCodeInRealTime)
    );

    // Save listener for eco tips
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument((doc) => {
            if (ecoTipsEnabled && ['javascript', 'typescript', 'python'].includes(doc.languageId)) {
                provideEcoTips();
                gainXP(5, 'applying an eco tip on save');
            }
        })
    );
}

// Cleanup
export function deactivate(): void {
    statusBarItem?.dispose();
}
