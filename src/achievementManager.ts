import * as vscode from 'vscode';
import { achievements as availableAchievements, Achievement } from './feature/achievements';
import { StateManager } from './stateManager';
import { updateWebviewContent } from './extension';

export function checkAndUnlockAchievements() {
    const stateManager = StateManager.get();
    if (!stateManager) {
        console.error("StateManager not initialized when checking achievements.");
        return;
    }
    const userState = stateManager.getState();

    availableAchievements.forEach(achievement => {
        if (userState.unlockedAchievements.includes(achievement.name)) {
            return; // Already unlocked
        }

        let unlockedNow = false;
        switch (achievement.name) {
            case 'Green Coder':
                // For FEATURES.MD: "Apply 10 eco tips."
                if (userState.appliedEcoTipsCount >= 10) {
                    unlockedNow = true;
                }
                break;
            case 'Bug Slayer':
                // For FEATURES.MD: "Fix 20 bugs."
                if (userState.fixedBugsCount >= 20) {
                    unlockedNow = true;
                }
                break;
            case 'Efficient Thinker':
                // For FEATURES.MD: "Reach 500 XP."
                if (userState.xp >= 500) {
                    unlockedNow = true;
                }
                break;
            case 'Team Leader':
                // For FEATURES.MD: "Top leaderboard in classroom mode."
                // Placeholder: Unlock if user reaches level 5.
                if (userState.level >= 5) {
                    unlockedNow = true;
                }
                break;
        }

        if (unlockedNow) {
            if (stateManager.unlockAchievement(achievement.name)) {
                vscode.window.showInformationMessage(`🏆 Achievement Unlocked: ${achievement.name}!`);
                updateWebviewContent();
            }
        }
    });
} 