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
exports.analyzePythonGreenCode = analyzePythonGreenCode;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
async function analyzePythonGreenCode(text) {
    const scriptPath = path.join(__dirname, 'green_code_analyzer.py');
    return new Promise((resolve, reject) => {
        const suggestions = [];
        const process = (0, child_process_1.execFile)('python', [scriptPath], { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage('Python analysis failed: ' + error.message);
                resolve({
                    hasNestedLoops: false,
                    suggestions: ['Error analyzing Python code: ' + error.message],
                    inefficientStringConcat: false,
                    redundantCalculations: false,
                    unusedVariables: [],
                    inefficientArrayOperations: false
                });
                return;
            }
            try {
                const result = JSON.parse(stdout);
                if (result.nested_loops > 0) {
                    suggestions.push('Avoid nested loops in Python code. Consider using list comprehensions or numpy operations.');
                }
                if (result.unused_variables && result.unused_variables.length > 0) {
                    suggestions.push(`Remove unused variables: ${result.unused_variables.join(', ')}`);
                }
                if (result.inefficient_string_concat) {
                    suggestions.push('Use string.join() instead of concatenation in loops');
                }
                if (result.inefficient_list_append) {
                    suggestions.push('Use list comprehensions instead of append in loops');
                }
                if (result.magic_numbers && result.magic_numbers.length > 0) {
                    suggestions.push('Consider defining constants for magic numbers');
                }
                resolve({
                    hasNestedLoops: result.nested_loops > 0,
                    suggestions,
                    inefficientStringConcat: result.inefficient_string_concat || false,
                    redundantCalculations: false, // Not implemented in Python analyzer yet
                    unusedVariables: result.unused_variables || [],
                    inefficientArrayOperations: result.inefficient_list_append || false
                });
            }
            catch (e) {
                reject(e);
            }
        });
        if (process.stdin) {
            process.stdin.write(text);
            process.stdin.end();
        }
    });
}
//# sourceMappingURL=greenCodePython.js.map