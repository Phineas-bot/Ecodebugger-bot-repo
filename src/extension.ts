import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { checkAchievements } from './utils/achievements';
import { provideEcoTips } from './utils/ecoTips';
import { xpForNextLevel } from './utils/xp';
import { updateStatusBar } from './utils/statusBar';
import { detectNestedLoops } from './utils/bugs';
import { queueGroqRequest, canSendGroqRequest, sendGroqRequestBatch } from './utils/groqApi';
import { ClassroomManager } from './utils/classroom';
import { registerEcoDebuggerTreeView } from './feature/sidePanel';

let xp = 0;
let level = 1;
let statusBarItem: vscode.StatusBarItem;
let debounceTimer: NodeJS.Timeout | undefined;
let xpLog: string[] = [];
let classroomManager: ClassroomManager | undefined;
let ecoTipsEnabled = true;
let groqAIEnabled = true;
let treeDataProvider: any; // Declare at top for proper scope
let ecoTipNotifications: string[] = []; // Track eco tip notifications

// Map to track last detected issues per file
const lastIssuesPerFile: Map<string, Set<string>> = new Map();
// Map to track last detected bugs per file
const lastBugsPerFile: Map<string, Set<string>> = new Map();

let githubStatusBarItem: vscode.StatusBarItem | undefined;

async function getGitHubSession(): Promise<vscode.AuthenticationSession | undefined> {
    return await vscode.authentication.getSession(
        'github',
        ['read:user'],
        { createIfNone: true }
    );
}

async function showGitHubUserInStatusBar() {
    const session = await getGitHubSession();
    if (!session) {
        if (githubStatusBarItem) {
            githubStatusBarItem.hide();
        }
        return;
    }
    const username = session.account.label;
    if (!githubStatusBarItem) {
        githubStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    }
    githubStatusBarItem.text = `$(mark-github) ${username}`;
    githubStatusBarItem.tooltip = `Signed in as ${username}\nClick to sign out of EcoDebugger`;
    githubStatusBarItem.command = 'ecoDebugger.signOutGitHub';
    githubStatusBarItem.show();
}

