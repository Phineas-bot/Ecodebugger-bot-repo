import * as vscode from 'vscode';
import { execFile } from 'child_process';
import * as path from 'path';

export function analyzePythonGreenCode(text: string) {
    const scriptPath = path.join(__dirname, 'green_code_analyzer.py');

    return new Promise<void>((resolve) => {
        const process = execFile('python', [scriptPath], { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
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
                    vscode.window.showWarningMessage(
                        `⚡ Eco Tip: Remove unused variables (${result.unused_variables.join(', ')}) in Python code.`
                    );
                }
                if (result.inefficient_string_concat) {
                    vscode.window.showWarningMessage('⚡ Eco Tip: Avoid string concatenation in loops. Use join().');
                }
                if (result.inefficient_list_append) {
                    vscode.window.showWarningMessage('⚡ Eco Tip: Avoid list.append in loops for large data. Use comprehensions.');
                }
                if (result.magic_numbers && result.magic_numbers.length > 0) {
                    vscode.window.showWarningMessage(
                        `⚡ Eco Tip: Replace magic numbers (${result.magic_numbers.join(', ')}) with named constants.`
                    );
                }
                if (result.unreachable_code) {
                    vscode.window.showWarningMessage('⚡ Eco Tip: Remove unreachable code after return/break/continue.');
                }
            } catch (e) {
                vscode.window.showErrorMessage('Failed to parse Python analysis result.');
            }
            resolve();
        });

        // Send code to Python script via stdin
        process.stdin?.write(text);
        process.stdin?.end();
    });
}