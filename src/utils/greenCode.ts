import * as vscode from 'vscode';
import { parseCodeToAST, traverse } from './parser';

export function analyzeGreenCode(text: string) {
    const ast = parseCodeToAST(text);

    let nestedLoopDetected = false;
    let inefficientStringConcat = false;
    let redundantCalculationDetected = false;
    let unusedVariables: string[] = [];
    let inefficientArrayPush = false;

    const declaredVariables = new Set<string>();
    const usedVariables = new Set<string>();
    const calculationMap = new Map<string, number>();

    traverse(ast, {
        ForStatement(path) {
            if (path.findParent((p) => p.isForStatement())) {
                nestedLoopDetected = true;
            }
        },
        AssignmentExpression(path) {
            // Inefficient string concatenation
            if (
                path.node.operator === '+=' &&
                path.node.left.type === 'Identifier' &&
                path.node.right.type === 'Identifier'
            ) {
                inefficientStringConcat = true;
            }
            // Redundant calculations
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
            // Inefficient array push in loops
            if (
                path.node.callee.type === 'MemberExpression' &&
                path.node.callee.property.type === 'Identifier' &&
                path.node.callee.property.name === 'push'
            ) {
                if (path.findParent((p) => p.isForStatement())) {
                    inefficientArrayPush = true;
                }
            }
        }
    });

    // Redundant calculations: same assignment more than once
    redundantCalculationDetected = Array.from(calculationMap.values()).some(count => count > 1);

    // Unused variables
    unusedVariables = Array.from(declaredVariables).filter(v => !usedVariables.has(v));

    // Show messages
    if (nestedLoopDetected) {
        vscode.window.showWarningMessage(
            '⚡ Eco Tip: Avoid nested loops. Consider using more efficient algorithms or data structures.'
        );
    }
    if (inefficientStringConcat) {
        vscode.window.showWarningMessage(
            '⚡ Eco Tip: Avoid string concatenation in loops. Use Array.join() or template literals.'
        );
    }
    if (redundantCalculationDetected) {
        vscode.window.showWarningMessage(
            '⚡ Eco Tip: Avoid redundant calculations. Store results in a variable if reused.'
        );
    }
    if (unusedVariables.length > 0) {
        vscode.window.showWarningMessage(
            `⚡ Eco Tip: Remove unused variables (${unusedVariables.join(', ')}) to improve code efficiency.`
        );
    }
    if (inefficientArrayPush) {
        vscode.window.showWarningMessage(
            '⚡ Eco Tip: Avoid using .push() in loops for large arrays. Pre-allocate or use Array methods.'
        );
    }
}