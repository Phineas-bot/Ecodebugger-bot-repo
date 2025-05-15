import * as vscode from 'vscode';
import { analyzeGreenCode } from './greenCode';
import { analyzePythonGreenCode } from './greenCodePython';

export async function provideEcoTips() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No active editor found. Open a file to analyze.');
        return;
    }
    const text = editor.document.getText();
    if (editor.document.languageId === 'python') {
        await analyzePythonGreenCode(text);
    } else {
        analyzeGreenCode(text);
    }
}