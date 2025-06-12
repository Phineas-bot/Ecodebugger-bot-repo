import * as vscode from 'vscode';
import * as path from 'path';
import { checkAchievements } from './utils/achievements';
import { provideEcoTips } from './utils/ecoTips';
import { xpForNextLevel } from './utils/xp';
import { updateStatusBar } from './utils/statusBar';
import { detectNestedLoops } from './utils/bugs';
import { queueGroqRequest, canSendGroqRequest, sendGroqRequestBatch, fakeGroqApiCall } from './utils/groqApi';

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
let groqAIEnabled = true;
let loggedInUser: string | undefined = undefined;

function updateSettings(newSettings: { ecoTipsEnabled?: boolean, groqAIEnabled?: boolean }) {
    if (typeof newSettings.ecoTipsEnabled === 'boolean') {
        ecoTipsEnabled = newSettings.ecoTipsEnabled;
    }
    if (typeof newSettings.groqAIEnabled === 'boolean') {
        groqAIEnabled = newSettings.groqAIEnabled;
    }
}

function analyzeCodeInRealTime(_: vscode.TextDocumentChangeEvent): void {
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

            checkAchievements(xp, level, classroom.leaderboard[0]?.name === 'You');
            updateStatusBar(statusBarItem, xp, level);
        }
    }, 500);
}

let ecoDebuggerWebviewView: vscode.WebviewView | undefined;

class EcoDebuggerViewProvider implements vscode.WebviewViewProvider {
    private readonly context: vscode.ExtensionContext;
    private view?: vscode.WebviewView;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    resolveWebviewView(webviewView: vscode.WebviewView): void {
        ecoDebuggerWebviewView = webviewView;
        this.view = webviewView;
        
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'media'))]
        };

        // Get latest state
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
                { name: 'Team Leader', unlocked: false, icon: '👑', description: 'Top leaderboard in classroom mode.' }
            ],
            leaderboard: classroom.leaderboard,
            classroom,
            ecoTipsEnabled,
            groqAIEnabled,
            loggedInUser
        };

        webviewView.webview.html = getWebviewContent(state, webviewView.webview, this.context.extensionPath);

        // Handle messages from the Webview
        webviewView.webview.onDidReceiveMessage(
            (message: any) => {
                switch (message.command) {
                    case 'getState':
                        // Send current state when webview requests it
                        webviewView.webview.postMessage({ command: 'updateXP', state });
                        break;
                    case 'fixBug':
                        this.view?.webview.postMessage({ command: 'bugFixed', bugsFixed: message.bugsFixed });
                        break;
                    case 'toggleEcoTips':
                        ecoTipsEnabled = message.enabled;
                        break;
                    case 'toggleGroqAI':
                        groqAIEnabled = message.enabled;
                        break;
                    case 'resetXP':
                        xp = 0;
                        level = 1;
                        xpLog = [];
                        if (!statusBarItem) {
                            statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
                        }
                        updateStatusBar(statusBarItem, xp, level);
                        vscode.window.showInformationMessage('XP and achievements have been reset.');
                        saveState();
                        // Update webview with new state
                        webviewView.webview.postMessage({ command: 'updateXP', state: { xp, level, xpLog }});
                        break;
                    case 'joinClassroom':
                        joinClassroom(message.code);
                        break;
                }
            },
            undefined,
            []
        );

        // Also send initial state
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                // Send current state when webview becomes visible
                const currentState = {
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
                        { name: 'Team Leader', unlocked: false, icon: '👑', description: 'Top leaderboard in classroom mode.' }
                    ],
                    leaderboard: classroom.leaderboard,
                    classroom,
                    ecoTipsEnabled,
                    groqAIEnabled
                };
                webviewView.webview.postMessage({ command: 'updateXP', state: currentState });
            }
        });
    }
}

