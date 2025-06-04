import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { checkAchievements, getAchievements } from './utils/achievements';
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

function getWebviewContent(state: any, webview: vscode.Webview, extensionPath: string): string {
    const styleUri = webview.asWebviewUri(vscode.Uri.file(
        path.join(extensionPath, 'media', 'style.css')
    ));
    const mainJsUri = webview.asWebviewUri(vscode.Uri.file(
        path.join(extensionPath, 'out', 'main.js')
    ));

    // Read the HTML template
    const htmlPath = path.join(extensionPath, 'media', 'webview.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    // Replace resource URIs
    return html
        .replace(/\{\{styleUri\}\}/g, styleUri.toString())
        .replace(/\{\{mainJsUri\}\}/g, mainJsUri.toString());
}

class EcoDebuggerViewProvider implements vscode.WebviewViewProvider {
    private readonly context: vscode.ExtensionContext;
    private view?: vscode.WebviewView;
    private viewState: {
        xp: number;
        level: number;
        xpLog: string[];
        ecoTips: any[];
        achievements: any[];
        leaderboard: any[];
        settings: {
            ecoTipsEnabled: boolean;
            groqAIEnabled: boolean;
        };
    };

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.viewState = {
            xp: 0,
            level: 1,
            xpLog: [],
            ecoTips: [],
            achievements: [],
            leaderboard: [],
            settings: {
                ecoTipsEnabled: true,
                groqAIEnabled: true
            }
        };
    }

    public resolveWebviewView(webviewView: vscode.WebviewView): void {
        this.view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.context.extensionPath, 'media')),
                vscode.Uri.file(path.join(this.context.extensionPath, 'out'))
            ],
        };

        // Initialize view state
        this.viewState = {
            xp,
            level,
            xpLog,
            ecoTips: [],
            achievements: getAchievements(),
            leaderboard: classroom.leaderboard,
            settings: {
                ecoTipsEnabled,
                groqAIEnabled
            }
        };

        // Set initial webview content
        webviewView.webview.html = getWebviewContent(this.viewState, webviewView.webview, this.context.extensionPath);

        // Send initial state immediately after setting HTML
        this.notifyStateUpdate();

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'fixBug':
                    this.handleBugFix();
                    break;

                case 'toggleEcoTips':
                    ecoTipsEnabled = message.enabled;
                    this.viewState.settings.ecoTipsEnabled = message.enabled;
                    this.notifyStateUpdate();
                    break;

                case 'toggleGroqAI':
                    groqAIEnabled = message.enabled;
                    this.viewState.settings.groqAIEnabled = message.enabled;
                    this.notifyStateUpdate();
                    break;

                case 'resetXP':
                    this.handleReset();
                    break;

                case 'joinClassroom':
                    await this.joinClassroom(message.code);
                    break;

                case 'copyCode':
                    await vscode.env.clipboard.writeText(message.code);
                    vscode.window.showInformationMessage('Code copied to clipboard!');
                    break;
            }
        });
    }

    private notifyStateUpdate(): void {
        if (this.view) {
            this.view.webview.postMessage({ 
                command: 'updateState', 
                state: this.viewState 
            });
        }
    }

    public updateXPState(newXP: number, newLevel: number, newXPLog: string[]): void {
        if (this.view) {
            // Update internal state
            this.viewState = {
                ...this.viewState,
                xp: newXP,
                level: newLevel,
                xpLog: newXPLog,
                achievements: getAchievements() // Always refresh achievements
            };

            // Send both the full state update and the XP animation trigger
            this.notifyStateUpdate();
            
            this.view.webview.postMessage({ 
                command: 'updateXP', 
                state: { 
                    xp: newXP, 
                    level: newLevel,
                    xpLog: newXPLog
                } 
            });
        }
    }

    public addEcoTip(tip: string, code?: string): void {
        if (this.view) {
            const newTip = {
                tip,
                code,
                timestamp: new Date().toISOString()
            };
            
            this.viewState.ecoTips.unshift(newTip);
            if (this.viewState.ecoTips.length > 50) {
                this.viewState.ecoTips.pop();
            }
            
            this.view.webview.postMessage({
                command: 'newEcoTip',
                tip: newTip
            });
        }
    }

    public notifyAchievement(achievement: any): void {
        if (this.view) {
            this.viewState.achievements = getAchievements();
            this.view.webview.postMessage({
                command: 'achievementUnlocked',
                achievement
            });
            this.notifyStateUpdate();
        }
    }

    private handleBugFix(): void {
        awardXP('bug');
        updateStatusBar(statusBarItem, xp, level);
    }

    private handleReset(): void {
        xp = 0;
        level = 1;
        xpLog = [];
        updateStatusBar(statusBarItem, xp, level);
        
        this.viewState = {
            ...this.viewState,
            xp: 0,
            level: 1,
            xpLog: []
        };
        
        this.notifyStateUpdate();
        vscode.window.showInformationMessage('XP and achievements have been reset.');
    }

    private async joinClassroom(code: string): Promise<void> {
        try {
            joinClassroom(code);
            this.viewState.leaderboard = classroom.leaderboard;
            this.notifyStateUpdate();
            vscode.window.showInformationMessage(`Successfully joined classroom ${code}!`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to join classroom: ${error}`);
        }
    }
}

// Keep track of the webview provider
let ecoDebuggerProvider: EcoDebuggerViewProvider;

export function activate(context: vscode.ExtensionContext): void {
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);
    updateStatusBar(statusBarItem, xp, level);

    // Create and register webview provider
    ecoDebuggerProvider = new EcoDebuggerViewProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('ecodebuggerView', ecoDebuggerProvider)
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('ecoDebugger.awardXP', () => {
            awardXP('bug');
        }),
        vscode.commands.registerCommand('ecoDebugger.provideEcoTips', async () => {
            const tips = await provideEcoTips();
            tips.ecoTips.forEach(tip => ecoDebuggerProvider.addEcoTip(tip));
        })
    );

    // Watch for text document changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(analyzeCodeInRealTime)
    );

    console.log('Congratulations, your extension "Ecodebugger" is now active!');
}

function awardXP(type: 'bug' | 'ecoTip') {
    let xpAwarded = type === 'bug' ? 10 : 5;
    let oldLevel = level; // Store old level to check for level up
    xp += xpAwarded;

    while (xp >= xpForNextLevel(level)) {
        xp -= xpForNextLevel(level);
        level++;
    }

    // Add XP log entry
    xpLog.unshift(`${type === 'bug' ? 'Fixed a bug' : 'Applied eco tip'} (+${xpAwarded} XP)`);
    if (xpLog.length > 50) {
        xpLog.pop(); // Keep only the last 50 entries
    }

    // Check for level up notification
    if (level > oldLevel) {
        vscode.window.showInformationMessage(`🎉 Congratulations! You reached Level ${level}!`);
    }

    // Update achievements and status bar
    checkAchievements(xp, level, classroom.leaderboard[0]?.name === 'You');
    updateStatusBar(statusBarItem, xp, level);
    
    // Update webview with all changes
    if (ecoDebuggerProvider) {
        // Make sure to pass the latest values
        ecoDebuggerProvider.updateXPState(xp, level, xpLog);
    }
}

export function deactivate(): void {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}