// Achievements: track, unlock, check, show modal, badges
export type Achievement = {
    id: string;
    name: string;
    description: string;
    unlocked: boolean;
};

export const achievements: Achievement[] = [
    { id: 'green-coder', name: 'Green Coder', description: 'Apply 10 eco tips.', unlocked: false },
    { id: 'bug-slayer', name: 'Bug Slayer', description: 'Fix 20 bugs.', unlocked: false },
    { id: 'efficient-thinker', name: 'Efficient Thinker', description: 'Reach 500 XP.', unlocked: false },
    { id: 'team-leader', name: 'Team Leader', description: 'Top leaderboard in classroom mode.', unlocked: false },
];

export function getAchievements(context: import('vscode').ExtensionContext): Achievement[] {
    return context.globalState.get<Achievement[]>('ecodebugger.achievements', achievements) || achievements;
}

export function unlockAchievement(id: string, context: import('vscode').ExtensionContext) {
    const list = getAchievements(context);
    const idx = list.findIndex(a => a.id === id);
    if (idx !== -1 && !list[idx].unlocked) {
        list[idx].unlocked = true;
        context.globalState.update('ecodebugger.achievements', list);
        showAchievementModal(list[idx]);
    }
}

export function showAchievementModal(achievement: Achievement) {
    import('vscode').then(vscode => {
        vscode.window.showInformationMessage(`Achievement unlocked: ${achievement.name}! 🏆 ${achievement.description}`);
    });
}