export function activate(context: vscode.ExtensionContext): void {
    // Restore state from globalState if available
    const saved = context.globalState.get('ecodebuggerState') as any;
    if (saved) {
        xp =
        level = saved.level || 1;
        xpLog = saved.xpLog || [];
        ecoTipNotifications = saved.ecoTipNotifications || [];
        ecoTipsEnabled = typeof saved.ecoTipsEnabled === 'boolean' ? saved.ecoTipsEnabled : true;
        groqAIEnabled = typeof saved.groqAIEnabled === 'boolean' ? saved.groqAIEnabled : true;
    }
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);
    updateStatusBar(statusBarItem, xp, level);
    console.log('Congratulations, your extension "Ecodebugger" is now active!');
    // Register the TreeView sidebar
    let state = {
        xp,
        level,
        achievements: [
            { name: 'Green Coder', unlocked: true, icon: '🌱', description: 'Apply 10 eco tips.' },
            { name: 'Bug Slayer', unlocked: true, icon: '🪲', description: 'Fix 20 bugs.' },
            { name: 'Efficient Thinker', unlocked: false, icon: '⚡', description: 'Reach 500 XP.' },
            { name: 'Team Leader', unlocked: false, icon: '👑', description: 'Top leaderboard in classroom mode.' }
        ],
        xpLog,
        bugReports: [],
        ecoTipsEnabled,
        groqAIEnabled
    };
    // Patch setState to include ecoTipNotifications and settings
    function setState(newState: any) {
        // Handle toggles and reset logic
        if (typeof newState.ecoTipsEnabled === 'boolean' && newState.ecoTipsEnabled !== ecoTipsEnabled) {
            ecoTipsEnabled = newState.ecoTipsEnabled;
            vscode.window.showInformationMessage(`Eco Tips ${ecoTipsEnabled ? 'enabled' : 'disabled'}.`);
        }
        if (typeof newState.groqAIEnabled === 'boolean' && newState.groqAIEnabled !== groqAIEnabled) {
            groqAIEnabled = newState.groqAIEnabled;
            vscode.window.showInformationMessage(`Groq AI ${groqAIEnabled ? 'enabled' : 'disabled'}.`);
        }
        if (newState.xp === 0 && newState.level === 1) {
            xp = 0;
            level = 1;
            xpLog = [];
            ecoTipNotifications = [];
            // Optionally reset achievements (if tracked in state)
            if (typeof newState.achievements !== 'undefined') {
                // If using a module-level achievements object, reset it here
                if (require('./utils/achievements').resetAchievements) {
                    require('./utils/achievements').resetAchievements();
                }
            }
            vscode.window.showInformationMessage('XP, achievements, and eco tips log have been reset.');
        }
        state = { ...state, ...newState, ecoTipsEnabled, groqAIEnabled };
        context.globalState.update('ecodebuggerState', {
            xp,
            level,
            xpLog,
            ecoTipNotifications,
            ecoTipsEnabled,
            groqAIEnabled
        });
        treeDataProvider.setState(getState());
    }
    // Patch getState to include ecoTipNotifications and settings
    function getState() {
        return {
            ...state,
            xp,
            level,
            xpLog,
            ecoTipNotifications,
            ecoTipsEnabled,
            groqAIEnabled
        };
    }
    treeDataProvider = registerEcoDebuggerTreeView(context, getState, setState);

    // For demo, use VS Code user info or fallback
    const userId = vscode.env.machineId;
    const username = vscode.env.appName || 'You';
    classroomManager = new ClassroomManager(userId, username);

    // Add classroom commands
    context.subscriptions.push(
        vscode.commands.registerCommand('ecoDebugger.createClassroom', async () => {
            const pin = await vscode.window.showInputBox({ prompt: 'Enter a PIN for your classroom (optional)' });
            const classroom = await classroomManager?.createClassroom(pin);
            vscode.window.showInformationMessage('Classroom created: ' + classroom?.classroom_id);
            setState(getState());
            await showGitHubUserInStatusBar();
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('ecoDebugger.joinClassroom', async () => {
            const id = await vscode.window.showInputBox({ prompt: 'Enter Classroom ID' });
            const pin = await vscode.window.showInputBox({ prompt: 'Enter PIN (if required)' });
            const ok = await classroomManager?.joinClassroom(id || '', pin);
            vscode.window.showInformationMessage(ok ? 'Joined classroom!' : 'Failed to join classroom.');
            setState(getState());
            await showGitHubUserInStatusBar();
        })
    );

    // Add test command for Groq API integration
    context.subscriptions.push(
        vscode.commands.registerCommand('ecoDebugger.testGroqApi', async () => {
            try {
                vscode.window.showInformationMessage('Testing Groq API integration...');
                const codeSample = 'function foo() { return 42; }';
                const result = await queueGroqRequest(codeSample);
                vscode.window.showInformationMessage('Groq API result: ' + JSON.stringify(result));
            } catch (err) {
                vscode.window.showErrorMessage('Groq API error: ' + err);
            }
        })
    );

    // Register onDidSaveTextDocument to trigger eco tip and bug analysis
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(async (document) => {
            if (!ecoTipsEnabled && !groqAIEnabled) { return; }
            if (!['python', 'javascript', 'typescript'].includes(document.languageId)) { return; }
            const fileUri = document.uri.toString();
            // Eco Tips
            if (ecoTipsEnabled) {
                const { provideEcoTips } = require('./utils/ecoTips');
                const tipsResult = await provideEcoTips();
                const currentIssues: Set<string> = new Set((tipsResult.ecoTips || []).map((tip: string) => String(tip).trim()));
                const previousIssues: Set<string> = lastIssuesPerFile.get(fileUri) || new Set<string>();
                Array.from(currentIssues).forEach((tip: string) => {
                    vscode.window.showWarningMessage('⚡ Eco Tip: ' + tip);
                    if (!ecoTipNotifications.includes(tip)) {
                        ecoTipNotifications.push(tip);
                    }
                });
                // Only award XP if the number of issues decreased
                if (previousIssues.size > 0 && currentIssues.size < previousIssues.size) {
                    const resolvedCount = previousIssues.size - currentIssues.size;
                    for (let i = 0; i < resolvedCount; i++) {
                        awardXP('ecoTip');
                    }
                    vscode.window.showInformationMessage(`🎉 You resolved ${resolvedCount} eco issue(s) and earned XP!`);
                }
                lastIssuesPerFile.set(fileUri, currentIssues);
            }
            // Bug detection logic (always runs)
            const { detectNestedLoops, detectUnusedVariables } = require('./utils/bugs');
            const text = document.getText();
            let currentBugs: Set<string> = new Set();
            let bugReports: any[] = treeDataProvider?.state?.bugReports || [];
            if (detectNestedLoops(text)) {
                currentBugs.add('Nested loops detected');
            }
            if (detectUnusedVariables(text)) {
                currentBugs.add('Unused variable detected');
            }
            const previousBugs: Set<string> = lastBugsPerFile.get(fileUri) || new Set<string>();
            Array.from(currentBugs).forEach((bug: string) => {
                vscode.window.showWarningMessage('🐞 Bug: ' + bug);
            });
            // Only award XP if the number of bugs decreased
            if (previousBugs.size > 0 && currentBugs.size < previousBugs.size) {
                const resolvedCount = previousBugs.size - currentBugs.size;
                for (let i = 0; i < resolvedCount; i++) {
                    awardXP('bug');
                }
                vscode.window.showInformationMessage(`🎉 You fixed ${resolvedCount} bug(s) and earned XP!`);
            }
            lastBugsPerFile.set(fileUri, currentBugs);
            bugReports = Array.from(currentBugs).map(bug => ({ description: bug }));
            if (treeDataProvider && typeof treeDataProvider.setState === 'function') {
                treeDataProvider.setState({ ...getState(), bugReports });
            }
            // AI analysis (Groq API)
            if (groqAIEnabled) {
                try {
                    const { queueGroqRequest } = require('./utils/groqApi');
                    const aiResult = await queueGroqRequest(document.getText());
                    const aiMsg = aiResult && aiResult.explanation ? aiResult.explanation : JSON.stringify(aiResult);
                    vscode.window.showInformationMessage('AI analysis: ' + aiMsg);
                } catch (err) {
                    const errorMsg = 'AI analysis failed: ' + String(err);
                    vscode.window.showWarningMessage(errorMsg);
                    if (!ecoTipNotifications.includes(errorMsg)) {
                        ecoTipNotifications.push(errorMsg);
                    }
                }
            }
        })
    );

    // Pass context to awardXP for persistence
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
        checkAchievements(xp, level, false); // Remove leaderboard check
        updateXPAndTreeView();
        context.globalState.update('ecodebuggerState', {
            xp,
            level,
            xpLog
        });
        // Remove classroomManager.syncXP
    }

    (async () => { await showGitHubUserInStatusBar(); })();
    if (githubStatusBarItem) {
        context.subscriptions.push(githubStatusBarItem);
    }
    context.subscriptions.push(
        vscode.commands.registerCommand('ecoDebugger.refreshGitHubStatus', async () => {
            await showGitHubUserInStatusBar();
        })
    );
    // Add a command to sign out from GitHub
    context.subscriptions.push(
        vscode.commands.registerCommand('ecoDebugger.signOutGitHub', async () => {
            // VS Code does not provide a direct logout API. Instead, clear session preference and prompt user.
            await vscode.authentication.getSession('github', ['read:user'], { clearSessionPreference: true, createIfNone: false });
            vscode.window.showInformationMessage('To fully sign out, use the Accounts menu in the Activity Bar (bottom left) and sign out from GitHub.');
            if (githubStatusBarItem) { githubStatusBarItem.hide(); }
        })
    );
}

function joinClassroom(code: string) {
    classroomManager?.joinClassroom(code);
    // TODO: Add cloud/local persistence
    vscode.window.showInformationMessage(`Joined classroom: ${code}`);
}

// Removed webview logic as the extension is now fully TreeView-based

export function deactivate(): void {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}

function updateXPAndTreeView() {
    updateStatusBar(statusBarItem, xp, level);
    if (treeDataProvider && typeof treeDataProvider.setState === 'function') {
        treeDataProvider.setState({ xp, level, xpLog });
    }
}