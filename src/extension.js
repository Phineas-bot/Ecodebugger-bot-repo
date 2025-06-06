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
const xp_1 = require("./utils/xp");
const statusBar_1 = require("./utils/statusBar");
const groqApi_1 = require("./utils/groqApi");
const classroom_1 = require("./utils/classroom");
const sidePanel_1 = require("./feature/sidePanel");
let xp = 0;
let level = 1;
let statusBarItem;
let debounceTimer;
let xpLog = [];
let classroomManager;
let ecoTipsEnabled = true;
let groqAIEnabled = true;
let treeDataProvider; // Declare at top for proper scope
let ecoTipNotifications = []; // Track eco tip notifications
// Map to track last detected issues per file
const lastIssuesPerFile = new Map();
// Map to track last detected bugs per file
const lastBugsPerFile = new Map();
function activate(context) {
    // Restore state from globalState if available
    const saved = context.globalState.get('ecodebuggerState');
    if (saved) {
        xp = saved.xp || 0;
        level = saved.level || 1;
        xpLog = saved.xpLog || [];
        ecoTipNotifications = saved.ecoTipNotifications || []; // Restore ecoTipNotifications
    }
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);
    (0, statusBar_1.updateStatusBar)(statusBarItem, xp, level);
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
    function setState(newState) {
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
    treeDataProvider = (0, sidePanel_1.registerEcoDebuggerTreeView)(context, getState, setState);
    // For demo, use VS Code user info or fallback
    const userId = vscode.env.machineId;
    const username = vscode.env.appName || 'You';
    classroomManager = new classroom_1.ClassroomManager(userId, username);
    // Add classroom commands
    context.subscriptions.push(vscode.commands.registerCommand('ecoDebugger.createClassroom', async () => {
        const pin = await vscode.window.showInputBox({ prompt: 'Enter a PIN for your classroom (optional)' });
        const classroom = await classroomManager?.createClassroom(pin);
        vscode.window.showInformationMessage('Classroom created: ' + classroom?.classroom_id);
        setState(getState()); // Force UI refresh
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ecoDebugger.joinClassroom', async () => {
        const id = await vscode.window.showInputBox({ prompt: 'Enter Classroom ID' });
        const pin = await vscode.window.showInputBox({ prompt: 'Enter PIN (if required)' });
        const ok = await classroomManager?.joinClassroom(id || '', pin);
        vscode.window.showInformationMessage(ok ? 'Joined classroom!' : 'Failed to join classroom.');
        setState(getState()); // Force UI refresh
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ecoDebugger.leaveClassroom', async () => {
        await classroomManager?.leaveClassroom();
        vscode.window.showInformationMessage('Left classroom.');
        setState(getState()); // Force UI refresh
    }));
    // Add test command for Groq API integration
    context.subscriptions.push(vscode.commands.registerCommand('ecoDebugger.testGroqApi', async () => {
        try {
            vscode.window.showInformationMessage('Testing Groq API integration...');
            const codeSample = 'function foo() { return 42; }';
            const result = await (0, groqApi_1.queueGroqRequest)(codeSample);
            vscode.window.showInformationMessage('Groq API result: ' + JSON.stringify(result));
        }
        catch (err) {
            vscode.window.showErrorMessage('Groq API error: ' + err);
        }
    }));
    // Register onDidSaveTextDocument to trigger eco tip and bug analysis
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(async (document) => {
        if (!ecoTipsEnabled) {
            return;
        }
        if (!["python", "javascript", "typescript"].includes(document.languageId)) {
            return;
        }
        const fileUri = document.uri.toString();
        const { provideEcoTips } = require('./utils/ecoTips');
        const tipsResult = await provideEcoTips();
        const currentIssues = new Set((tipsResult.ecoTips || []).map((tip) => String(tip).trim()));
        const previousIssues = lastIssuesPerFile.get(fileUri) || new Set();
        const resolvedIssues = Array.from(previousIssues).filter(issue => !currentIssues.has(issue));
        Array.from(currentIssues).forEach((tip) => {
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
        let currentBugs = new Set();
        let bugReports = treeDataProvider?.state?.bugReports || [];
        // Detect bugs and add to set
        if (detectNestedLoops(text)) {
            currentBugs.add('Nested loops detected');
        }
        if (detectUnusedVariables(text)) {
            currentBugs.add('Unused variable detected');
        }
        // Add more bug detection as needed
        const previousBugs = lastBugsPerFile.get(fileUri) || new Set();
        const resolvedBugs = Array.from(previousBugs).filter(bug => !currentBugs.has(bug));
        // Show bug warnings for current bugs
        Array.from(currentBugs).forEach((bug) => {
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
    }));
    // Pass context to awardXP for persistence
    function awardXP(type) {
        let xpAwarded = type === 'bug' ? 10 : 5;
        xp += xpAwarded;
        let leveledUp = false;
        while (xp >= (0, xp_1.xpForNextLevel)(level)) {
            xp -= (0, xp_1.xpForNextLevel)(level);
            level++;
            leveledUp = true;
            vscode.window.showInformationMessage(`🎉 Congratulations! You reached Level ${level}!`);
        }
        xpLog.push(`${type === 'bug' ? 'Fixed a bug' : 'Applied eco tip'} (+${xpAwarded} XP)`);
        (0, achievements_1.checkAchievements)(xp, level, classroomManager?.getLeaderboard()[0]?.username === 'You');
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
function joinClassroom(code) {
    classroomManager?.joinClassroom(code);
    // TODO: Add cloud/local persistence
    vscode.window.showInformationMessage(`Joined classroom: ${code}`);
}
// Removed webview logic as the extension is now fully TreeView-based
function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}
function updateXPAndTreeView() {
    (0, statusBar_1.updateStatusBar)(statusBarItem, xp, level);
    if (treeDataProvider && typeof treeDataProvider.setState === 'function') {
        treeDataProvider.setState({ xp, level, xpLog });
    }
}
//# sourceMappingURL=extension.js.map