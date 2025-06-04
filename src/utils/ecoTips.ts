import * as vscode from 'vscode';
import { analyzeGreenCode } from './greenCode';
import { analyzePythonGreenCode } from './greenCodePython';

export async function provideEcoTips(): Promise<{ ecoTips: string[] }> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No active editor found. Open a file to analyze.');
        return { ecoTips: [] };
    }
    const text = editor.document.getText();
    if (editor.document.languageId === 'python') {
        return await analyzePythonGreenCode(text, true);
    } else {
        return analyzeGreenCode(text, true) as { ecoTips: string[] };
    }
}