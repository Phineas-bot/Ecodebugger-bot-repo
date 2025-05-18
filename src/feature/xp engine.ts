
type CodeIssue = {
    pattern: RegExp;
    xp: number;
    message: string;
    ecoTip: string;
};

type FixResult = {
    earnedXP: number;
    totalXP: number;
    fixedIssues: string[];
    remainingIssues: string[];
    newEcoTips: string[];
};

class XpEngine {
    private currentXP: number = 0;
    private previousIssues: Set<string> = new Set();
    
    private readonly CODE_ISSUES: CodeIssue[] = [
        {
            pattern: /var\s+\w+/g,
            xp: 100,
            message: "Using 'var' instead of 'const'/'let'",
            ecoTip: "🟢 Use block-scoped 'const' or 'let' instead of 'var'"
        },
        {
            pattern: /console\.log\(/g,
            xp: 50,
            message: "Console.log statements present",
            ecoTip: "🟠 Remove debug statements before committing"
        },
        {
            pattern: /;\s*$/gm,
            xp: 30,
            message: "Semicolon usage",
            ecoTip: "⚪ Consider removing semicolons for consistency"
        }
    ];

    private scanForIssues(code: string): Set<string> {
        const found = new Set<string>();
        for (const issue of this.CODE_ISSUES) {
            if (issue.pattern.test(code)) {
                found.add(issue.message);
            }
        }
        return found;
    }

    processCodeSave(code: string): FixResult {
        const currentIssues = this.scanForIssues(code);
        const result: FixResult = {
            earnedXP: 0,
            totalXP: this.currentXP,
            fixedIssues: [],
            remainingIssues: Array.from(currentIssues),
            newEcoTips: []
        };

        // Calculate fixed issues (present before but not now)
        this.previousIssues.forEach(issue => {
            if (!currentIssues.has(issue)) {
                result.fixedIssues.push(issue);
                result.earnedXP += this.CODE_ISSUES.find(i => i.message === issue)?.xp || 0;
            }
        });

        // Calculate new issues (not seen before)
        currentIssues.forEach(issue => {
            if (!this.previousIssues.has(issue)) {
                result.newEcoTips.push(
                    this.CODE_ISSUES.find(i => i.message === issue)?.ecoTip || ""
                );
            }
        });

        // Update state
        this.currentXP += result.earnedXP;
        this.previousIssues = new Set(currentIssues);

        return result;
    }

    getFormattedReport(result: FixResult): string {
        let report = `📊 Code Analysis Report:\n`;
        
        if (result.earnedXP > 0) {
            report += `🎉 Earned XP: +${result.earnedXP}\n`;
            report += `✅ Fixed issues:\n${result.fixedIssues.map(i => `• ${i}`).join('\n')}\n`;
        }
        
        if (result.newEcoTips.length > 0) {
            report += `\n💡 Eco Tips:\n${result.newEcoTips.map(t => `• ${t}`).join('\n')}\n`;
        }
        
        if (result.remainingIssues.length > 0) {
            report += `\n⚠️  Remaining issues: ${result.remainingIssues.length}`;
        }
        
        report += `\n🔥 Total XP: ${result.totalXP + result.earnedXP}`;
        return report;
    }
}

// Usage Example
const xpSystem = new XpEngine();

// First save with issues
const firstSaveResult = xpSystem.processCodeSave(`
    var x = 5;
    console.log(x);
`);
console.log(xpSystem.getFormattedReport(firstSaveResult));

// Second save after fixing 'var'
const secondSaveResult = xpSystem.processCodeSave(`
    const x = 5;
    console.log(x);
`);
console.log(xpSystem.getFormattedReport(secondSaveResult));

// Third save after fixing all issues
const thirdSaveResult = xpSystem.processCodeSave(`
    const x = 5;
`);
console.log(xpSystem.getFormattedReport(thirdSaveResult));