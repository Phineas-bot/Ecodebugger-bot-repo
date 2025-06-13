import * as vscode from 'vscode';

class EcoDebuggerTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
        public readonly contextValue?: string,
        public readonly description?: string,
        public readonly iconPath?: vscode.ThemeIcon | vscode.Uri,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        if (description) { this.description = description; }
        if (iconPath) { this.iconPath = iconPath; }
        if (command) { this.command = command; }
        if (contextValue) { this.contextValue = contextValue; }
    }
}

export class EcoDebuggerTreeDataProvider implements vscode.TreeDataProvider<EcoDebuggerTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<EcoDebuggerTreeItem | undefined | void> = new vscode.EventEmitter<EcoDebuggerTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<EcoDebuggerTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    private state: any = {
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

    setState(newState: any) {
        this.state = { ...this.state, ...newState };
        this.refresh();
    }

    getTreeItem(element: EcoDebuggerTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: EcoDebuggerTreeItem): Thenable<EcoDebuggerTreeItem[]> {
        if (!element) {
            if (this.state.error) {
                return Promise.resolve([
                    new EcoDebuggerTreeItem(
                        this.state.error,
                        vscode.TreeItemCollapsibleState.None,
                        'error',
                        undefined,
                        new vscode.ThemeIcon('error')
                    )
                ]);
            }
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
                return Promise.resolve(
                    (this.state.achievements || []).map((a: any) =>
                        new EcoDebuggerTreeItem(`${a.icon || ''} ${a.name}${a.unlocked ? '' : ' (locked)'}`, vscode.TreeItemCollapsibleState.None, 'badges', a.description, new vscode.ThemeIcon(a.unlocked ? 'verified' : 'circle-outline'), {
                            command: 'ecodebugger.showBadgeInfo',
                            title: 'Show Badge Info',
                            arguments: [new EcoDebuggerTreeItem(a.name, vscode.TreeItemCollapsibleState.None, 'badges', a.description)]
                        })
                    )
                );
            case 'ecoTips':
                // Show all eco tip notifications
                return Promise.resolve(
                    (this.state.ecoTipNotifications || []).map((tip: string, idx: number) => {
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
                            return new EcoDebuggerTreeItem(
                                label,
                                vscode.TreeItemCollapsibleState.None,
                                'ecoTip',
                                description,
                                new vscode.ThemeIcon('lightbulb'),
                                {
                                    command: 'ecodebugger.replaceEcoTipCode',
                                    title: 'Replace Code in Editor',
                                    arguments: [codeSnippet, tip]
                                }
                            );
                        } else {
                            return new EcoDebuggerTreeItem(
                                label,
                                vscode.TreeItemCollapsibleState.None,
                                'ecoTip',
                                description,
                                new vscode.ThemeIcon('lightbulb'),
                                {
                                    command: 'ecodebugger.showEcoTip',
                                    title: 'Show Full Eco Tip',
                                    arguments: [tip]
                                }
                            );
                        }
                    })
                );
            case 'bugReports':
                return Promise.resolve(
                    (this.state.bugReports || []).map((bug: any) => {
                        let label = `🐞 ${bug.description}`;
                        if (bug.suggestion) {
                            label += `: ${bug.suggestion}`;
                        }
                        return new EcoDebuggerTreeItem(
                            label,
                            vscode.TreeItemCollapsibleState.None,
                            'bugReports',
                            undefined,
                            new vscode.ThemeIcon('bug'),
                            {
                                command: 'ecodebugger.copyBug',
                                title: 'Copy Bug',
                                arguments: [new EcoDebuggerTreeItem(label, vscode.TreeItemCollapsibleState.None, 'bugReports')]
                            }
                        );
                    })
                );
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
                const userItems = leaderboard.map((user: any, i: number) => {
                    const isTop = user.username === weeklyTop;
                    const isYou = user.username === currentUser;
                    const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1).toString();
                    const badges = (user.achievements || []).map((a: any) => a.icon || '').join(' ');
                    let label = `${rankIcon} ${user.username} (Classroom XP: ${user.xp}`;
                    if (isYou && typeof user.globalXP === 'number') {
                        label += ` | Global XP: ${user.globalXP}`;
                    }
                    label += ' XP)';
                    if (isTop) { label += ' ⭐'; }
                    if (isYou) { label += ' (You)'; }
                    return new EcoDebuggerTreeItem(
                        label,
                        vscode.TreeItemCollapsibleState.None,
                        'leaderboardUser',
                        badges ? `Badges: ${badges}` : undefined,
                        new vscode.ThemeIcon(isTop ? 'star-full' : 'account')
                    );
                });
                const items = [joinBtn, createBtn];
                if (leaveBtn) { items.push(leaveBtn); }
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

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
}

export function registerEcoDebuggerTreeView(context: vscode.ExtensionContext, getState: () => any, setState: (s: any) => void) {
    const treeDataProvider = new EcoDebuggerTreeDataProvider();
    const treeView = vscode.window.createTreeView('ecodebuggerSidebar', {
        treeDataProvider,
        showCollapseAll: true,
        canSelectMany: false
    });
    context.subscriptions.push(treeView);

    // Context menu commands for settings and bug reports
    context.subscriptions.push(
        vscode.commands.registerCommand('ecodebugger.copyBug', (item: EcoDebuggerTreeItem) => {
            vscode.env.clipboard.writeText(item.label);
            vscode.window.showInformationMessage('Bug description copied!');
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('ecodebugger.markBugFixed', (item: EcoDebuggerTreeItem) => {
            vscode.window.showInformationMessage('Marked as fixed: ' + item.label);
            // Optionally update state here
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('ecodebugger.showBadgeInfo', (item: EcoDebuggerTreeItem) => {
            vscode.window.showInformationMessage(item.description || 'No description');
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('ecodebugger.showEcoTip', (tip: string) => {
            vscode.window.showInformationMessage(tip, { modal: true });
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('ecodebugger.replaceEcoTipCode', async (code: string, tip: string) => {
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
                } else {
                    editBuilder.insert(editor.selection.active, code);
                }
            });
            // Prevent duplicate XP for the same eco tip
            const context = (globalThis as any).vscodeExtensionContext;
            let awardedEcoTips: string[] = [];
            if (context) {
                awardedEcoTips = context.globalState.get('awardedEcoTips', []);
            }
            const tipKey = tip.trim();
            if (awardedEcoTips.includes(tipKey)) {
                vscode.window.showInformationMessage('XP for this eco tip was already awarded.');
            } else {
                if (typeof (globalThis as any).awardXP === 'function') {
                    (globalThis as any).awardXP('ecoTip');
                }
                if (context) {
                    awardedEcoTips.push(tipKey);
                    context.globalState.update('awardedEcoTips', awardedEcoTips);
                }
                vscode.window.showInformationMessage('Eco tip code inserted into editor!');
            }
        })
    );

    // Tree item context menu support
    context.subscriptions.push(
        vscode.commands.registerCommand('ecodebugger.toggleEcoTips', () => {
            setState({ ecoTipsEnabled: !getState().ecoTipsEnabled });
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('ecodebugger.toggleGroqAI', () => {
            setState({ groqAIEnabled: !getState().groqAIEnabled });
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('ecodebugger.resetXP', () => {
            setState({ xp: 0, level: 1, xpLog: [], achievements: [] });
        })
    );

    // Poll for XP/level changes every 500ms to keep TreeView in sync
    setInterval(() => {
        treeDataProvider.setState(getState());
    }, 500);

    return treeDataProvider;
}
