import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { checkAchievements } from './utils/achievements';
import { provideEcoTips } from './utils/ecoTips';
import { xpForNextLevel } from './utils/xp';
import { updateStatusBar } from './utils/statusBar';
import { detectNestedLoops } from './utils/bugs';
import { queueGroqRequest, canSendGroqRequest, sendGroqRequestBatch, fakeGroqApiCall } from './utils/groqApi';
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

export function activate(context: vscode.ExtensionContext): void {
    // Restore state from globalState if available
    const saved = context.globalState.get('ecodebuggerState') as any;
    if (saved) {
        xp = saved.xp || 0;
        level = saved.level || 1;
        xpLog = saved.xpLog || [];
        ecoTipNotifications = saved.ecoTipNotifications || []; // Restore ecoTipNotifications
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
        bugReports: [], // TODO: fill with bug report data
        leaderboard: classroomManager?.getLeaderboard() || [],
        classroom: {
            code: classroomManager?.getClassroomId() || '',
            weeklyTop: classroomManager?.getLeaderboard()?.[0]?.username || '',
        },
        ecoTipsEnabled,
        groqAIEnabled
    };
    // Patch setState to include ecoTipNotifications
    function setState(newState: any) {
        state = { ...state, ...newState };
        context.globalState.update('ecodebuggerState', {
            xp,
            level,
            xpLog,
            ecoTipNotifications
        });
        treeDataProvider.setState(getState());
    }
    // Patch getState to include ecoTipNotifications
    function getState() {
        return {
            ...state,
            xp,
            level,
            xpLog,
            ecoTipNotifications
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
            setState(getState()); // Force UI refresh
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('ecoDebugger.joinClassroom', async () => {
            const id = await vscode.window.showInputBox({ prompt: 'Enter Classroom ID' });
            const pin = await vscode.window.showInputBox({ prompt: 'Enter PIN (if required)' });
            const ok = await classroomManager?.joinClassroom(id || '', pin);
            vscode.window.showInformationMessage(ok ? 'Joined classroom!' : 'Failed to join classroom.');
            setState(getState()); // Force UI refresh
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('ecoDebugger.leaveClassroom', async () => {
            await classroomManager?.leaveClassroom();
            vscode.window.showInformationMessage('Left classroom.');
            setState(getState()); // Force UI refresh
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
            if (!ecoTipsEnabled) { return; }
            if (!["python", "javascript", "typescript"].includes(document.languageId)) { return; }
            const fileUri = document.uri.toString();
            const { provideEcoTips } = require('./utils/ecoTips');
            const tipsResult = await provideEcoTips();
            const currentIssues: Set<string> = new Set((tipsResult.ecoTips || []).map((tip: string) => String(tip).trim()));
            const previousIssues: Set<string> = lastIssuesPerFile.get(fileUri) || new Set<string>();
            const resolvedIssues = Array.from(previousIssues).filter(issue => !currentIssues.has(issue));
            Array.from(currentIssues).forEach((tip: string) => {
                vscode.window.showWarningMessage('⚡ Eco Tip: ' + tip);
                if (!ecoTipNotifications.includes(tip)) {
                    ecoTipNotifications.push(tip);
                }
            });
            if (resolvedIssues.length > 0) {
                resolvedIssues.forEach(() => {
                    awardXP('ecoTip');
                });
                vscode.window.showInformationMessage(`🎉 You resolved ${resolvedIssues.length} eco issue(s) and earned XP!`);
            }
            lastIssuesPerFile.set(fileUri, currentIssues);

            // --- Bug detection logic ---
            const { detectNestedLoops, detectUnusedVariables } = require('./utils/bugs');
            const text = document.getText();
            let currentBugs: Set<string> = new Set();
            let bugReports: any[] = treeDataProvider?.state?.bugReports || [];
            // Detect bugs and add to set
            if (detectNestedLoops(text)) {
                currentBugs.add('Nested loops detected');
            }
            if (detectUnusedVariables(text)) {
                currentBugs.add('Unused variable detected');
            }
            // Add more bug detection as needed
            const previousBugs: Set<string> = lastBugsPerFile.get(fileUri) || new Set<string>();
            const resolvedBugs = Array.from(previousBugs).filter(bug => !currentBugs.has(bug));
            // Show bug warnings for current bugs
            Array.from(currentBugs).forEach((bug: string) => {
                vscode.window.showWarningMessage('🐞 Bug: ' + bug);
            });
            // Award XP only for resolved bugs
            if (resolvedBugs.length > 0) {
                resolvedBugs.forEach(() => {
                    awardXP('bug');
                });
                vscode.window.showInformationMessage(`🎉 You fixed ${resolvedBugs.length} bug(s) and earned XP!`);
            }
            lastBugsPerFile.set(fileUri, currentBugs);
            // Update bugReports in the TreeView state
            bugReports = Array.from(currentBugs).map(bug => ({ description: bug }));
            if (treeDataProvider && typeof treeDataProvider.setState === 'function') {
                treeDataProvider.setState({ ...getState(), bugReports });
            }

            // --- AI analysis (Groq API) ---
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

            // ...existing code for TreeView refresh...
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
        checkAchievements(xp, level, classroomManager?.getLeaderboard()[0]?.username === 'You');
        updateXPAndTreeView();
        // Persist to globalState after every XP change
        context.globalState.update('ecodebuggerState', {
            xp,
            level,
            xpLog
        });
        // Sync with classroom
        if (classroomManager) {
            classroomManager.syncXP(xp, []); // TODO: pass real achievements
        }
    }

    // ...existing code...
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