import * as vscode from 'vscode';

export interface UserState {
    xp: number;
    level: number;
    unlockedAchievements: string[]; // Store names or IDs
    appliedEcoTipsCount: number;
    fixedBugsCount: number;
    // Add other state properties as needed
}

const XP_PER_LEVEL_BASE = 100; // XP needed for level 1 to become level 2

export class StateManager {
    private static instance: StateManager;
    private _context: vscode.ExtensionContext;
    private _userState: UserState;

    private constructor(context: vscode.ExtensionContext) {
        this._context = context;
        // Load existing state or initialize a new one with the new fields
        const existingState = context.globalState.get<UserState>('ecoDebuggerUserState');
        if (existingState && typeof existingState.appliedEcoTipsCount !== 'undefined' && typeof existingState.fixedBugsCount !== 'undefined') {
            this._userState = existingState;
        } else {
            this._userState = {
                xp: existingState?.xp || 0,
                level: existingState?.level || 1,
                unlockedAchievements: existingState?.unlockedAchievements || [],
                appliedEcoTipsCount: 0,
                fixedBugsCount: 0,
            };
        }
    }

    public static initialize(context: vscode.ExtensionContext): void {
        if (!StateManager.instance) {
            StateManager.instance = new StateManager(context);
        }
    }

    public static get(): StateManager {
        if (!StateManager.instance) {
            throw new Error("StateManager not initialized. Call initialize first.");
        }
        return StateManager.instance;
    }

    getState(): Readonly<UserState> {
        return this._userState;
    }

    public addXP(points: number): { levelUp: boolean; newLevel?: number, currentXP?: number, currentLevel?: number } {
        this._userState.xp += points;
        let levelUp = false;
        let newLevel: number | undefined;

        // Calculate XP needed for the current level
        let xpNeededForNextLevel = this._userState.level * XP_PER_LEVEL_BASE;

        while (this._userState.xp >= xpNeededForNextLevel) {
            this._userState.xp -= xpNeededForNextLevel; 
            this._userState.level++;
            levelUp = true;
            newLevel = this._userState.level;
            xpNeededForNextLevel = this._userState.level * XP_PER_LEVEL_BASE; // Recalculate for next potential level up
        }
        this.saveState();
        return { levelUp, newLevel, currentXP: this._userState.xp, currentLevel: this._userState.level };
    }

    public incrementAppliedEcoTips(count: number = 1): void {
        this._userState.appliedEcoTipsCount = (this._userState.appliedEcoTipsCount || 0) + count;
        // As per FEATURES.MD: Apply an eco tip → +5 XP
        this.addXP(5 * count);
        this.saveState();
    }

    public incrementFixedBugsCount(count: number = 1): void {
        this._userState.fixedBugsCount = (this._userState.fixedBugsCount || 0) + count;
        // As per FEATURES.MD: Fix a bug → +10 XP
        this.addXP(10 * count);
        this.saveState();
    }

    public unlockAchievement(achievementName: string): boolean {
        if (!this._userState.unlockedAchievements.includes(achievementName)) {
            this._userState.unlockedAchievements.push(achievementName);
            this.saveState();
            return true; // Newly unlocked
        }
        return false; // Already unlocked
    }

    private saveState(): void {
        this._context.globalState.update('ecoDebuggerUserState', this._userState);
        console.log('User state saved:', this._userState);
    }

    public resetState(): void {
        this._userState = {
            xp: 0,
            level: 1,
            unlockedAchievements: [],
            appliedEcoTipsCount: 0,
            fixedBugsCount: 0,
        };
        this.saveState();
        console.log('User state reset.');
        // Consider adding a command to trigger this for testing
    }
} 