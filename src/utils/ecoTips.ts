import * as vscode from 'vscode';
import { detectNestedLoops, detectUnusedVariables } from './bugs';

export function provideEcoTips(): void {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showInformationMessage('No active editor found. Open a file to analyze.');
        return;
    }

    const text = editor.document.getText();

    if (detectNestedLoops(text)) {
        vscode.window.showWarningMessage(
            '⚡ Eco Tip: Avoid nested loops when possible. Consider using more efficient algorithms or data structures.'
        );
    }

    if (detectUnusedVariables(text)) {
        vscode.window.showWarningMessage(
            '⚡ Eco Tip: Remove unused variables to improve code readability and performance.'
        );
    }

    // Add more eco tips here...
}