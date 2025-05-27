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
const achievements_1 = require("./utils/achievements");
const ecoTips_1 = require("./utils/ecoTips");
const xp_1 = require("./utils/xp");
const statusBar_1 = require("./utils/statusBar");
const bugs_1 = require("./utils/bugs");
let xp = 0;
let level = 1;
let statusBarItem;
let debounceTimer;
let xpLog = [];
let classroom = {
    code: 'ABC123',
    leaderboard: [
        { name: 'Victory-1', xp: 200 },
        { name: 'Maria', xp: 120 }
    ],
    weeklyTop: 'Victory-1'
};
let ecoTipsEnabled = true;
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
function awardXP(type) {
    if (type === 'bug') {
        xp += 10;
        xpLog.push(`+10 XP for fixing a bug (${new Date().toLocaleTimeString()})`);
    }
    else if (type === 'ecoTip') {
        xp += 5;
        xpLog.push(`+5 XP for applying an eco tip (${new Date().toLocaleTimeString()})`);
    }
    if (xp >= (0, xp_1.xpForNextLevel)(level)) {
        xp -= (0, xp_1.xpForNextLevel)(level);
        level++;
        vscode.window.showInformationMessage(`🎉 Congratulations! You reached Level ${level}!`);
    }
    (0, achievements_1.checkAchievements)(xp, level);
    (0, statusBar_1.updateStatusBar)(statusBarItem, xp, level);
}
// Listen for file saves to trigger eco tips
vscode.workspace.onDidSaveTextDocument((doc) => {
    if (ecoTipsEnabled && (doc.languageId === 'javascript' || doc.languageId === 'typescript' || doc.languageId === 'python')) {
        (0, ecoTips_1.provideEcoTips)();
        awardXP('ecoTip');
    }
});
function activate(context) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);
    (0, statusBar_1.updateStatusBar)(statusBarItem, xp, level);
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
        const panel = vscode.window.createWebviewPanel('ecoDebuggerUI', 'EcoDebugger', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
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
        panel.webview.onDidReceiveMessage(message => {
            if (message.command === 'fixBug') {
                // Optionally update XP, achievements, etc. here
                panel.webview.postMessage({ command: 'bugFixed', bugsFixed: message.bugsFixed });
            }
        }, undefined, context.subscriptions);
    });
    context.subscriptions.push(openEcoDebuggerUI);
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
    // Automatically open the EcoDebugger UI panel on activation
    vscode.commands.executeCommand('ecoDebugger.openUI');
}
function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}
// Helper to provide the Webview HTML (to be replaced with actual UI)
function getEcoDebuggerWebviewContent(state) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>EcoDebugger</title>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #181c24; color: #fff; margin: 0; }
            .container { max-width: 500px; margin: 2rem auto; background: #23283a; border-radius: 12px; box-shadow: 0 2px 16px #0008; padding: 2rem; }
            .tabs { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
            .tab { cursor: pointer; padding: 0.5rem 1rem; border-radius: 6px; background: #222a36; color: #fff; }
            .tab.active { background: #2ecc71; color: #fff; }
            .level { background: #2ecc71; color: #fff; border-radius: 8px; padding: 0.5rem 1rem; display: inline-block; margin-bottom: 1rem; font-weight: bold; }
            .xp { color: #fff; margin-bottom: 1rem; }
            .xp-bar-container { margin-bottom: 1rem; }
            .xp-bar-bg { background: #333; border-radius: 8px; width: 100%; height: 16px; }
            .xp-bar-fill { background: #2ecc71; height: 100%; border-radius: 8px; transition: width 0.3s; }
            .xp-bar-label { font-size: 0.9rem; color: #fff; text-align: right; margin-top: 2px; }
            .eco-tips, .achievements, .leaderboard, .xp-log, .settings { margin-bottom: 2rem; }
            .eco-tip, .achievement, .leader, .xp-log-entry { background: #222a36; border-radius: 6px; padding: 0.5rem 1rem; margin-bottom: 0.5rem; }
            .eco-tip { border-left: 4px solid #2ecc71; }
            .achievement { border-left: 4px solid #f1c40f; display: flex; align-items: center; }
            .achievement .badge-icon { font-size: 1.3rem; margin-right: 0.7rem; }
            .achievement.locked { opacity: 0.5; filter: grayscale(1); }
            .leader { border-left: 4px solid #3498db; }
            .game-section { margin-top: 2rem; }
            button { background: #2ecc71; color: #fff; border: none; border-radius: 6px; padding: 0.5rem 1rem; font-size: 1rem; cursor: pointer; margin-top: 1rem; }
            button:hover { background: #27ae60; }
            .settings label { display: flex; align-items: center; gap: 0.5rem; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="tabs">
                <div class="tab active" id="tab-xp">XP/Level</div>
                <div class="tab" id="tab-badges">Badges Earned</div>
                <div class="tab" id="tab-eco">Eco Tips Log</div>
                <div class="tab" id="tab-leader">Leaderboard</div>
                <div class="tab" id="tab-settings">Settings</div>
            </div>
            <div id="tab-content-xp">
                <div class="level">Level ${state.level}</div>
                <div class="xp">${state.xp} XP</div>
                <div class="xp-bar-container">
                    <div class="xp-bar-bg">
                        <div class="xp-bar-fill" style="width: ${Math.floor((state.xp / (state.level * 100)) * 100)}%"></div>
                    </div>
                    <div class="xp-bar-label">${state.xp} / ${state.level * 100} XP</div>
                </div>
            </div>
            <div id="tab-content-badges" style="display:none;">
                <h3>Achievements</h3>
                ${state.achievements.map((a) => `
                    <div class="achievement${a.unlocked ? '' : ' locked'}">
                        <span class="badge-icon">${a.icon}</span>
                        <span>${a.name}${a.unlocked ? '' : ' (locked)'}</span>
                        <span style="margin-left:auto;font-size:0.9rem;color:#aaa;">${a.description}</span>
                    </div>
                `).join('')}
            </div>
            <div id="tab-content-eco" style="display:none;">
                <h3>Eco Tips Log</h3>
                <div class="xp-log">
                    ${state.xpLog.map((entry) => `<div class="xp-log-entry">${entry}</div>`).join('')}
                </div>
            </div>
            <div id="tab-content-leader" style="display:none;">
                <h3>Classroom Mode</h3>
                <div>Classroom Code: <b>${state.classroom.code}</b></div>
                <div>Weekly Top: <b>${state.classroom.weeklyTop}</b></div>
                ${state.leaderboard.map((l) => `<div class="leader">${l.name}: ${l.xp} XP</div>`).join('')}
            </div>
            <div id="tab-content-settings" style="display:none;"> 
                <h3>Settings</h3>
                <div class="settings">
                    <label><input type="checkbox" id="eco-tips-toggle" ${state.ecoTipsEnabled ? 'checked' : ''}/> Enable Eco Tips</label>
                    <button id="reset-xp">Reset XP/Achievements</button>
                </div>
            </div>
            <div class="game-section">
                <h3>Mini Game: Bug Fixer</h3>
                <div id="game-instructions">Click the button to fix a bug!</div>
                <button id="fix-bug-btn">Fix Bug</button>
                <div id="game-feedback"></div>
            </div>
        </div>
        <script>
            const vscode = acquireVsCodeApi();
            let bugsFixed = 0;
            // Tab switching logic
            const tabs = ['xp','badges','eco','leader','settings'];
            tabs.forEach(tab => {
                document.getElementById('tab-' + tab).onclick = function() {
                    tabs.forEach(t => {
                        document.getElementById('tab-' + t).classList.remove('active');
                        document.getElementById('tab-content-' + t).style.display = 'none';
                    });
                    this.classList.add('active');
                    document.getElementById('tab-content-' + tab).style.display = '';
                };
            });
            document.getElementById('fix-bug-btn').onclick = function() {
                bugsFixed++;
                document.getElementById('game-feedback').textContent = 'Bugs fixed: ' + bugsFixed;
                vscode.postMessage({ command: 'fixBug', bugsFixed: bugsFixed });
                if (bugsFixed === 5) {
                    document.getElementById('game-feedback').textContent = 'Level Up! You are a Bug Slayer!';
                }
            };
            document.getElementById('eco-tips-toggle').onchange = function() {
                vscode.postMessage({ command: 'toggleEcoTips', enabled: this.checked });
            };
            document.getElementById('reset-xp').onclick = function() {
                vscode.postMessage({ command: 'resetXP' });
            };
            window.addEventListener('message', event => {
                const message = event.data;
                if (message.command === 'bugFixed') {
                    // Optionally update UI based on extension state
                }
            });
        </script>
    </body>
    </html>
    `;
}
//# sourceMappingURL=extension.js.map