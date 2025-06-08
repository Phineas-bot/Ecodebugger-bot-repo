import * as vscode from 'vscode';

const achievements: { [key: string]: boolean } = {};

// Expanded achievements logic for all badges in
const achievementDefs = [
    { key: 'Green Coder', desc: 'Apply 10 eco tips.' },
    { key: 'Bug Slayer', desc: 'Fix 20 bugs.' },
    { key: 'Efficient Thinker', desc: 'Reach 500 XP.' },
    { key: 'Team Leader', desc: 'Top leaderboard in classroom mode.' },
    // New achievements
    { key: 'XP Novice', desc: 'Reach 50 XP.' },
    { key: 'XP Master', desc: 'Reach 1000 XP.' },
    { key: 'Eco Streak', desc: 'Apply eco tips 5 times in a row without introducing a new bug.' },
    { key: 'Bug Hunter', desc: 'Detect 50 bugs.' },
    { key: 'Bug Exterminator', desc: 'Fix 100 bugs.' },
    { key: 'Eco Marathon', desc: 'Apply 100 eco tips.' },
    { key: 'Fast Fixer', desc: 'Fix a bug within 1 minute of detection.' },
    { key: 'Night Owl', desc: 'Earn XP between midnight and 5am.' },
    { key: 'First Save', desc: 'Earn XP on your first file save.' },
    { key: 'Classroom Hero', desc: 'Earn 1000 XP in classroom mode.' },
];
let ecoTipsApplied = 0;
let bugsFixed = 0;
let globalContext: vscode.ExtensionContext | undefined;
const bugDetectionTimestamps: Map<string, number> = new Map();

function unlockAchievement(key: string) {
    achievements[key] = true;
    vscode.window.showInformationMessage(`🎉 Achievement Unlocked: ${key}!`);
    if (globalContext) {
        const unlocked = globalContext.globalState.get<{ [key: string]: boolean }>('unlockedAchievements') || {};
        unlocked[key] = true;
        globalContext.globalState.update('unlockedAchievements', unlocked);
    }
}

export function initAchievements(context: vscode.ExtensionContext) {
    globalContext = context;
    // Restore unlocked achievements
    const unlocked = context.globalState.get<{ [key: string]: boolean }>('unlockedAchievements') || {};
    for (const key of Object.keys(unlocked)) {
        achievements[key] = true;
    }
}

export function trackEcoTip() {
    ecoTipsApplied++;
    if (!achievements['Green Coder'] && ecoTipsApplied >= 10) {
        unlockAchievement('Green Coder');
    }
}

export function trackBugDetection(fileUri: string, bugDescription: string) {
    // Call this when a bug is detected
    bugDetectionTimestamps.set(`${fileUri}:${bugDescription}`, Date.now());
}

export function trackBugFix(fileUri: string, bugDescription: string) {
    // Call this when a bug is fixed
    const key = `${fileUri}:${bugDescription}`;
    const detectedAt = bugDetectionTimestamps.get(key);
    if (detectedAt && Date.now() - detectedAt <= 60 * 1000) {
        if (!achievements['Fast Fixer']) {
            unlockAchievement('Fast Fixer');
        }
    }
    bugDetectionTimestamps.delete(key);
    bugsFixed++;
    if (!achievements['Bug Slayer'] && bugsFixed >= 20) {
        unlockAchievement('Bug Slayer');
    }
}

export function checkAchievements(xp: number, level: number, leaderboardTop = false): void {
    if (!achievements['First 100 XP'] && xp >= 100) {
        unlockAchievement('First 100 XP');
    }
    if (!achievements['Level 5'] && level >= 5) {
        unlockAchievement('Level 5');
    }
    if (!achievements['Efficient Thinker'] && xp >= 500) {
        unlockAchievement('Efficient Thinker');
    }
    if (!achievements['Team Leader'] && leaderboardTop) {
        unlockAchievement('Team Leader');
    }
    if (!achievements['XP Novice'] && xp >= 50) {
        unlockAchievement('XP Novice');
    }
    if (!achievements['XP Master'] && xp >= 1000) {
        unlockAchievement('XP Master');
    }
    if (!achievements['Eco Streak'] && ecoTipsApplied >= 5 && bugsFixed === 0) {
        unlockAchievement('Eco Streak');
    }
    if (!achievements['Bug Hunter'] && bugsFixed >= 50) {
        unlockAchievement('Bug Hunter');
    }
    if (!achievements['Bug Exterminator'] && bugsFixed >= 100) {
        unlockAchievement('Bug Exterminator');
    }
    if (!achievements['Eco Marathon'] && ecoTipsApplied >= 100) {
        unlockAchievement('Eco Marathon');
    }
    if (!achievements['Night Owl'] && isNightTime() && xp > 0) {
        unlockAchievement('Night Owl');
    }
    if (!achievements['First Save'] && xp > 0) {
        unlockAchievement('First Save');
    }
    if (!achievements['Classroom Hero'] && xp >= 1000 && leaderboardTop) {
        unlockAchievement('Classroom Hero');
    }
}

function isFirstFileSave(): boolean {
    // Use the persistent achievements object for this check
    return !achievements['First Save'];
}

function isNightTime(): boolean {
    const currentHour = new Date().getHours();
    return currentHour >= 0 && currentHour < 5;
}

export function getAchievements() {
    return achievementDefs.map(a => ({
        name: a.key,
        unlocked: !!achievements[a.key],
        description: a.desc
    }));
}
