// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { XPManager } from './feature/xp';
import { getTipsForLanguage, logEcoTip } from './feature/ecoTips';
import { getAchievements, unlockAchievement } from './feature/achievements';
import { ClassroomManager } from './feature/classroom';
import { EcoDebuggerPanelProvider } from './feature/sidePanel';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "Ecodebugger" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('Ecodebugger.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('welcome to eco-debugger start coding clean and green.!');
	});

	context.subscriptions.push(disposable);

	// Register side panel with retainContextWhenHidden for reliability
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			'ecodebuggerPanel',
			new EcoDebuggerPanelProvider(context),
			{ webviewOptions: { retainContextWhenHidden: true } }
		)
	);

	// Register command: Manual scan for eco tips
	context.subscriptions.push(
		vscode.commands.registerCommand('Ecodebugger.scanEcoTips', async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) { return; }
			const lang = editor.document.languageId;
			const tips = getTipsForLanguage(lang);
			if (tips.length) {
				logEcoTip(tips[0], context); // Log first tip for demo
				vscode.window.showInformationMessage(`Eco Tip: ${tips[0].message}`);
			}
		})
	);

	// Register on save event for eco tips
	context.subscriptions.push(
		vscode.workspace.onDidSaveTextDocument(doc => {
			const tips = getTipsForLanguage(doc.languageId);
			if (tips.length) {
				logEcoTip(tips[0], context);
				vscode.window.showInformationMessage(`Eco Tip: ${tips[0].message}`);
			}
		})
	);

	// Register command: Reset XP/achievements
	context.subscriptions.push(
		vscode.commands.registerCommand('Ecodebugger.resetProgress', () => {
			const xpManager = new XPManager(context);
			xpManager.resetXP();
			context.globalState.update('ecodebugger.achievements', undefined);
			context.globalState.update('ecodebugger.ecotiplog', undefined);
			vscode.window.showInformationMessage('EcoDebugger progress reset.');
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
