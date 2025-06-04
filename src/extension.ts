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

// --- API Key Handling and Groq Integration ---
const SHARED_GROQ_API_KEY = 'YOUR_SHARED_GROQ_API_KEY'; // TODO: Replace with actual key or load from secure config
let groqRateLimit = { count: 0, lastReset: Date.now() };
const GROQ_RATE_LIMIT = 60; // max 60 requests per hour
let groqBatchQueue: { code: string, resolve: Function, reject: Function }[] = [];
let groqBatchTimer: NodeJS.Timeout | undefined;
let groqAIEnabled = true;

function canSendGroqRequest() {
    const now = Date.now();
    if (now - groqRateLimit.lastReset > 60 * 60 * 1000) {
        groqRateLimit = { count: 0, lastReset: now };
    }
    return groqRateLimit.count < GROQ_RATE_LIMIT;
}

async function sendGroqRequestBatch() {
    if (!canSendGroqRequest()) {
        groqBatchQueue.forEach(({ reject }) => reject('Rate limit exceeded'));
        groqBatchQueue = [];
        return;
    }
    const batch = groqBatchQueue.splice(0, groqBatchQueue.length);
    const codes = batch.map(item => item.code);
    try {
        // Simulate Groq API call (replace with real fetch)
        const response = await fakeGroqApiCall(codes);
        batch.forEach(({ resolve }, i) => resolve(response[i]));
        groqRateLimit.count += batch.length;
    } catch (err) {
        batch.forEach(({ reject }) => reject(err));
    }
}

function queueGroqRequest(code: string): Promise<any> {
    return new Promise((resolve, reject) => {
        groqBatchQueue.push({ code, resolve, reject });
        if (!groqBatchTimer) {
            groqBatchTimer = setTimeout(() => {
                sendGroqRequestBatch();
                groqBatchTimer = undefined;
            }, 1000); // batch every 1s
        }
    });
}

async function fakeGroqApiCall(codes: string[]): Promise<any[]> {
    // Simulate AI bug/eco analysis
    return codes.map(code => ({
        bugs: ['Unused variable', 'Unreachable code'],
        ecoTips: ['Use map() instead of for-loop'],
        explanation: 'Sample AI analysis',
        suggestions: ['Remove unused variable', 'Replace for-loop with map()']
    }));
}

// --- Classroom Mode (Stub for join, persistence, weekly badge) ---
function joinClassroom(code: string) {
    classroom.code = code;
    // TODO: Add cloud/local persistence
    vscode.window.showInformationMessage(`Joined classroom: ${code}`);
}
function saveClassroomData() {
    // TODO: Implement cloud/local persistence
}
function awardWeeklyTopBadge() {
    // TODO: Implement logic to award badge
}

// --- Settings Integration ---
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

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    resolveWebviewView(webviewView: vscode.WebviewView): void {
        ecoDebuggerWebviewView = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'media'))],
        };
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
            ecoTipsEnabled,
            groqAIEnabled
        };

        webviewView.webview.html = getWebviewContent(state, webviewView.webview, this.context.extensionPath);

        // Handle messages from the Webview (e.g., for the mini-game)
        webviewView.webview.onDidReceiveMessage(
            message => {
                if (message.command === 'fixBug') {
                    // Optionally update XP, achievements, etc. here
                    webviewView.webview.postMessage({ command: 'bugFixed', bugsFixed: message.bugsFixed });
                }
                // You can handle other commands here, e.g., toggleEcoTips, resetXP, etc.
                if (message.command === 'toggleEcoTips') {
                    ecoTipsEnabled = message.enabled;
                }
                if (message.command === 'toggleGroqAI') {
                    groqAIEnabled = message.enabled;
                }
                if (message.command === 'resetXP') {
                    xp = 0;
                    level = 1;
                    xpLog = [];
                    updateStatusBar(statusBarItem, xp, level);
                    vscode.window.showInformationMessage('XP and achievements have been reset.');
                }
                if (message.command === 'joinClassroom') {
                    joinClassroom(message.code);
                }
            },
            undefined,
            []
        );
    }
}

function updateEcoDebuggerWebview() {
    if (ecoDebuggerWebviewView) {
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
            groqAIEnabled
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

function getWebviewContent(state: any, webview: vscode.Webview, extensionPath: string): string {
    // const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'media', 'style.css')));
    // const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'out', 'main.js')));

    return `
        <!DOCTYPE html>
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
    </html>
    `;
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
    updateEcoDebuggerWebview();
}

export function deactivate(): void {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}