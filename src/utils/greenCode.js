"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeGreenCode = analyzeGreenCode;
const vscode = __importStar(require("vscode"));
const parser_1 = require("./parser");
function analyzeGreenCode(text, returnTips) {
    const ast = (0, parser_1.parseCodeToAST)(text);
    let ecoTips = [];
    let nestedLoopDetected = false;
    let inefficientStringConcat = false;
    let redundantCalculationDetected = false;
    let unusedVariables = [];
    let inefficientArrayPush = false;
    const declaredVariables = new Set();
    const usedVariables = new Set();
    const calculationMap = new Map();
    let found = false;
    (0, parser_1.traverse)(ast, {
        ForStatement(path) {
            if (path.findParent((p) => p.isForStatement())) {
                ecoTips.push('Avoid nested loops. Consider using more efficient algorithms or data structures.');
                nestedLoopDetected = true;
                found = true;
            }
        },
        AssignmentExpression(path) {
            if (path.node.operator === '+=' &&
                path.node.left.type === 'Identifier' &&
                path.node.right.type === 'Identifier') {
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
            if (path.node.callee.type === 'MemberExpression' &&
                path.node.callee.property.type === 'Identifier' &&
                path.node.callee.property.name === 'push') {
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
//# sourceMappingURL=greenCode.js.map