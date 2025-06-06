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
exports.trackEcoTip = trackEcoTip;
exports.trackBugFix = trackBugFix;
exports.checkAchievements = checkAchievements;
exports.getAchievements = getAchievements;
const vscode = __importStar(require("vscode"));
const achievements = {};
// Expanded achievements logic for all badges in FEATURES.md
const achievementDefs = [
    { key: 'Green Coder', desc: 'Apply 10 eco tips.' },
    { key: 'Bug Slayer', desc: 'Fix 20 bugs.' },
    { key: 'Efficient Thinker', desc: 'Reach 500 XP.' },
    { key: 'Team Leader', desc: 'Top leaderboard in classroom mode.' },
];
let ecoTipsApplied = 0;
let bugsFixed = 0;
function trackEcoTip() {
    ecoTipsApplied++;
    if (!achievements['Green Coder'] && ecoTipsApplied >= 10) {
        achievements['Green Coder'] = true;
        vscode.window.showInformationMessage('🎉 Achievement Unlocked: Green Coder!');
    }
}
function trackBugFix() {
    bugsFixed++;
    if (!achievements['Bug Slayer'] && bugsFixed >= 20) {
        achievements['Bug Slayer'] = true;
        vscode.window.showInformationMessage('🎉 Achievement Unlocked: Bug Slayer!');
    }
}
function checkAchievements(xp, level, leaderboardTop = false) {
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
function getAchievements() {
    return achievementDefs.map(a => ({
        name: a.key,
        unlocked: !!achievements[a.key],
        description: a.desc
    }));
}
//# sourceMappingURL=achievements.js.map