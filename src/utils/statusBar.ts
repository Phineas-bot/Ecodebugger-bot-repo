import * as vscode from 'vscode';

export function updateStatusBar(statusBarItem: vscode.StatusBarItem, xp: number, level: number): void {
    console.log('Updating status bar:', { xp, level }); // Debugging log
    if (statusBarItem) {
        statusBarItem.text = `$(star) Level: ${level} | XP: ${xp}/${level * 100}`;
        statusBarItem.show();
    }
}