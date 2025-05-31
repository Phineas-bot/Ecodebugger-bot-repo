import * as vscode from 'vscode';

export class XpViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'xpView';

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri] 
    };

    webviewView.webview.html = this.getHtml();
  }

  private getHtml(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: sans-serif; padding: 1rem; }
        </style>
      </head>
      <body>
        <h2>XP & Badges</h2>
        <p>Track your debugging progress here!</p>
      </body>
      </html>
    `;
  }
}