function updateEcoDebuggerWebview() {
    if (ecoDebuggerWebviewView) {
        // Reveal the webview if not visible
        if (ecoDebuggerWebviewView.visible === false && ecoDebuggerWebviewView.show) {
            ecoDebuggerWebviewView.show(true);
        }
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
            ecoTipsEnabled,
            groqAIEnabled,
            loggedInUser // Pass username to webview
        };
        ecoDebuggerWebviewView.webview.postMessage({ command: 'updateXP', state });
    }
}

// Track previous issues per file
const fileIssueState: {
    [filePath: string]: {
        bugs: Set<string>,
        ecoTips: Set<string>
    }
} = {};

function extractBugsAndTips(analysis: any): { bugs: Set<string>, ecoTips: Set<string> } {
    return {
        bugs: new Set(analysis.bugs || []),
        ecoTips: new Set(analysis.ecoTips || [])
    };
}

// Listen for file saves to trigger eco tips and AI bug/eco analysis
vscode.workspace.onDidSaveTextDocument(async (doc) => {
    if (!(ecoTipsEnabled || groqAIEnabled) || !['javascript', 'typescript', 'python'].includes(doc.languageId)) {
        return;
    }
    const filePath = doc.uri.fsPath;
    let prev = fileIssueState[filePath] || { bugs: new Set(), ecoTips: new Set() };
    // --- Local Eco Tips Analysis ---
    let localEcoTips = new Set<string>();
    let localAnalysis: any = { ecoTips: [] };
    if (ecoTipsEnabled) {
        localAnalysis = await require('./utils/ecoTips').provideEcoTips();
        localEcoTips = new Set(localAnalysis.ecoTips || []);
    }
    // --- AI Bug/Eco Analysis ---
    let aiBugs = new Set<string>();
    let aiEcoTips = new Set<string>();
    let aiAnalysis: any = { bugs: [], ecoTips: [] };
    if (groqAIEnabled) {
        try {
            aiAnalysis = await queueGroqRequest(doc.getText());
            aiBugs = new Set(aiAnalysis.bugs || []);
            aiEcoTips = new Set(aiAnalysis.ecoTips || []);
        } catch (err) {
            vscode.window.showWarningMessage('Groq AI error: ' + err);
        }
    }
    // --- Compare with previous state and award XP only for resolved issues ---
    const fixedBugs = [...prev.bugs].filter(bug => !aiBugs.has(bug));
    const appliedTips = [...prev.ecoTips].filter(tip => !localEcoTips.has(tip) && !aiEcoTips.has(tip));
    fixedBugs.forEach(() => awardXP('bug'));
    appliedTips.forEach(() => awardXP('ecoTip'));
    // --- Update state for next save ---
    fileIssueState[filePath] = {
        bugs: aiBugs,
        ecoTips: new Set([...localEcoTips, ...aiEcoTips])
    };
    // --- Show notifications for current issues (user feedback) ---
    if (ecoTipsEnabled) {
        if (doc.languageId === 'python') {
            await require('./utils/greenCodePython').analyzePythonGreenCode(doc.getText());
        } else {
            require('./utils/greenCode').analyzeGreenCode(doc.getText());
        }
    }
    // Optionally, show AI bug/eco notifications here if needed
});


let contextGlobal: vscode.ExtensionContext; // Store context for globalState access

