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
async function analyzePythonGreenCode(text, returnTips) {
    const scriptPath = path.join(__dirname, 'green_code_analyzer.py');
    return new Promise((resolve) => {
        let ecoTips = [];
        const process = (0, child_process_1.execFile)('python', [scriptPath], { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage('Python analysis failed: ' + error.message);
                resolve({ ecoTips });
                return;
            }
            try {
                const result = JSON.parse(stdout);
                if (result.nested_loops > 0) {
                    ecoTips.push('Avoid nested loops in Python code.');
                }
                if (result.unused_variables && result.unused_variables.length > 0) {
                    ecoTips.push(`Remove unused variables (${result.unused_variables.join(', ')}) in Python code.`);
                }
                if (result.inefficient_string_concat) {
                    ecoTips.push('Avoid string concatenation in loops. Use join().');
                }
                if (result.inefficient_list_append) {
                    ecoTips.push('Avoid list.append in loops for large data. Use comprehensions.');
                }
                if (result.magic_numbers && result.magic_numbers.length > 0) {
                    ecoTips.push(`Replace magic numbers (${result.magic_numbers.join(', ')}) with named constants.`);
                }
                if (result.unreachable_code) {
                    ecoTips.push('Remove unreachable code after return/break/continue.');
                }
                if (result.unused_imports && result.unused_imports.length > 0) {
                    ecoTips.push(`Remove unused imports (${result.unused_imports.join(', ')}) in Python code.`);
                }
                if (result.infinite_loops) {
                    ecoTips.push('Avoid infinite loops (while True) unless absolutely necessary.');
                }
                if (result.shadowed_variables && result.shadowed_variables.length > 0) {
                    ecoTips.push(`Avoid shadowing variables (${result.shadowed_variables.join(', ')}).`);
                }
                if (result.used_before_assignment && result.used_before_assignment.length > 0) {
                    ecoTips.push(`Variables used before assignment: ${result.used_before_assignment.join(', ')}.`);
                }
                if (result.deprecated_functions && result.deprecated_functions.length > 0) {
                    ecoTips.push(`Avoid deprecated functions: ${result.deprecated_functions.join(', ')}.`);
                }
            }
            catch (e) {
                vscode.window.showErrorMessage('Failed to parse Python analysis result.');
            }
            if (!returnTips) {
                ecoTips.forEach(tip => vscode.window.showWarningMessage('⚡ Eco Tip: ' + tip));
            }
            resolve({ ecoTips });
        });
        // Send code to Python script via stdin
        process.stdin?.write(text);
        process.stdin?.end();
    });
}
//# sourceMappingURL=greenCodePython.js.map