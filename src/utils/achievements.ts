import * as vscode from 'vscode';

const achievements: { [key: string]: boolean } = {};

// Expanded achievements logic for all badges in FEATURES.md
const achievementDefs = [
    { key: 'Green Coder', desc: 'Apply 10 eco tips.' },
    { key: 'Bug Slayer', desc: 'Fix 20 bugs.' },
    { key: 'Efficient Thinker', desc: 'Reach 500 XP.' },
    { key: 'Team Leader', desc: 'Top leaderboard in classroom mode.' },
];
let ecoTipsApplied = 0;
let bugsFixed = 0;

export function trackEcoTip() {
    ecoTipsApplied++;
    if (!achievements['Green Coder'] && ecoTipsApplied >= 10) {
        achievements['Green Coder'] = true;
        vscode.window.showInformationMessage('🎉 Achievement Unlocked: Green Coder!');
    }
}
export function trackBugFix() {
    bugsFixed++;
    if (!achievements['Bug Slayer'] && bugsFixed >= 20) {
        achievements['Bug Slayer'] = true;
        vscode.window.showInformationMessage('🎉 Achievement Unlocked: Bug Slayer!');
    }
}
export function checkAchievements(xp: number, level: number, leaderboardTop = false): void {
    if (!achievements['First 100 XP'] && xp >= 100) {
        achievements['First 100 XP'] = true;
        vscode.window.showInformationMessage('🎉 Achievement Unlocked: First 100 XP!');
    }

    if (!achievements['Level 5'] && level >= 5) {
        achievements['Level 5'] = true;
        vscode.window.showInformationMessage('🎉 Achievement Unlocked: Level 5!');
    }
    if (!achievements['Efficient Thinker'] && xp >= 500) {
        achievements['Efficient Thinker'] = true;
        vscode.window.showInformationMessage('🎉 Achievement Unlocked: Efficient Thinker!');
    }
    if (!achievements['Team Leader'] && leaderboardTop) {
        achievements['Team Leader'] = true;
        vscode.window.showInformationMessage('🎉 Achievement Unlocked: Team Leader!');
    }
}
export function getAchievements() {
    return achievementDefs.map(a => ({
        name: a.key,
        unlocked: !!achievements[a.key],
        description: a.desc
    }));
}