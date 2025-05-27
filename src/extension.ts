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
let xpLog: string[] = [];
let classroom = {
    code: 'ABC123',
    leaderboard: [
        { name: 'Victory-1', xp: 200 },
        { name: 'Maria', xp: 120 }
    ],
    weeklyTop: 'Victory-1'
};
let ecoTipsEnabled = true;

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

function awardXP(type: 'bug' | 'ecoTip') {
    if (type === 'bug') {
        xp += 10;
        xpLog.push(`+10 XP for fixing a bug (${new Date().toLocaleTimeString()})`);
    } else if (type === 'ecoTip') {
        xp += 5;
        xpLog.push(`+5 XP for applying an eco tip (${new Date().toLocaleTimeString()})`);
    }
    if (xp >= xpForNextLevel(level)) {
        xp -= xpForNextLevel(level);
        level++;
        vscode.window.showInformationMessage(`🎉 Congratulations! You reached Level ${level}!`);
    }
    checkAchievements(xp, level);
    updateStatusBar(statusBarItem, xp, level);
}

// Add logic to track XP when 'Replace Code in File' is clicked.
function trackReplaceCodeXP() {
    xp += 10; // Assign 10 XP points for replacing code
    xpLog.push(`+10 XP for replacing code (${new Date().toLocaleTimeString()})`);
    if (xp >= xpForNextLevel(level)) {
        xp -= xpForNextLevel(level);
        level++;
        vscode.window.showInformationMessage(`🎉 Congratulations! You reached Level ${level}!`);
    }
    checkAchievements(xp, level);
    updateStatusBar(statusBarItem, xp, level);
}

// Listen for file saves to trigger eco tips
vscode.workspace.onDidSaveTextDocument((doc) => {
    if (ecoTipsEnabled && (doc.languageId === 'javascript' || doc.languageId === 'typescript' || doc.languageId === 'python')) {
        provideEcoTips();
        awardXP('ecoTip');
    }
});

export function activate(context: vscode.ExtensionContext): void {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);
    updateStatusBar(statusBarItem, xp, level);

    // Add a button to the status bar for quick access to the EcoDebugger UI
    statusBarItem.command = 'ecoDebugger.openUI';
    statusBarItem.tooltip = 'Open EcoDebugger Panel';
    statusBarItem.show();

    console.log('Congratulations, your extension "Ecodebugger" is now active!');

    const helloWorldCommand = vscode.commands.registerCommand('Ecodebugger.helloWorld', () => {
        vscode.window.showInformationMessage('Welcome to EcoDebugger! Start coding clean and green!');
    });
    context.subscriptions.push(helloWorldCommand);

    // Add command to open the EcoDebugger Webview UI
    const openEcoDebuggerUI = vscode.commands.registerCommand('ecoDebugger.openUI', () => {
        const panel = vscode.window.createWebviewPanel(
            'ecoDebuggerUI',
            'EcoDebugger',
            vscode.ViewColumn.One, 
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );
        // Initial state
        const state = {
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
        };
        panel.webview.html = getEcoDebuggerWebviewContent(state);

        // Handle messages from the Webview (e.g., for the mini-game)
        panel.webview.onDidReceiveMessage(
            message => {
                if (message.command === 'fixBug') {
                    // Optionally update XP, achievements, etc. here
                    panel.webview.postMessage({ command: 'bugFixed', bugsFixed: message.bugsFixed });
                }
            },
            undefined,
            context.subscriptions
        );
    });
    context.subscriptions.push(openEcoDebuggerUI);

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

    // Register the `ecoDebugger.showEcoTips` command to update the Eco Tips panel.
    const showEcoTipsCommand = vscode.commands.registerCommand('ecoDebugger.showEcoTips', (suggestions: any[]) => {
        const panel = vscode.window.createWebviewPanel(
            'ecoDebuggerUI',
            'EcoDebugger',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getEcoDebuggerWebviewContent({
            ecoTips: suggestions,
            xp,
            level,
            xpLog,
            achievements: [],
            leaderboard: classroom.leaderboard,
            classroom,
            ecoTipsEnabled
        });
    });
    context.subscriptions.push(showEcoTipsCommand);

    // Automatically open the EcoDebugger UI panel on activation
    vscode.commands.executeCommand('ecoDebugger.openUI');
}

export function deactivate(): void {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}

