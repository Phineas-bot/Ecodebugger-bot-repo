import * as vscode from 'vscode';
import { analyzeGreenCode } from './greenCode';
import { analyzePythonGreenCode } from './greenCodePython';

export async function provideEcoTips() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No active editor found. Open a file to analyze.');
        return;
    }
    const text = editor.document.getText();
    if (editor.document.languageId === 'python') {
        await analyzePythonGreenCode(text);
    } else {
        analyzeGreenCode(text);
    }
}

export type EcoTip = {
    pattern: RegExp;
    xp: number;
    message: string;
    tipText: string;
    isEcoTip: boolean;
};

export class EcoTipManager {
    private readonly ECO_TIPS: EcoTip[] = [
        //ECO_TIPS for JavaScript/Typescript
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
        },
        
        //ECO_TIPS for Python
        {
            pattern: /print\s*\(/,
            xp: 10, // Fixed bug XP value
            message: "Print statements present",
            tipText: "🟠 Remove debug print statements before committing",
            isEcoTip: false
        },
        {
            pattern: /for\s+\w+\s+in\s+range\(\w+\):\s*\n\s*\w+\.append/,
            xp: 5, // Eco tip XP value
            message: "For loop with append",
            tipText: "🟢 Consider using list comprehension instead of for loop with append",
            isEcoTip: true
        },
        {
            pattern: /if\s+\w+\s+in\s+\[/,
            xp: 5, // Eco tip XP value
            message: "List membership test",
            tipText: "🟢 Use sets instead of lists for faster membership testing",
            isEcoTip: true
        },
        {
            pattern: /\w+\s*\+=\s*\w+/,
            xp: 5, // Eco tip XP value
            message: "String concatenation with +=",
            tipText: "🟢 Use ''.join() for more efficient string concatenation",
            isEcoTip: true
        },
        {
            pattern: /f\s*=\s*open\([^)]+\)/,
            xp: 10, // Fixed bug XP value
            message: "File not using context manager",
            tipText: "🟢 Use 'with open()' to ensure files are properly closed",
            isEcoTip: false
        },
        {
            pattern: /except:/,
            xp: 10, // Fixed bug XP value
            message: "Bare except clause",
            tipText: "🟢 Specify exceptions to catch instead of using bare except",
            isEcoTip: false
        },
        {
            pattern: /import\s+\*/,
            xp: 10, // Fixed bug XP value
            message: "Wildcard import",
            tipText: "🟢 Import specific modules or functions instead of using '*'",
            isEcoTip: false
        },
        {
            pattern: /\w+\s*==\s*None|\w+\s*!=\s*None/,
            xp: 5, // Eco tip XP value
            message: "Comparison with None",
            tipText: "🟢 Use 'is None' or 'is not None' instead of '==' or '!='",
            isEcoTip: true
        },
        {
            pattern: /len\(\w+\)\s*==\s*0/,
            xp: 5, // Eco tip XP value
            message: "Length check for emptiness",
            tipText: "🟢 Use 'if not sequence:' instead of checking length",
            isEcoTip: true
        },
        {
            pattern: /i\s*=\s*0[\s\S]*?for[\s\S]*?i\s*\+=/,
            xp: 5, // Eco tip XP value
            message: "Manual counter in loop",
            tipText: "🟢 Use enumerate() for cleaner counter in loops",
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
    
    // Calculate XP for debugging with eco tips
    calculateXP(usedTips: EcoTip[]): number {
        // Base XP for normal debugging
        const baseXP = 10;
        
        // Additional XP from eco tips
        const ecoTipsXP = usedTips
            .filter(tip => tip.isEcoTip)
            .reduce((total, tip) => total + tip.xp, 0);
            
        return baseXP + ecoTipsXP;
    }
    
    // Check if user applied eco tips during debugging
    hasAppliedEcoTips(beforeCode: string, afterCode: string): EcoTip[] {
        const beforeIssues = this.scanForIssues(beforeCode);
        const afterIssues = this.scanForIssues(afterCode);
        
        // Find issues that were fixed (present in before but not in after)
        const fixedIssues: EcoTip[] = [];
        
        beforeIssues.forEach(issue => {
            if (!afterIssues.has(issue)) {
                const tip = this.getTipByMessage(issue);
                if (tip) {
                    fixedIssues.push(tip);
                }
            }
        });
        
        return fixedIssues;
    }
}