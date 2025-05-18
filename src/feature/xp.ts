  type CodeIssue = {
      pattern: RegExp;
      xp: number;
      message: string;
      ecoTip: string;
      isEcoTip: boolean;
  };

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
    
      private readonly CODE_ISSUES: CodeIssue[] = [
          {
              pattern: /var\s+\w+/,
              xp: 10, // Fixed bug XP value
              message: "Using 'var' instead of 'const'/'let'",
              ecoTip: "🟢 Use block-scoped 'const' or 'let' instead of 'var'",
              isEcoTip: false
          },
          {
              pattern: /console\.log\(/,
              xp: 10, // Fixed bug XP value
              message: "Console.log statements present",
              ecoTip: "🟠 Remove debug statements before committing",
              isEcoTip: false
          },
          {
              pattern: /;\s*$/m,
              xp: 5, // Eco tip XP value
              message: "Semicolon usage",
              ecoTip: "⚪ Consider removing semicolons for consistency",
              isEcoTip: true
          },
          {
              pattern: /for\s*\(var\s+/,
              xp: 10, // Fixed bug XP value
              message: "Using 'var' in for loops",
              ecoTip: "🟢 Use 'let' or 'const' in for loops for block scoping",
              isEcoTip: false
          },
          {
              pattern: /==[^=]/,
              xp: 10, // Fixed bug XP value
              message: "Using '==' instead of '==='",
              ecoTip: "🟢 Use strict equality '===' to avoid type coercion bugs",
              isEcoTip: false
          },
          {
              pattern: /!=[^=]/,
              xp: 10, // Fixed bug XP value
              message: "Using '!=' instead of '!==''",
              ecoTip: "🟢 Use strict inequality '!==' to avoid type coercion bugs",
              isEcoTip: false
          },
          {
              pattern: /function\s+\w+\s*\(/,
              xp: 5, // Eco tip XP value
              message: "Function declaration instead of arrow function",
              ecoTip: "🟢 Prefer arrow functions for shorter syntax and lexical this",
              isEcoTip: true
          },
          {
              pattern: /console\.error\(/,
              xp: 10, // Fixed bug XP value
              message: "Console.error statements present",
              ecoTip: "🟠 Remove error logs or handle errors properly",
              isEcoTip: false
          },
          {
              pattern: /alert\(/,
              xp: 10, // Fixed bug XP value
              message: "Use of alert()",
              ecoTip: "🟠 Avoid alert() in production code; use modals or notifications",
              isEcoTip: false
          },
          {
              pattern: /document\.getElementById\(/,
              xp: 5, // Eco tip XP value
              message: "Direct DOM access",
              ecoTip: "🟢 Use framework methods or safer DOM access patterns",
              isEcoTip: true
          }
      ];

      // Calculate XP needed for the next level - simplified to 100 XP per level
      private xpForNextLevel(): number {
          return 100; // Fixed 100 XP per level
      }

      // Check if user leveled up and return level up info
      private checkLevelUp(oldXP: number, newXP: number): { oldLevel: number, newLevel: number } | null {
          const oldLevel = this.currentLevel;
        
          // Calculate new level based on new XP (every 100 XP)
          const newLevel = Math.floor(newXP / 100) + 1;
        
          if (newLevel > oldLevel) {
              this.currentLevel = newLevel;
              return { oldLevel, newLevel };
          }
        
          return null;
      }

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
                  const codeIssue = this.CODE_ISSUES.find(i => i.message === issue);
                  if (codeIssue) {
                      result.fixedIssues.push(issue);
                      result.earnedXP += codeIssue.xp;
                      
                      // Add eco tip to the list if this was a bug fix (not an eco tip itself)
                      if (!codeIssue.isEcoTip) {
                          result.newEcoTips.push(codeIssue.ecoTip);
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
              const fixedBugs = result.fixedIssues.filter(issue => 
                  !this.CODE_ISSUES.find(i => i.message === issue)?.isEcoTip
              );
              
              const appliedEcoTips = result.fixedIssues.filter(issue => 
                  this.CODE_ISSUES.find(i => i.message === issue)?.isEcoTip
              );
              
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