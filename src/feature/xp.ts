// XP system: track, add, reset, and get XP; level calculation; XP bar data
export class XPManager {
    private static XP_KEY = 'ecodebugger.xp';
    private static LEVEL_XP = 100;
    private context: import('vscode').ExtensionContext;

    constructor(context: import('vscode').ExtensionContext) {
        this.context = context;
    }

    getXP(): number {
        return this.context.globalState.get<number>(XPManager.XP_KEY, 0);
    }

    addXP(amount: number): number {
        const current = this.getXP();
        const updated = current + amount;
        this.context.globalState.update(XPManager.XP_KEY, updated);
        return updated;
    }

    resetXP() {
        this.context.globalState.update(XPManager.XP_KEY, 0);
    }

    getLevel(): number {
        return Math.floor(this.getXP() / XPManager.LEVEL_XP);
    }

    getXPBar(): { current: number; max: number } {
        return { current: this.getXP() % XPManager.LEVEL_XP, max: XPManager.LEVEL_XP };
    }
}
