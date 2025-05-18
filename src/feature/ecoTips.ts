export type EcoTip = {
    pattern: RegExp;
    xp: number;
    message: string;
    tipText: string;
    isEcoTip: boolean;
};

export class EcoTipManager {
    private readonly ECO_TIPS: EcoTip[] = [
        {
            pattern: /var\s+\w+/,
            xp: 10, // Fixed bug XP value
            message: "Using 'var' instead of 'const'/'let'",
            tipText: "🟢 Use block-scoped 'const' or 'let' instead of 'var'",
            isEcoTip: false
        },
        {
            pattern: /console\.log\(/,
            xp: 10, // Fixed bug XP value
            message: "Console.log statements present",
            tipText: "🟠 Remove debug statements before committing",
            isEcoTip: false
        },
        {
            pattern: /;\s*$/m,
            xp: 5, // Eco tip XP value
            message: "Semicolon usage",
            tipText: "⚪ Consider removing semicolons for consistency",
            isEcoTip: true
        },
        {
            pattern: /for\s*\(var\s+/,
            xp: 10, // Fixed bug XP value
            message: "Using 'var' in for loops",
            tipText: "🟢 Use 'let' or 'const' in for loops for block scoping",
            isEcoTip: false
        },
        {
            pattern: /==[^=]/,
            xp: 10, // Fixed bug XP value
            message: "Using '==' instead of '==='",
            tipText: "🟢 Use strict equality '===' to avoid type coercion bugs",
            isEcoTip: false
        },
        {
            pattern: /!=[^=]/,
            xp: 10, // Fixed bug XP value
            message: "Using '!=' instead of '!==''",
            tipText: "🟢 Use strict inequality '!==' to avoid type coercion bugs",
            isEcoTip: false
        },
        {
            pattern: /function\s+\w+\s*\(/,
            xp: 5, // Eco tip XP value
            message: "Function declaration instead of arrow function",
            tipText: "🟢 Prefer arrow functions for shorter syntax and lexical this",
            isEcoTip: true
        },
        {
            pattern: /console\.error\(/,
            xp: 10, // Fixed bug XP value
            message: "Console.error statements present",
            tipText: "🟠 Remove error logs or handle errors properly",
            isEcoTip: false
        },
        {
            pattern: /alert\(/,
            xp: 10, // Fixed bug XP value
            message: "Use of alert()",
            tipText: "🟠 Avoid alert() in production code; use modals or notifications",
            isEcoTip: false
        },
        {
            pattern: /document\.getElementById\(/,
            xp: 5, // Eco tip XP value
            message: "Direct DOM access",
            tipText: "🟢 Use framework methods or safer DOM access patterns",
            isEcoTip: true
        }
    ];

    // Get all eco tips
    getAllTips(): EcoTip[] {
        return this.ECO_TIPS;
    }

    // Scan code for issues and return matching tips
    scanForIssues(code: string): Set<string> {
        const found = new Set<string>();
        for (const tip of this.ECO_TIPS) {
            if (tip.pattern.test(code)) {
                found.add(tip.message);
            }
        }
        return found;
    }

    // Get tip by message
    getTipByMessage(message: string): EcoTip | undefined {
        return this.ECO_TIPS.find(tip => tip.message === message);
    }

    // Get only eco tips (not bug fixes)
    getOnlyEcoTips(): EcoTip[] {
        return this.ECO_TIPS.filter(tip => tip.isEcoTip);
    }

    // Get only bug fixes (not eco tips)
    getOnlyBugFixes(): EcoTip[] {
        return this.ECO_TIPS.filter(tip => !tip.isEcoTip);
    }
}