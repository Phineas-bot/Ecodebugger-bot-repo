import * as vscode from 'vscode';
import { execFile } from 'child_process';
import * as path from 'path';
import { CodeAnalysis } from './greenCode';

export async function analyzePythonGreenCode(text: string): Promise<CodeAnalysis> {
    const scriptPath = path.join(__dirname, 'green_code_analyzer.py');

    return new Promise<CodeAnalysis>((resolve, reject) => {
        const suggestions: string[] = [];
        const process = execFile('python', [scriptPath], { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
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
            } catch (e) {
                reject(e);
            }
        });        if (process.stdin) {
            process.stdin.write(text);
            process.stdin.end();
        }
    });
}