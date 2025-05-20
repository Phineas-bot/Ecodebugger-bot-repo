import * as vscode from 'vscode';
import { parseCodeToAST, traverse } from './parser';

export interface CodeAnalysis {
    hasNestedLoops: boolean;
    suggestions: string[];
    inefficientStringConcat: boolean;
    redundantCalculations: boolean;
    unusedVariables: string[];
    inefficientArrayOperations: boolean;
}

export function analyzeGreenCode(text: string): CodeAnalysis {
    const ast = parseCodeToAST(text);
    const suggestions: string[] = [];

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
        suggestions.push('Consider refactoring nested loops to improve performance and reduce energy consumption');
    }
    if (inefficientStringConcat) {
        suggestions.push('Use string templates or string.join() instead of += for string concatenation');
    }
    if (redundantCalculationDetected) {
        suggestions.push('Consider caching repetitive calculations');
    }
    if (unusedVariables.length > 0) {
        suggestions.push('Remove unused variables to reduce memory usage');
    }
    if (inefficientArrayPush) {
        suggestions.push('Consider using array spread or Array(n).fill() for better performance');
    }

    return {
        hasNestedLoops: nestedLoopDetected,
        suggestions,
        inefficientStringConcat,
        redundantCalculations: redundantCalculationDetected,
        unusedVariables,
        inefficientArrayOperations: inefficientArrayPush
    };
}