// Helper to provide the Webview HTML (to be replaced with actual UI)
function getEcoDebuggerWebviewContent(state: any): string {
    const escapeHtml = (unsafe: string): string => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const ecoTipsHtml = state.ecoTips.map((s: any) => {
        const issue = escapeHtml(s.issue || "No issue provided");
        const suggestion = escapeHtml(s.suggestion || "No suggestion provided");
        const explanation = escapeHtml(s.explanation || "No explanation provided");
        const snippet = escapeHtml(s.snippet || "");

        return `
            <div class="eco-tip">
                <div class="eco-tip-header">${issue}</div>
                <div class="eco-tip-body" style="display: none;">
                    <p><b>Suggestion:</b> ${suggestion}</p>
                    <p><b>Explanation:</b> ${explanation}</p>
                    <pre>${snippet}</pre>
                    <button class="replace-code">Replace Code</button>
                </div>
            </div>
        `;
    }).join("");

    const achievementsHtml = state.achievements.map((a: any) => `
        <div class="achievement${a.unlocked ? '' : ' locked'}">
            <span class="badge-icon">${a.icon}</span>
            <span>${a.name}${a.unlocked ? '' : ' (locked)'}</span>
            <span style="margin-left:auto;font-size:0.9rem;color:#aaa;">${a.description}</span>
        </div>
    `).join("");

    const leaderboardHtml = state.leaderboard.map((l: any) => `
        <div class="leader">${l.name}: ${l.xp} XP</div>
    `).join("");

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>EcoDebugger</title>
        <style>
            body { font-family: Arial, sans-serif; background: #f4f4f4; color: #333; margin: 0; padding: 0; }
            .container { padding: 20px; }
            .eco-tip, .achievement, .leader { border: 1px solid #ddd; margin-bottom: 10px; padding: 10px; border-radius: 5px; background: #fff; }
            .eco-tip-header { font-weight: bold; cursor: pointer; }
            .eco-tip-body { margin-top: 10px; }
            .achievement.locked { opacity: 0.5; filter: grayscale(1); }
            button { margin-top: 10px; padding: 5px 10px; background: #007acc; color: #fff; border: none; border-radius: 3px; cursor: pointer; }
            .tabs { display: flex; cursor: pointer; margin-bottom: 10px; }
            .tab { flex: 1; padding: 10px; text-align: center; background: #007acc; color: white; border-radius: 3px 3px 0 0; }
            .tab.active { background: #005fa3; }
            [id^="tab-content-"] { display: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="tabs">
                <div class="tab" id="tab-xp">XP/Level</div>
                <div class="tab" id="tab-badges">Achievements</div>
                <div class="tab" id="tab-eco">Eco Tips Log</div>
                <div class="tab" id="tab-leader">Leaderboard</div>
                <div class="tab" id="tab-settings">Settings</div>
            </div>
            <div id="tab-content-xp">
                <div class="level">Level ${state.level}</div>
                <div class="xp">${state.xp} XP</div>
            </div>
            <div id="tab-content-badges" style="display:none;">
                <h3>Achievements</h3>
                ${achievementsHtml || "No achievements yet."}
            </div>
            <div id="tab-content-eco" style="display:none;">
                <h3>Eco Tips Log</h3>
                ${ecoTipsHtml || "No suggestions yet."}
            </div>
            <div id="tab-content-leader" style="display:none;">
                <h3>Leaderboard</h3>
                ${leaderboardHtml || "No leaderboard data available."}
            </div>
            <div id="tab-content-settings" style="display:none;">
                <h3>Settings</h3>
                <label><input type="checkbox" id="eco-tips-toggle" ${state.ecoTipsEnabled ? 'checked' : ''}/> Enable Eco Tips</label>
                <button id="reset-xp">Reset XP/Achievements</button>
            </div>
        </div>
        <script>
            const vscode = acquireVsCodeApi();

            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('[id^="tab-content-"]').forEach(content => content.style.display = 'none');
                    tab.classList.add('active');
                    document.getElementById('tab-content-' + tab.id.split('-')[1]).style.display = 'block';
                });
            });

            document.getElementById('eco-tips-toggle').addEventListener('change', (event) => {
                vscode.postMessage({ command: 'toggleEcoTips', enabled: event.target.checked });
            });

            document.getElementById('reset-xp').addEventListener('click', () => {
                vscode.postMessage({ command: 'resetXP' });
            });

            document.querySelectorAll('.eco-tip-header').forEach(header => {
                header.addEventListener('click', () => {
                    const body = header.nextElementSibling;
                    if (body) {
                        body.style.display = body.style.display === 'none' ? 'block' : 'none';
                    }
                });
            });

            document.querySelectorAll('.replace-code').forEach(button => {
                button.addEventListener('click', (event) => {
                    const snippet = event.target.closest('.eco-tip').querySelector('pre').textContent;
                    vscode.postMessage({ command: 'replaceCode', snippet });
                });
            });
        </script>
    </body>
    </html>`;
}