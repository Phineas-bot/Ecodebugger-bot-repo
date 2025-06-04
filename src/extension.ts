import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
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
    // Read the HTML template from media/webview.html
    const htmlPath = path.join(extensionPath, 'media', 'webview.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    // Compute XP bar percent
    const xpBarPercent = Math.floor((state.xp / (state.level * 100)) * 100);
    // Replace placeholders with actual state values
    html = html.replace(/\{\{level\}\}/g, state.level)
        .replace(/\{\{xp\}\}/g, state.xp)
        .replace(/\{\{xpBarPercent\}\}/g, String(xpBarPercent))
        .replace(/\{\{xpLog\}\}/g, state.xpLog.map((entry: string) => `<div class='xp-log-entry'>${entry}</div>`).join(''))
        .replace(/\{\{classroomCode\}\}/g, state.classroom.code)
        .replace(/\{\{weeklyTop\}\}/g, state.classroom.weeklyTop);
    // You can add more replacements for achievements, leaderboard, etc. as needed
    return html;
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