export function activate(context: vscode.ExtensionContext): void {
    contextGlobal = context;
    // Restore state from globalState if available
    const saved = context.globalState.get('ecodebuggerState') as any;
    if (saved) {
        xp = saved.xp || 0;
        level = saved.level || 1;
        xpLog = saved.xpLog || [];
    }
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);
    updateStatusBar(statusBarItem, xp, level);
    console.log('Congratulations, your extension "Ecodebugger" is now active!');

    // Show login link immediately when extension is activated
    (async () => {
        const loginUrl = vscode.Uri.file(path.join(context.extensionPath, 'media', 'login.html'));
        const action = await vscode.window.showInformationMessage(
            '🔐 Click here to log in to EcoDebugger.',
            'Open Login Page'
        );
        if (action === 'Open Login Page') {
            await vscode.env.openExternal(loginUrl);
            vscode.window.showInformationMessage('After logging in, return to VS Code to continue using EcoDebugger.');
        }
    })();

    // Register the webview view provider only once
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('ecodebuggerView', new EcoDebuggerViewProvider(context))
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('ecodebugger.login', async () => {
            const loginUrl = vscode.Uri.file(path.join(context.extensionPath, 'media', 'login.html'));
            await vscode.env.openExternal(loginUrl);
            vscode.window.showInformationMessage('Please complete login in your browser. Return to VS Code when done.');
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('ecodebugger.showLoginLink', async () => {
            const loginUrl = vscode.Uri.file(path.join(context.extensionPath, 'media', 'login.html'));
            const action = await vscode.window.showInformationMessage(
                '🔐 Click here to log in to EcoDebugger.',
                'Open Login Page'
            );
            if (action === 'Open Login Page') {
                await vscode.env.openExternal(loginUrl);
                vscode.window.showInformationMessage('After logging in, return to VS Code to continue using EcoDebugger.');
            }
        })
    );
    context.subscriptions.push(
        vscode.window.registerUriHandler({
            handleUri(uri: vscode.Uri) {
                // Parse username from URI
                const params = new URLSearchParams(uri.query);
                const user = params.get('user');
                if (user) {
                    loggedInUser = user;
                    vscode.window.showInformationMessage(`Logged in as ${user}`);
                    updateEcoDebuggerWebview();
                } else {
                    vscode.window.showErrorMessage('Login failed: No user found in URI.');
                }
            }
        })
    );
}


function saveState() {
    if (contextGlobal) {
        contextGlobal.globalState.update('ecodebuggerState', {
            xp,
            level,
            xpLog
        });
    }
}

function awardXP(type: 'bug' | 'ecoTip') {
    let xpAwarded = type === 'bug' ? 10 : 5;
    xp += xpAwarded;
    let leveledUp = false;
    while (xp >= xpForNextLevel(level)) {
        xp -= xpForNextLevel(level);
        level++;
        leveledUp = true;
        vscode.window.showInformationMessage(`🎉 Congratulations! You reached Level ${level}!`);
    }
    xpLog.push(`${type === 'bug' ? 'Fixed a bug' : 'Applied eco tip'} (+${xpAwarded} XP)`);
    checkAchievements(xp, level, classroom.leaderboard[0]?.name === 'You');
    updateStatusBar(statusBarItem, xp, level);
    
    // Force sync with webview
    console.log('Updating webview with new state:', { xp, level });
    updateEcoDebuggerWebview();
    
    // Wait for webview update before saving state
    setTimeout(() => {
        saveState();
    }, 100);
}

function joinClassroom(code: string) {
    classroom.code = code;
    // TODO: Add cloud/local persistence
    vscode.window.showInformationMessage(`Joined classroom: ${code}`);
}

// Removed duplicate webviewView.webview.onDidReceiveMessage at the bottom of the file

