import * as vscode from 'vscode';

export class EcoDebuggerPanel {
	public static currentPanel: EcoDebuggerPanel | undefined;
	private readonly _panel: vscode.WebviewPanel;

	constructor(panel: vscode.WebviewPanel) {
		this._panel = panel;
		EcoDebuggerPanel.currentPanel = this;
	}

	public sendMessage(message: any) {
		this._panel.webview.postMessage(message);
	}
}
