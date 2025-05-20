"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeGreenCode = analyzeGreenCode;
const parser_1 = require("./parser");
function analyzeGreenCode(text) {
    const ast = (0, parser_1.parseCodeToAST)(text);
    const suggestions = [];
    let nestedLoopDetected = false;
    let inefficientStringConcat = false;
    let redundantCalculationDetected = false;
    let unusedVariables = [];
    let inefficientArrayPush = false;
    const declaredVariables = new Set();
    const usedVariables = new Set();
    const calculationMap = new Map();
    (0, parser_1.traverse)(ast, {
        ForStatement(path) {
            if (path.findParent((p) => p.isForStatement())) {
                nestedLoopDetected = true;
            }
        },
        AssignmentExpression(path) {
            // Inefficient string concatenation
            if (path.node.operator === '+=' &&
                path.node.left.type === 'Identifier' &&
                path.node.right.type === 'Identifier') {
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
            if (path.node.callee.type === 'MemberExpression' &&
                path.node.callee.property.type === 'Identifier' &&
                path.node.callee.property.name === 'push') {
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
//# sourceMappingURL=greenCode.js.map