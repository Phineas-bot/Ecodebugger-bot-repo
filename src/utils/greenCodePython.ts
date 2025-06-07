import * as vscode from 'vscode';
import { execFile } from 'child_process';
import * as path from 'path';

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
            } catch (e) {
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