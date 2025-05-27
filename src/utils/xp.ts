  import { EcoTipManager, EcoTip } from './ecoTips';
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

type FixResult = {
    earnedXP: number;
    totalXP: number;
    fixedIssues: string[];
    remainingIssues: string[];
    newEcoTips: string[];
    levelUp?: {
        oldLevel: number;
        newLevel: number;
    };
};

class XpEngine {
    private currentXP: number = 0;
    private currentLevel: number = 1;
    private previousIssues: Set<string> = new Set();
    private ecoTipManager: EcoTipManager;
  
    constructor() {
        this.ecoTipManager = new EcoTipManager();
    }

    // Calculate XP needed for the next level - simplified to 100 XP per level
    private xpForNextLevel(): number {
         function xpForNextLevel(level: number): number {
            if (level <= 0)
                 return 0;
            return level * 100;
        }
        
        return xpForNextLevel(this.currentLevel);
    }    // Check if user leveled up and return level up info
    private checkLevelUp(oldXP: number, newXP: number): { oldLevel: number, newLevel: number } | null {
        const oldLevel = this.currentLevel;
        
        // Calculate new level based on new XP (every 100 XP)
        const newLevel = Math.floor(newXP / 100) + 1;
        
        if (newLevel > oldLevel) {
            this.currentLevel = newLevel;
            return { oldLevel, newLevel };
            vscode.window.showInformationMessage(`🎉 Congratulations! You reached Level ${newLevel}!`);
        }
        
        return null;
    }

    processCodeSave(code: string): FixResult {
        const currentIssues = this.ecoTipManager.scanForIssues(code);
        const oldXP = this.currentXP;
      
        const result: FixResult = {
            earnedXP: 0,
            totalXP: this.currentXP,
            fixedIssues: [],
            remainingIssues: Array.from(currentIssues),
            newEcoTips: []
        };

        // Check for fixed issues
        this.previousIssues.forEach(issue => {
            if (!currentIssues.has(issue)) {
                const ecoTip = this.ecoTipManager.getTipByMessage(issue);
                if (ecoTip) {
                    result.fixedIssues.push(issue);
                    result.earnedXP += ecoTip.xp;
                    
                    // Add eco tip to the list if this was a bug fix (not an eco tip itself)
                    if (!ecoTip.isEcoTip) {
                        result.newEcoTips.push(ecoTip.tipText);
                    }
                }
            }
        });

        // Update XP
        this.currentXP += result.earnedXP;
        result.totalXP = this.currentXP;
      
        // Check for level up
        const levelUpInfo = this.checkLevelUp(oldXP, this.currentXP);
        if (levelUpInfo) {
            result.levelUp = levelUpInfo;
        }
      
        // Update previous issues
        this.previousIssues = currentIssues;

        return result;
    }

    getFormattedReport(result: FixResult): string {
        let report = `📊 Code Analysis Report:\n`;
      
        if (result.earnedXP > 0) {
            report += `🎉 Earned XP: +${result.earnedXP}\n`;
            
            // Separate bugs from eco tips in the report
            const fixedBugs = result.fixedIssues.filter(issue => {
                const tip = this.ecoTipManager.getTipByMessage(issue);
                return tip && !tip.isEcoTip;
            });
            
            const appliedEcoTips = result.fixedIssues.filter(issue => {
                const tip = this.ecoTipManager.getTipByMessage(issue);
                return tip && tip.isEcoTip;
            });
            
            if (fixedBugs.length > 0) {
                report += `✅ Fixed bugs (+10 XP each):\n${fixedBugs.map(i => `• ${i}`).join('\n')}\n`;
            }
            
            if (appliedEcoTips.length > 0) {
                report += `🌱 Applied eco tips (+5 XP each):\n${appliedEcoTips.map(i => `• ${i}`).join('\n')}\n`;
            }
        }
      
        if (result.levelUp) {
            report += `\n🏆 LEVEL UP! Level ${result.levelUp.oldLevel} → ${result.levelUp.newLevel}\n`;
        }
      
        if (result.newEcoTips.length > 0) {
            report += `\n💡 New Eco Tips:\n${result.newEcoTips.map(t => `• ${t}`).join('\n')}\n`;
        }
      
        if (result.remainingIssues.length > 0) {
            report += `\n⚠️  Remaining issues: ${result.remainingIssues.length}`;
        }
      
        report += `\n🔥 Total XP: ${result.totalXP} | Level: ${this.currentLevel}`;
        report += `\n📈 XP needed for next level: ${this.getXPForNextLevel() - (this.currentXP % 100)}`;
        return report;
    }

    // Getter for current level
    getCurrentLevel(): number {
        return this.currentLevel;
    }

    // Getter for current XP
    getCurrentXP(): number {
        return this.currentXP;
    }

    // Get XP needed for next level
    getXPForNextLevel(): number {
        return this.xpForNextLevel();
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


export { XpEngine };

// Also export the existing XpEngine instance if you want to use it globally
export const globalXpEngine = new XpEngine();