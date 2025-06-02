import * as vscode from 'vscode';
import { ecoTips as availableEcoTips, EcoTip } from './feature/ecoTips';

export interface FoundTip extends EcoTip {
    range: vscode.Range;
}

export function findEcoTipsInDocument(document: vscode.TextDocument): FoundTip[] {
    const found: FoundTip[] = [];
    if (document.languageId !== 'javascript' && document.languageId !== 'typescript' && document.languageId !== 'python') {
        return found;
    }

    const text = document.getText();

    // Example: Detect "for...of" loop that could be a map in JS/TS
    if (document.languageId === 'javascript' || document.languageId === 'typescript') {
        const forLoopRegex = /for\s*\(\s*(let|const|var)\s+\w+\s+of\s+\w+\s*\)\s*{[^}]*}/g;
        let match;
        while ((match = forLoopRegex.exec(text)) !== null) {
            const mapTip = availableEcoTips.find(tip => tip.message.includes("try map()"));
            if (mapTip) {
                const startPos = document.positionAt(match.index);
                const endPos = document.positionAt(match.index + match[0].length);
                // Check if this tip was already found for this exact range to avoid duplicates if logic becomes more complex
                if (!found.some(f => f.message === mapTip.message && f.range.isEqual(new vscode.Range(startPos, endPos)))) {
                    found.push({ ...mapTip, range: new vscode.Range(startPos, endPos) });
                }
            }
        }
    }
    
    // Example: Detect console.log in JS/TS
    if (document.languageId === 'javascript' || document.languageId === 'typescript') {
        const consoleLogRegex = /console\.log\s*\([^)]*\);?/g;
        let match;
        while ((match = consoleLogRegex.exec(text)) !== null) {
            const consoleTip = availableEcoTips.find(tip => tip.message.includes("console.log() in production"));
            if (consoleTip) {
                const startPos = document.positionAt(match.index);
                const endPos = document.positionAt(match.index + match[0].length);
                if (!found.some(f => f.message === consoleTip.message && f.range.isEqual(new vscode.Range(startPos, endPos)))) {
                    found.push({ ...consoleTip, range: new vscode.Range(startPos, endPos) });
                }
            }
        }
    }

    // Example: Python list comprehensions (very basic)
    // This is a naive check and would need significant improvement for real-world use (e.g., AST parsing)
    if (document.languageId === 'python') {
        const pythonLoopPattern = /for\s+\w+\s+in\s+\w+:\s*\n(?:\s+.*\n)*\s+\w+\.append\(/g; // Very simplified
        let match;
        while ((match = pythonLoopPattern.exec(text)) !== null) {
            const comprehensionTip = availableEcoTips.find(tip => tip.message.includes("list/set comprehensions"));
            if (comprehensionTip) {
                const startPos = document.positionAt(match.index);
                const endPos = document.positionAt(match.index + match[0].length);
                 if (!found.some(f => f.message === comprehensionTip.message && f.range.isEqual(new vscode.Range(startPos, endPos)))) {
                    found.push({ ...comprehensionTip, range: new vscode.Range(startPos, endPos) });
                }
            }
        }
    }

    return found;
} 