function getWebviewContent(state: any, webview: vscode.Webview, extensionPath: string): string {
     // const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'media', 'style.css')));
    // const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'out', 'main.js')));

    
    return `
        <!DOCTYPE html>
        <title>EcoDebugger</title>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #181c24; color: #fff; margin: 0; }
            .container { max-width: 500px; margin: 2rem auto; background: #23283a; border-radius: 12px; box-shadow: 0 2px 16px #0008; padding: 2rem; }
            .tabs {
                display: flex;
                gap: 1rem;
                margin-bottom: 1.5rem;
                flex-wrap: wrap; /* Allow tabs to wrap to the next line */
                overflow-x: auto; /* Enable horizontal scrolling if needed */
            }
            .tabs::-webkit-scrollbar {
                height: 8px;
            }
            .tabs::-webkit-scrollbar-thumb {
                background: #2ecc71;
                border-radius: 4px;
            }
            .tabs::-webkit-scrollbar-track {
                background: #222a36;
            }
            .tab { cursor: pointer; padding: 0.5rem 1rem; border-radius: 6px; background: #222a36; color: #fff; }
            .tab.active { background: #2ecc71; color: #fff; }
            .level { background: #2ecc71; color: #fff; border-radius: 8px; padding: 0.5rem 1rem; display: inline-block; margin-bottom: 1rem; font-weight: bold; }
            .xp { color: #fff; margin-bottom: 1rem; }
            .progress-bar { background: #333; border-radius: 8px; width: 100%; height: 16px; margin-bottom: 1rem; }
            #progress-fill { background: #2ecc71; height: 100%; border-radius: 8px; transition: width 0.3s ease-in-out; }
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
        <body>
            <div class="container">
                <div style="text-align:right; margin-bottom:0.5rem; color:#2ecc71; font-weight:bold;">
                    Logged in as ${state.loggedInUser || 'Not logged in'}
                </div>
                <div class="tabs">
                    <div class="tab active" id="tab-xp">XP/Level</div>
                    <div class="tab" id="tab-badges">Badges Earned</div>
                    <div class="tab" id="tab-eco">Eco Tips Log</div>
                    <div class="tab" id="tab-leader">Leaderboard</div>
                    <div class="tab" id="tab-settings">Settings</div>
                </div>
                <div id="tab-content-xp">
                    <div class="level">Level <span id="level">${state.level}</span></div>
                    <div class="xp"><span id="current-xp">${state.xp}</span> XP</div>
                    <div class="progress-bar">
                        <div id="progress-fill" style="width: ${Math.floor((state.xp / (state.level * 100)) * 100)}%"></div>
                    </div>
                </div>
                <div id="tab-content-badges" style="display:none;">
                    <h3>Achievements</h3>
                    ${state.achievements.map((a: any) => `
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
                        ${state.xpLog.map((entry: string) => `<div class="xp-log-entry">${entry}</div>`).join('')}
                    </div>
                </div>
                <div id="tab-content-leader" style="display:none;">
                    <h3>Classroom Mode</h3>
                    <div>Classroom Code: <b>${state.classroom.code}</b></div>
                    <div>Weekly Top: <b>${state.classroom.weeklyTop}</b></div>
                    ${state.leaderboard.map((l: any) => `<div class="leader">${l.name}: ${l.xp} XP</div>`).join('')}
                </div>
                <div id="tab-content-settings" style="display:none;">
                    <h3>Settings</h3>
                    <div class="settings">
                        <label><input type="checkbox" id="eco-tips-toggle" ${state.ecoTipsEnabled ? 'checked' : ''}/> Enable Eco Tips</label>
                        <label><input type="checkbox" id="groq-ai-toggle" ${state.groqAIEnabled ? 'checked' : ''}/> Enable Groq AI Analysis</label>
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
                
                // Handle message from extension to update XP
                window.addEventListener('message', (event) => {
                    const message = event.data;
                    if (message.command === 'updateXP' && message.state) {
                        console.log('Received updateXP message:', message.state);
                        const { xp, level } = message.state;
                        
                        // Update level and XP display
                        document.getElementById('level').textContent = level;
                        document.getElementById('current-xp').textContent = xp;
                        
                        // Update progress bar
                        const progressFill = document.getElementById('progress-fill');
                        if (progressFill) {
                            const percent = Math.floor((xp / (level * 100)) * 100);
                            progressFill.style.width = percent + '%';
                            console.log('Updated progress bar width:', percent + '%');
                        } else {
                            console.error('Progress fill element not found');
                        }
                    }
                });
                
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
                document.getElementById('groq-ai-toggle').onchange = function() {
                    vscode.postMessage({ command: 'toggleGroqAI', enabled: this.checked });
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
    </html>`;
}

export function deactivate(): void {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}