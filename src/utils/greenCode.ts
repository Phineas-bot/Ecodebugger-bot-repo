import * as vscode from 'vscode';
import { parseCodeToAST, traverse } from './parser';

export function analyzeGreenCode(text: string, returnTips?: boolean): { ecoTips: string[] } | boolean {
    const ast = parseCodeToAST(text);
    let ecoTips: string[] = [];
    let nestedLoopDetected = false;
    let inefficientStringConcat = false;
    let redundantCalculationDetected = false;
    let unusedVariables: string[] = [];
    let inefficientArrayPush = false;
    const declaredVariables = new Set<string>();
    const usedVariables = new Set<string>();
    const calculationMap = new Map<string, number>();
    let found = false;

    traverse(ast, {
        ForStatement(path) {
            if (path.findParent((p) => p.isForStatement())) {
                ecoTips.push('Avoid nested loops. Consider using more efficient algorithms or data structures.');
                nestedLoopDetected = true;
                found = true;
            }
        },
        AssignmentExpression(path) {
            if (
                path.node.operator === '+=' &&
                path.node.left.type === 'Identifier' &&
                path.node.right.type === 'Identifier'
            ) {
                ecoTips.push('Avoid string concatenation in loops. Use Array.join() or template literals.');
                inefficientStringConcat = true;
                found = true;
            }
            const code = path.toString();
            calculationMap.set(code, (calculationMap.get(code) || 0) + 1);
        },
        VariableDeclarator(path) {
            if (path.node.id.type === 'Identifier') {
                declaredVariables.add(path.node.id.name);
            }
        },
        Identifier(path) {
            usedVariables.add(path.node.name);
        },
        CallExpression(path) {
            if (
                path.node.callee.type === 'MemberExpression' &&
                path.node.callee.property.type === 'Identifier' &&
                path.node.callee.property.name === 'push'
            ) {
                if (path.findParent((p) => p.isForStatement())) {
                    ecoTips.push('Avoid using .push() in loops for large arrays. Pre-allocate or use Array methods.');
                    inefficientArrayPush = true;
                    found = true;
                }
            }
        }
    });

    redundantCalculationDetected = Array.from(calculationMap.values()).some(count => count > 1);
    if (redundantCalculationDetected) {
        ecoTips.push('Avoid redundant calculations. Store results in a variable if reused.');
        found = true;
    }
    unusedVariables = Array.from(declaredVariables).filter(v => !usedVariables.has(v));
    if (unusedVariables.length > 0) {
        ecoTips.push(`Remove unused variables (${unusedVariables.join(', ')}) to improve code efficiency.`);
        found = true;
    }
    if (returnTips) {
        return { ecoTips };
    }
    ecoTips.forEach(tip => vscode.window.showWarningMessage('⚡ Eco Tip: ' + tip));
    return found;
}