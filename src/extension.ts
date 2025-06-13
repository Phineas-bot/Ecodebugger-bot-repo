import * as dotenv from 'dotenv';
dotenv.config();
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
let classroomStatusBarItem: vscode.StatusBarItem | undefined;

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

function updateClassroomStatusBar() {
    if (!classroomManager) { return; }
    const code = classroomManager.getClassroomId();
    if (!classroomStatusBarItem) {
        classroomStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
        classroomStatusBarItem.command = 'ecoDebugger.copyClassroomCode';
    }
    if (code) {
        classroomStatusBarItem.text = `$(organization) Classroom: ${code}`;
        classroomStatusBarItem.tooltip = 'Click to copy classroom code';
        classroomStatusBarItem.show();
    } else {
        classroomStatusBarItem.hide();
    }
}

let githubUsername: string | undefined = undefined;

async function getGitHubUsername(): Promise<string> {
    const session = await getGitHubSession();
    if (session) {
        githubUsername = session.account.label;
        return githubUsername;
    }
    githubUsername = undefined;
    return 'You';
}

let setState: (s: any) => void;
let getState: () => any;

export function activate(context: vscode.ExtensionContext): void {
    (globalThis as any).vscodeExtensionContext = context;
    // Restore state from globalState if available
    const saved = context.globalState.get('ecodebuggerState') as any;
    if (saved) {
        xp = saved.xp || 0;
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

    // --- Always register the TreeView at startup ---
    let state = {
        xp,
        level,
        achievements: [],
        xpLog,
        bugReports: [],
        ecoTipsEnabled,
        groqAIEnabled,
        leaderboard: [],
        classroom: {},
        githubUsername: undefined
    };
    setState = function(newState: any) {
        state = { ...state, ...newState };
        if (treeDataProvider && typeof treeDataProvider.setState === 'function') {
            treeDataProvider.setState(getState());
        }
    };
    getState = function() {
        return { ...state };
    };
    treeDataProvider = registerEcoDebuggerTreeView(context, getState, setState);
    (globalThis as any).treeDataProvider = treeDataProvider;
    (globalThis as any).getState = getState;

    // --- Async logic for auth and classroom manager ---
    (async () => {
        try {
            classroomManager = await ClassroomManager.createWithAuth();
            const username = classroomManager["username"];
            // Update state with real data after auth
            setState({
                achievements: require('./utils/achievements').getAchievements(),
                leaderboard: classroomManager?.getLeaderboard() || [],
                classroom: {
                    code: classroomManager?.getClassroomId() || '',
                    weeklyTop: classroomManager?.getLeaderboard()?.[0]?.username || '',
                },
                githubUsername: username
            });
            await showGitHubUserInStatusBar();
            updateClassroomStatusBar();
        } catch (err) {
            // Show error in the TreeView itself
            setState({
                achievements: [],
                leaderboard: [],
                classroom: {},
                githubUsername: undefined,
                bugReports: [],
                ecoTipsEnabled,
                groqAIEnabled,
                xp,
                level,
                xpLog,
                ecoTipNotifications,
                error: 'Supabase Auth failed: ' + String(err)
            });
            vscode.window.showErrorMessage('Supabase Auth failed: ' + String(err));
        }
    })();

    // Add classroom commands
    context.subscriptions.push(
        vscode.commands.registerCommand('ecoDebugger.createClassroom', async () => {
            const pin = await vscode.window.showInputBox({ prompt: 'Enter a PIN for your classroom (optional)' });
            const classroom = await classroomManager?.createClassroom(pin);
            vscode.window.showInformationMessage('Classroom created: ' + classroom?.classroom_id);
            setState(getState());
            await showGitHubUserInStatusBar();
            updateClassroomStatusBar();
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
            updateClassroomStatusBar();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('ecoDebugger.copyClassroomCode', async () => {
            if (classroomManager) {
                const code = classroomManager.getClassroomId();
                if (code) {
                    await vscode.env.clipboard.writeText(code);
                    vscode.window.showInformationMessage(`Classroom code copied: ${code}`);
                } else {
                    vscode.window.showWarningMessage('Not in a classroom.');
                }
            }
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('ecoDebugger.showClassroomDetails', async () => {
            if (classroomManager && classroomManager["classroom"] && classroomManager["classroom"].users) {
                const code = classroomManager.getClassroomId();
                const users = classroomManager["classroom"].users;
                const leaderboard = classroomManager.getLeaderboard();
                const msg = `Classroom: ${code}\n\nMembers:\n${users.map((u: any, i: number) => `${i+1}. ${u.username} (${u.xp} XP)`).join('\n')}`;
                vscode.window.showInformationMessage(msg, { modal: true });
            } else {
                vscode.window.showWarningMessage('Not in a classroom.');
            }
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('ecoDebugger.leaveClassroom', async () => {
            if (classroomManager && classroomManager["leaveClassroom"]) {
                await classroomManager.leaveClassroom();
                vscode.window.showInformationMessage('Left classroom.');
                setState(getState());
                updateClassroomStatusBar();
            }
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
            // --- Collect static bugs and eco tips for Bug Reports tab ---
            let currentFileBugReports: any[] = [];
            // Static bug detection
            const { detectNestedLoops, detectUnusedVariables } = require('./utils/bugs');
            const text = document.getText();
            let currentBugs: Set<string> = new Set();
            if (detectNestedLoops(text)) {
                currentBugs.add('Nested loops detected');
            }
            if (detectUnusedVariables(text)) {
                currentBugs.add('Unused variable detected');
            }
            // Add static bugs to currentFileBugReports and show notification
            Array.from(currentBugs).forEach((bug: string) => {
                currentFileBugReports.push({ file: fileUri, description: bug });
                vscode.window.showWarningMessage('🐞 Bug: ' + bug);
            });
            // --- Local eco tips (static analyzer) ---
            if (ecoTipsEnabled) {
                const { provideEcoTips } = require('./utils/ecoTips');
                const tipsResult = await provideEcoTips();
                const localEcoTips = (tipsResult.ecoTips || []).map((tip: string) => String(tip).trim());
                // Add local eco tips to currentFileBugReports as suggestions and show notification
                localEcoTips.forEach((tip: string) => {
                    currentFileBugReports.push({ file: fileUri, description: 'Eco Tip', suggestion: tip });
                    vscode.window.showWarningMessage('💡 Eco Tip: ' + tip);
                });
                // XP/level logic (unchanged)
                const previousIssues: Set<string> = lastIssuesPerFile.get(fileUri) || new Set<string>();
                const currentIssues: Set<string> = new Set(localEcoTips);
                if (previousIssues.size > 0 && currentIssues.size < previousIssues.size) {
                    const resolvedCount = previousIssues.size - currentIssues.size;
                    for (let i = 0; i < resolvedCount; i++) {
                        awardXP('ecoTip');
                    }
                    vscode.window.showInformationMessage(`🎉 You resolved ${resolvedCount} eco issue(s) and earned XP!`);
                }
                lastIssuesPerFile.set(fileUri, currentIssues);
            }
            // Only award XP for bugs if the number decreased
            const previousBugs: Set<string> = lastBugsPerFile.get(fileUri) || new Set();
            if (previousBugs.size > 0 && currentBugs.size < previousBugs.size) {
                const resolvedCount = previousBugs.size - currentBugs.size;
                for (let i = 0; i < resolvedCount; i++) {
                    awardXP('bug');
                }
                vscode.window.showInformationMessage(`🎉 You fixed ${resolvedCount} bug(s) and earned XP!`);
            }
            lastBugsPerFile.set(fileUri, currentBugs);
            // --- Merge current file's bug reports into global bugReports ---
            bugReports = bugReports.filter((r: any) => r.file !== fileUri).concat(currentFileBugReports);
            if (treeDataProvider && typeof treeDataProvider.setState === 'function') {
                treeDataProvider.setState({ ...getState(), bugReports });
            }
            // --- AI eco tips (Groq API) go to Eco Tips tab only ---
            if (groqAIEnabled) {
                try {
                    const { queueGroqRequest } = require('./utils/groqApi');
                    const aiResult = await queueGroqRequest(document.getText());
                    // Accept both array and string results for eco tips
                    if (aiResult && Array.isArray(aiResult.ecoTips)) {
                        aiResult.ecoTips.forEach((tip: string) => {
                            if (!ecoTipNotifications.includes(tip)) {
                                ecoTipNotifications.push(tip);
                            }
                        });
                    } else if (aiResult && typeof aiResult === 'string') {
                        if (!ecoTipNotifications.includes(aiResult)) {
                            ecoTipNotifications.push(aiResult);
                        }
                    }
                    // Always update the TreeView after adding tips
                    if (treeDataProvider && typeof treeDataProvider.setState === 'function') {
                        treeDataProvider.setState(getState());
                    }
                    const aiMsg = aiResult && aiResult.explanation ? aiResult.explanation : JSON.stringify(aiResult);
                    vscode.window.showInformationMessage('AI analysis: ' + aiMsg);
                } catch (err) {
                    const errorMsg = 'AI analysis failed: ' + String(err);
                    vscode.window.showWarningMessage(errorMsg);
                    if (!ecoTipNotifications.includes(errorMsg)) {
                        ecoTipNotifications.push(errorMsg);
                    }
                    if (treeDataProvider && typeof treeDataProvider.setState === 'function') {
                        treeDataProvider.setState(getState());
                    }
                }
            }
        })
    );

    // Pass context to awardXP for persistence
    function awardXP(type: 'bug' | 'ecoTip') {
        let xpAwarded = type === 'bug' ? 10 : 10; // Changed ecoTip XP from 5 to 10
        if (classroomManager && classroomManager.getClassroomId()) {
            const userId = classroomManager["userId"];
            const user = classroomManager.getLeaderboard().find(u => u.user_id === userId);
            let newClassroomXP = (user ? user.xp : 0) + xpAwarded;
            classroomManager.addOrUpdateUser(newClassroomXP, []); // Update classroom XP
            // --- Add to global XP as well ---
            xp += xpAwarded;
            let leveledUp = false;
            while (xp >= xpForNextLevel(level)) {
                xp -= xpForNextLevel(level);
                level++;
                leveledUp = true;
                vscode.window.showInformationMessage(`🎉 Congratulations! You reached Level ${level}!`);
            }
            xpLog.push(`${type === 'bug' ? 'Fixed a bug' : 'Applied eco tip'} (+${xpAwarded} XP)`);
            // --- Force status bar and UI update immediately ---
            updateXPAndTreeView();
            checkAchievements(xp, level, false);
            const { getAchievements } = require('./utils/achievements');
            treeDataProvider.setState({ ...getState(), achievements: getAchievements() });
            context.globalState.update('ecodebuggerState', {
                xp,
                level,
                xpLog
            });
        } else {
            xp += xpAwarded;
            let leveledUp = false;
            while (xp >= xpForNextLevel(level)) {
                xp -= xpForNextLevel(level);
                level++;
                leveledUp = true;
                vscode.window.showInformationMessage(`🎉 Congratulations! You reached Level ${level}!`);
            }
            xpLog.push(`${type === 'bug' ? 'Fixed a bug' : 'Applied eco tip'} (+${xpAwarded} XP)`);
            // --- Force status bar and UI update immediately ---
            updateXPAndTreeView();
            checkAchievements(xp, level, false);
            const { getAchievements } = require('./utils/achievements');
            treeDataProvider.setState({ ...getState(), achievements: getAchievements() });
            context.globalState.update('ecodebuggerState', {
                xp,
                level,
                xpLog
            });
        }
    }
    // Make awardXP globally accessible for sidebar/TreeView commands
    (globalThis as any).awardXP = awardXP;

    async function joinClassroom(code: string) {
        if (classroomManager && await classroomManager.joinClassroom(code)) {
            const userId = classroomManager["userId"];
            let user = classroomManager.getLeaderboard().find(u => u.user_id === userId);
            if (!user) {
                classroomManager.addOrUpdateUser(0, []);
            }
            updateXPAndTreeView();
            vscode.window.showInformationMessage(`Joined classroom: ${code}`);
        } else {
            vscode.window.showWarningMessage('Failed to join classroom.');
        }
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

    updateClassroomStatusBar();
    if (classroomStatusBarItem) {
        context.subscriptions.push(classroomStatusBarItem);
    }

    // Add this global function to allow achievements.ts to trigger a UI update
    (globalThis as any).updateAchievementsUI = function() {
        if (typeof treeDataProvider?.setState === 'function') {
            const { getAchievements } = require('./utils/achievements');
            treeDataProvider.setState({ ...getState(), achievements: getAchievements() });
        }
    };
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
    console.log('updateXPAndTreeView called with:', { xp, level }); // Debugging log
    updateStatusBar(statusBarItem, xp, level);
    if (treeDataProvider && typeof treeDataProvider.setState === 'function') {
        treeDataProvider.setState({
            xp,
            level,
            xpLog,
            ecoTipNotifications,
            ecoTipsEnabled,
            groqAIEnabled,
            bugReports,
            achievements: (require('./utils/achievements').getAchievements) ? require('./utils/achievements').getAchievements() : [],
            leaderboard: classroomManager?.getLeaderboard() || [],
            classroom: {
                code: classroomManager?.getClassroomId() || '',
                weeklyTop: classroomManager?.getLeaderboard()?.[0]?.username || '',
            },
            githubUsername
        });
    }
}

let bugReports: any[] = [];