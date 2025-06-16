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
exports.initAchievements = initAchievements;
exports.trackEcoTip = trackEcoTip;
exports.trackBugDetection = trackBugDetection;
exports.trackBugFix = trackBugFix;
exports.checkAchievements = checkAchievements;
exports.getAchievements = getAchievements;
const vscode = __importStar(require("vscode"));
const achievements = {};
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
let globalContext;
const bugDetectionTimestamps = new Map();
function unlockAchievement(key) {
    achievements[key] = true;
    vscode.window.showInformationMessage(`🎉 Achievement Unlocked: ${key}!`);
    if (globalContext) {
        const unlocked = globalContext.globalState.get('unlockedAchievements') || {};
        unlocked[key] = true;
        globalContext.globalState.update('unlockedAchievements', unlocked);
    }
    // --- Always refresh the TreeView with the latest achievements ---
    if (typeof globalThis.treeDataProvider?.setState === 'function' && typeof globalThis.getState === 'function') {
        // Use correct relative path for require
        const { getAchievements } = require('./achievements');
        globalThis.treeDataProvider.setState({ ...globalThis.getState(), achievements: getAchievements() });
    }
    // Also trigger any additional UI update hooks (for webview, etc.)
    if (globalThis.updateAchievementsUI) {
        globalThis.updateAchievementsUI();
    }
}
function initAchievements(context) {
    globalContext = context;
    // Restore unlocked achievements
    const unlocked = context.globalState.get('unlockedAchievements') || {};
    for (const key of Object.keys(unlocked)) {
        achievements[key] = true;
    }
}
function trackEcoTip(xp = 0, level = 1, leaderboardTop = false) {
    ecoTipsApplied++;
    if (!achievements['Green Coder'] && ecoTipsApplied >= 10) {
        unlockAchievement('Green Coder');
    }
    checkAchievements(xp, level, leaderboardTop);
}
function trackBugDetection(fileUri, bugDescription) {
    // Call this when a bug is detected
    bugDetectionTimestamps.set(`${fileUri}:${bugDescription}`, Date.now());
}
function trackBugFix(fileUri, bugDescription, xp = 0, level = 1, leaderboardTop = false) {
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
    checkAchievements(xp, level, leaderboardTop);
}
function checkAchievements(xp, level, leaderboardTop = false) {
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
function isFirstFileSave() {
    // Use the persistent achievements object for this check
    return !achievements['First Save'];
}
function isNightTime() {
    const currentHour = new Date().getHours();
    return currentHour >= 0 && currentHour < 5;
}
function getAchievements() {
    // Map badge keys to emoji icons
    const iconMap = {
        'Green Coder': '🌱',
        'Bug Slayer': '🐞',
        'Efficient Thinker': '⚡',
        'Team Leader': '👑',
        'XP Novice': '🎓',
        'XP Master': '🏆',
        'Eco Streak': '🌿',
        'Bug Hunter': '🔎',
        'Bug Exterminator': '🦟',
        'Eco Marathon': '🏃',
        'Fast Fixer': '⏱️',
        'Night Owl': '🦉',
        'First Save': '💾',
        'Classroom Hero': '🦸',
    };
    return achievementDefs.map(a => {
        const unlocked = !!achievements[a.key];
        return {
            name: a.key,
            unlocked,
            description: a.desc,
            icon: iconMap[a.key] || '',
            // For TreeView: VS Code ThemeIcon id for locked/unlocked
            themeIcon: unlocked ? 'verified' : 'circle-outline',
        };
    });
}
//# sourceMappingURL=achievements.js.map