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
exports.EcoDebuggerTreeDataProvider = void 0;
exports.registerEcoDebuggerTreeView = registerEcoDebuggerTreeView;
const vscode = __importStar(require("vscode"));
class EcoDebuggerTreeItem extends vscode.TreeItem {
    label;
    collapsibleState;
    contextValue;
    description;
    iconPath;
    command;
    constructor(label, collapsibleState = vscode.TreeItemCollapsibleState.None, contextValue, description, iconPath, command) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.contextValue = contextValue;
        this.description = description;
        this.iconPath = iconPath;
        this.command = command;
        if (description) {
            this.description = description;
        }
        if (iconPath) {
            this.iconPath = iconPath;
        }
        if (command) {
            this.command = command;
        }
        if (contextValue) {
            this.contextValue = contextValue;
        }
    }
}
class EcoDebuggerTreeDataProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    state = {
        xp: 0,
        level: 1,
        achievements: [],
        xpLog: [],
        bugReports: [],
        leaderboard: [],
        classroom: {},
        ecoTipsEnabled: true,
        groqAIEnabled: true
    };
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.refresh();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            return Promise.resolve([
                new EcoDebuggerTreeItem('XP/Level', vscode.TreeItemCollapsibleState.Collapsed, 'xpLevel', undefined, new vscode.ThemeIcon('star')), // icon
                new EcoDebuggerTreeItem('Badges', vscode.TreeItemCollapsibleState.Collapsed, 'badges', undefined, new vscode.ThemeIcon('trophy')), // icon
                new EcoDebuggerTreeItem('Eco Tips', vscode.TreeItemCollapsibleState.Collapsed, 'ecoTips', undefined, new vscode.ThemeIcon('leaf')), // icon
                new EcoDebuggerTreeItem('Bug Reports', vscode.TreeItemCollapsibleState.Collapsed, 'bugReports', undefined, new vscode.ThemeIcon('bug')), // icon
                new EcoDebuggerTreeItem('Leaderboard', vscode.TreeItemCollapsibleState.Collapsed, 'leaderboard', undefined, new vscode.ThemeIcon('organization')), // icon
                new EcoDebuggerTreeItem('Settings', vscode.TreeItemCollapsibleState.Collapsed, 'settings', undefined, new vscode.ThemeIcon('settings-gear')), // icon
            ]);
        }
        switch (element.contextValue) {
            case 'xpLevel':
                return Promise.resolve([
                    new EcoDebuggerTreeItem(`Level: ${this.state.level}`, vscode.TreeItemCollapsibleState.None, undefined, undefined, new vscode.ThemeIcon('star-empty')),
                    new EcoDebuggerTreeItem(`XP: ${this.state.xp}`, vscode.TreeItemCollapsibleState.None, undefined, undefined, new vscode.ThemeIcon('symbol-number')),
                ]);
            case 'badges':
                return Promise.resolve((this.state.achievements || []).map((a) => new EcoDebuggerTreeItem(`${a.icon || ''} ${a.name}${a.unlocked ? '' : ' (locked)'}`, vscode.TreeItemCollapsibleState.None, 'badges', a.description, new vscode.ThemeIcon(a.unlocked ? 'verified' : 'circle-outline'), {
                    command: 'ecodebugger.showBadgeInfo',
                    title: 'Show Badge Info',
                    arguments: [new EcoDebuggerTreeItem(a.name, vscode.TreeItemCollapsibleState.None, 'badges', a.description)]
                })));
            case 'ecoTips':
                // Show all eco tip notifications
                return Promise.resolve((this.state.ecoTipNotifications || []).map((tip, idx) => {
                    // Use the first line as label, rest as description if multi-line
                    const lines = String(tip).split(/\r?\n/);
                    const label = lines[0].length > 60 ? lines[0].slice(0, 60) + '...' : lines[0];
                    const description = lines.slice(1).join(' ').trim() || undefined;
                    // Detect code block (markdown style)
                    const codeBlockMatch = tip.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
                    const hasCode = !!codeBlockMatch;
                    const codeSnippet = hasCode ? codeBlockMatch[1] : undefined;
                    // If code, add a special command for replacement
                    if (hasCode) {
                        return new EcoDebuggerTreeItem(label, vscode.TreeItemCollapsibleState.None, 'ecoTip', description, new vscode.ThemeIcon('lightbulb'), {
                            command: 'ecodebugger.replaceEcoTipCode',
                            title: 'Replace Code in Editor',
                            arguments: [codeSnippet, tip]
                        });
                    }
                    else {
                        return new EcoDebuggerTreeItem(label, vscode.TreeItemCollapsibleState.None, 'ecoTip', description, new vscode.ThemeIcon('lightbulb'), {
                            command: 'ecodebugger.showEcoTip',
                            title: 'Show Full Eco Tip',
                            arguments: [tip]
                        });
                    }
                }));
            case 'bugReports':
                return Promise.resolve((this.state.bugReports || []).map((bug) => {
                    let label = `🐞 ${bug.description}`;
                    if (bug.suggestion) {
                        label += `: ${bug.suggestion}`;
                    }
                    return new EcoDebuggerTreeItem(label, vscode.TreeItemCollapsibleState.None, 'bugReports', undefined, new vscode.ThemeIcon('bug'), {
                        command: 'ecodebugger.copyBug',
                        title: 'Copy Bug',
                        arguments: [new EcoDebuggerTreeItem(label, vscode.TreeItemCollapsibleState.None, 'bugReports')]
                    });
                }));
            case 'leaderboard': {
                const leaderboard = this.state.leaderboard || [];
                const weeklyTop = this.state.classroom?.weeklyTop;
                const currentUser = this.state.githubUsername || 'You';
                // Add join/create classroom buttons as special items at the top
                const joinBtn = new EcoDebuggerTreeItem('Join Classroom...', vscode.TreeItemCollapsibleState.None, 'joinClassroom', undefined, new vscode.ThemeIcon('sign-in'), {
                    command: 'ecoDebugger.joinClassroom',
                    title: 'Join Classroom',
                    arguments: []
                });
                const createBtn = new EcoDebuggerTreeItem('Create Classroom...', vscode.TreeItemCollapsibleState.None, 'createClassroom', undefined, new vscode.ThemeIcon('add'), {
                    command: 'ecoDebugger.createClassroom',
                    title: 'Create Classroom',
                    arguments: []
                });
                const leaveBtn = (this.state.classroom?.code)
                    ? new EcoDebuggerTreeItem('Leave Classroom', vscode.TreeItemCollapsibleState.None, 'leaveClassroom', undefined, new vscode.ThemeIcon('sign-out'), {
                        command: 'ecoDebugger.leaveClassroom',
                        title: 'Leave Classroom',
                        arguments: []
                    })
                    : undefined;
                // Show current user at the top if present
                const userItems = leaderboard.map((user, i) => {
                    const isTop = user.username === weeklyTop;
                    const isYou = user.username === currentUser;
                    const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1).toString();
                    const badges = (user.achievements || []).map((a) => a.icon || '').join(' ');
                    let label = `${rankIcon} ${user.username} (Classroom XP: ${user.xp}`;
                    if (isYou && typeof user.globalXP === 'number') {
                        label += ` | Global XP: ${user.globalXP}`;
                    }
                    label += ' XP)';
                    if (isTop) {
                        label += ' ⭐';
                    }
                    if (isYou) {
                        label += ' (You)';
                    }
                    return new EcoDebuggerTreeItem(label, vscode.TreeItemCollapsibleState.None, 'leaderboardUser', badges ? `Badges: ${badges}` : undefined, new vscode.ThemeIcon(isTop ? 'star-full' : 'account'));
                });
                const items = [joinBtn, createBtn];
                if (leaveBtn) {
                    items.push(leaveBtn);
                }
                return Promise.resolve([...items, ...userItems]);
            }
            case 'leaderboardUser': {
                // Show more stats for a user if needed
                // Placeholder for future expansion
                return Promise.resolve([]);
            }
            case 'settings':
                return Promise.resolve([
                    new EcoDebuggerTreeItem(`Enable Eco Tips: ${this.state.ecoTipsEnabled ? '✅' : '❌'}`, vscode.TreeItemCollapsibleState.None, 'settings', undefined, new vscode.ThemeIcon('leaf'), {
                        command: 'ecodebugger.toggleEcoTips',
                        title: 'Toggle Eco Tips',
                        arguments: []
                    }),
                    new EcoDebuggerTreeItem(`Enable Groq AI: ${this.state.groqAIEnabled ? '✅' : '❌'}`, vscode.TreeItemCollapsibleState.None, 'settings', undefined, new vscode.ThemeIcon('rocket'), {
                        command: 'ecodebugger.toggleGroqAI',
                        title: 'Toggle Groq AI',
                        arguments: []
                    }),
                    new EcoDebuggerTreeItem('Reset XP/Achievements', vscode.TreeItemCollapsibleState.None, 'settings', undefined, new vscode.ThemeIcon('refresh'), {
                        command: 'ecodebugger.resetXP',
                        title: 'Reset XP/Achievements',
                        arguments: []
                    })
                ]);
            default:
                return Promise.resolve([]);
        }
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
}
exports.EcoDebuggerTreeDataProvider = EcoDebuggerTreeDataProvider;
function registerEcoDebuggerTreeView(context, getState, setState) {
    const treeDataProvider = new EcoDebuggerTreeDataProvider();
    const treeView = vscode.window.createTreeView('ecodebuggerSidebar', {
        treeDataProvider,
        showCollapseAll: true,
        canSelectMany: false
    });
    context.subscriptions.push(treeView);
    // Context menu commands for settings and bug reports
    context.subscriptions.push(vscode.commands.registerCommand('ecodebugger.copyBug', (item) => {
        vscode.env.clipboard.writeText(item.label);
        vscode.window.showInformationMessage('Bug description copied!');
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ecodebugger.markBugFixed', (item) => {
        vscode.window.showInformationMessage('Marked as fixed: ' + item.label);
        // Optionally update state here
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ecodebugger.showBadgeInfo', (item) => {
        vscode.window.showInformationMessage(item.description || 'No description');
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ecodebugger.showEcoTip', (tip) => {
        vscode.window.showInformationMessage(tip, { modal: true });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ecodebugger.replaceEcoTipCode', async (code, tip) => {
        if (!code) {
            vscode.window.showWarningMessage('No code snippet found in this eco tip.');
            return;
        }
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor to insert code.');
            return;
        }
        await editor.edit(editBuilder => {
            if (editor.selection && !editor.selection.isEmpty) {
                editBuilder.replace(editor.selection, code);
            }
            else {
                editBuilder.insert(editor.selection.active, code);
            }
        });
        // Prevent duplicate XP for the same eco tip
        const context = globalThis.vscodeExtensionContext;
        let awardedEcoTips = [];
        if (context) {
            awardedEcoTips = context.globalState.get('awardedEcoTips', []);
        }
        const tipKey = tip.trim();
        if (awardedEcoTips.includes(tipKey)) {
            vscode.window.showInformationMessage('XP for this eco tip was already awarded.');
        }
        else {
            if (typeof globalThis.awardXP === 'function') {
                globalThis.awardXP('ecoTip');
            }
            if (context) {
                awardedEcoTips.push(tipKey);
                context.globalState.update('awardedEcoTips', awardedEcoTips);
            }
            vscode.window.showInformationMessage('Eco tip code inserted into editor!');
        }
    }));
    // Tree item context menu support
    context.subscriptions.push(vscode.commands.registerCommand('ecodebugger.toggleEcoTips', () => {
        setState({ ecoTipsEnabled: !getState().ecoTipsEnabled });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ecodebugger.toggleGroqAI', () => {
        setState({ groqAIEnabled: !getState().groqAIEnabled });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ecodebugger.resetXP', () => {
        setState({ xp: 0, level: 1, xpLog: [], achievements: [] });
    }));
    // Poll for XP/level changes every 500ms to keep TreeView in sync
    setInterval(() => {
        treeDataProvider.setState(getState());
    }, 500);
    return treeDataProvider;
}
//# sourceMappingURL=sidePanel.js.map