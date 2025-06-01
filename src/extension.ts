// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { XPManager } from './feature/xp';
import { getTipsForLanguage, logEcoTip, getEcoTipForCodeWithLLM } from './feature/ecoTips';
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
			const code = editor.document.getText();
			// Try LLM first
			const llmTip = await getEcoTipForCodeWithLLM(code, lang);
			if (llmTip) {
				logEcoTip(llmTip, context);
				vscode.window.showInformationMessage(`Eco Tip (AI): ${llmTip.message}`);
				return;
			}
			// Fallback to static tips
			const tips = getTipsForLanguage(lang);
			if (tips.length) {
				logEcoTip(tips[0], context); // Log first tip for demo
				vscode.window.showInformationMessage(`Eco Tip: ${tips[0].message}`);
			}
		})
	);

	// Register on save event for eco tips
	context.subscriptions.push(
		vscode.workspace.onDidSaveTextDocument(async doc => {
			const lang = doc.languageId;
			const code = doc.getText();
			const llmTip = await getEcoTipForCodeWithLLM(code, lang);
			if (llmTip) {
				logEcoTip(llmTip, context);
				vscode.window.showInformationMessage(`Eco Tip (AI): ${llmTip.message}`);
				return;
			}
			const tips = getTipsForLanguage(lang);
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

	// Register command to open the custom EcoDebugger panel
	context.subscriptions.push(
		vscode.commands.registerCommand('Ecodebugger.openPanel', () => {
			const panel = vscode.window.createWebviewPanel(
				'ecodebuggerPanel', // Identifies the type of the webview. Used internally
				'EcoDebugger',      // Title of the panel displayed to the user
				vscode.ViewColumn.One, // Editor column to show the new webview panel in
				{ enableScripts: true }
			);
			panel.webview.html = getEcoDebuggerPanelHtml(context);
		})
	);
}

function getEcoDebuggerPanelHtml(context?: vscode.ExtensionContext): string {
	// Import managers and get data if context is provided
	let xp = 0, level = 0, xpBar = { current: 0, max: 100 }, badges: any[] = [], ecoTips: any[] = [], leaderboard: any[] = [], weeklyTop = '';
	if (context) {
		try {
			const { XPManager } = require('./feature/xp');
			const { getAchievements } = require('./feature/achievements');
			const { getEcoTipLog } = require('./feature/ecoTips');
			const { ClassroomManager } = require('./feature/classroom');
			const xpManager = new XPManager(context);
			xp = xpManager.getXP();
			level = xpManager.getLevel();
			xpBar = xpManager.getXPBar();
			badges = getAchievements(context).filter((a: any) => a.unlocked);
			ecoTips = getEcoTipLog(context);
			const classroomManager = new ClassroomManager(context);
			const classrooms = classroomManager.getClassrooms();
			leaderboard = classrooms[0]?.leaderboard || [];
			weeklyTop = classrooms[0]?.weeklyTop || '';
		} catch {}
	}
	return `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<title>EcoDebugger Panel</title>
		<style>
			body { font-family: sans-serif; padding: 1em; }
			h1 { color: #43a047; }
			.tabs { display: flex; gap: 10px; margin-bottom: 10px; }
			.tab { cursor: pointer; padding: 5px 10px; border-radius: 5px; background: #e0ffe0; }
			.tab.active { background: #4caf50; color: white; }
			.panel { display: none; }
			.panel.active { display: block; }
			.xp-bar { width: 100%; height: 20px; background: #e0e0e0; border-radius: 10px; overflow: hidden; margin: 10px 0; }
			.xp-bar-inner { height: 100%; background: #4caf50; transition: width 0.3s; }
		</style>
	</head>
	<body>
		<h1>EcoDebugger Panel</h1>
		<div class="tabs">
			<div class="tab active" data-tab="xp">XP/Level</div>
			<div class="tab" data-tab="badges">Badges</div>
			<div class="tab" data-tab="eco">Eco Tips Log</div>
			<div class="tab" data-tab="leaderboard">Leaderboard</div>
			<div class="tab" data-tab="settings">Settings</div>
		</div>
		<div class="panel active" id="xp">
			<h3>XP: ${xp} / Level: ${level}</h3>
			<div class="xp-bar"><div class="xp-bar-inner" style="width:${(xpBar.current / xpBar.max) * 100}%"></div></div>
			<small>${xpBar.current} / ${xpBar.max} XP to next level</small>
		</div>
		<div class="panel" id="badges">
			<h3>Badges Earned</h3>
			<ul>${badges.length ? badges.map((a: any) => `<li>🏅 ${a.name}</li>`).join('') : '<li>No badges earned yet.</li>'}</ul>
		</div>
		<div class="panel" id="eco">
			<h3>Eco Tips Log</h3>
			<ul>${ecoTips.length ? ecoTips.map((t: any) => `<li>🌱 ${t.message}</li>`).join('') : '<li>No eco tips yet.</li>'}</ul>
		</div>
		<div class="panel" id="leaderboard">
			<h3>Leaderboard</h3>
			<ol>${leaderboard.length ? leaderboard.map((l: any) => `<li>${l.user}: ${l.xp} XP</li>`).join('') : '<li>No leaderboard data.</li>'}</ol>
			<p>Weekly Top Coder: <b>${weeklyTop || 'N/A'}</b></p>
		</div>
		<div class="panel" id="settings">
			<h3>Settings</h3>
			<label><input type="checkbox" id="ecoTipsToggle" checked> Enable eco tips</label><br>
			<button id="resetBtn">Reset XP/achievements</button>
		</div>
		<script>
			const tabs = document.querySelectorAll('.tab');
			const panels = document.querySelectorAll('.panel');
			tabs.forEach(tab => {
				tab.onclick = () => {
					tabs.forEach(t => t.classList.remove('active'));
					panels.forEach(p => p.classList.remove('active'));
					tab.classList.add('active');
					document.getElementById(tab.dataset.tab).classList.add('active');
				};
			});
		</script>
	</body>
	</html>
	`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
