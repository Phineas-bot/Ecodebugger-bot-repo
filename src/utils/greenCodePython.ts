import * as vscode from 'vscode';
import { execFile } from 'child_process';
import * as path from 'path';
import { ecoDebuggerWebviewView } from '../extension';

export async function analyzePythonGreenCode(text: string, returnTips?: boolean): Promise<{ ecoTips: string[] }> {
    const scriptPath = path.join(__dirname, 'green_code_analyzer.py');
    return new Promise<{ ecoTips: string[] }>((resolve) => {
        let ecoTips: string[] = [];
        const process = execFile('python', [scriptPath], { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
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
            } catch (e) {
                vscode.window.showErrorMessage('Failed to parse Python analysis result.');
            }
            if (!returnTips) {
                ecoTips.forEach(tip => vscode.window.showWarningMessage('⚡ Eco Tip: ' + tip));
            }
            if (ecoDebuggerWebviewView) {
                ecoDebuggerWebviewView.webview.postMessage({ command: 'updateEcoTips', tips: ecoTips });
            }
            resolve({ ecoTips });
        });

        // Send code to Python script via stdin
        process.stdin?.write(text);
        process.stdin?.end();
    });
}