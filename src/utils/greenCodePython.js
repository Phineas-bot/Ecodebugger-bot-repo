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
function analyzePythonGreenCode(text) {
    const scriptPath = path.join(__dirname, 'green_code_analyzer.py');
    return new Promise((resolve) => {
        const process = (0, child_process_1.execFile)('python', [scriptPath], { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage('Python analysis failed: ' + error.message);
                resolve();
                return;
            }
            try {
                const result = JSON.parse(stdout);
                if (result.nested_loops > 0) {
                    vscode.window.showWarningMessage('⚡ Eco Tip: Avoid nested loops in Python code.');
                }
                if (result.unused_variables && result.unused_variables.length > 0) {
                    vscode.window.showWarningMessage(`⚡ Eco Tip: Remove unused variables (${result.unused_variables.join(', ')}) in Python code.`);
                }
                if (result.inefficient_string_concat) {
                    vscode.window.showWarningMessage('⚡ Eco Tip: Avoid string concatenation in loops. Use join().');
                }
                if (result.inefficient_list_append) {
                    vscode.window.showWarningMessage('⚡ Eco Tip: Avoid list.append in loops for large data. Use comprehensions.');
                }
                if (result.magic_numbers && result.magic_numbers.length > 0) {
                    vscode.window.showWarningMessage(`⚡ Eco Tip: Replace magic numbers (${result.magic_numbers.join(', ')}) with named constants.`);
                }
                if (result.unreachable_code) {
                    vscode.window.showWarningMessage('⚡ Eco Tip: Remove unreachable code after return/break/continue.');
                }
            }
            catch (e) {
                vscode.window.showErrorMessage('Failed to parse Python analysis result.');
            }
            resolve();
        });
        // Send code to Python script via stdin
        process.stdin?.write(text);
        process.stdin?.end();
    });
}
//# sourceMappingURL=greenCodePython.js.map