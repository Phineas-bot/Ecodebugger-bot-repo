import * as vscode from 'vscode';
import { analyzeGreenCode } from './greenCode';
import { analyzePythonGreenCode } from './greenCodePython';
import { OpenAICodeAnalyzer } from './openAIAnalyzer';

let openAIAnalyzer: OpenAICodeAnalyzer | null = null;
let analysisPanel: vscode.WebviewPanel | null = null;

export async function provideEcoTips(context: vscode.ExtensionContext) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No active editor found. Open a file to analyze.');
        return;
    }

    const text = editor.document.getText();
    const languageId = editor.document.languageId;

    // Initialize OpenAI analyzer if not already done
    if (!openAIAnalyzer) {
        openAIAnalyzer = new OpenAICodeAnalyzer();
    }

    // Run both local and AI analysis
    const [localAnalysis, aiAnalysis] = await Promise.all([
        languageId === 'python' ? analyzePythonGreenCode(text, context) : analyzeGreenCode(text),
        openAIAnalyzer.analyzeCode(text, languageId)
    ]);

    // Show results in the webview panel
    await showAnalysisResults(localAnalysis, aiAnalysis);
}

function getWebviewContent(localAnalysis: any, aiAnalysis: any): string {
    return `<!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: var(--vscode-font-family); padding: 10px; }
            .section { margin-bottom: 20px; }
            .suggestion { 
                padding: 10px;
                margin: 5px 0;
                border-left: 3px solid #5c9;
                background: var(--vscode-editor-background);
            }
            .impact-meter {
                height: 20px;
                background: #ddd;
                border-radius: 10px;
                overflow: hidden;
                margin: 5px 0;
            }
            .impact-fill {
                height: 100%;
                background: #5c9;
                transition: width 0.3s ease;
            }
            .ai-badge {
                background: #7c5;
                color: black;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 0.8em;
                margin-left: 5px;
            }
        </style>
    </head>
    <body>
        <div class="section">
            <h2>🤖 AI-Powered Analysis</h2>
            ${aiAnalysis ? `
                <div>
                    <h3>Resource Impact</h3>
                    <div>
                        <label>CPU Impact:</label>
                        <div class="impact-meter">
                            <div class="impact-fill" style="width: ${aiAnalysis.resourceImpact.cpu * 100}%"></div>
                        </div>
                    </div>
                    <div>
                        <label>Memory Impact:</label>
                        <div class="impact-meter">
                            <div class="impact-fill" style="width: ${aiAnalysis.resourceImpact.memory * 100}%"></div>
                        </div>
                    </div>
                    <h3>Suggestions</h3>
                    ${aiAnalysis.suggestions.map((suggestion: string) => 
                        `<div class="suggestion">
                            ${suggestion}
                            <span class="ai-badge">AI</span>
                        </div>`
                    ).join('')}
                </div>
            ` : '<p>AI analysis not available. Please check your API key configuration.</p>'}
        </div>

        <div class="section">
            <h2>📊 Local Analysis</h2>
            ${localAnalysis ? `
                <div>
                    ${Object.entries(localAnalysis).map(([key, value]) => 
                        `<div class="suggestion">
                            <strong>${key}:</strong> ${value}
                        </div>`
                    ).join('')}
                </div>
            ` : '<p>No local analysis results available.</p>'}
        </div>
    </body>
    </html>`;
}

async function showAnalysisResults(localAnalysis: any, aiAnalysis: any) {
    if (!analysisPanel) {
        analysisPanel = vscode.window.createWebviewPanel(
            'ecoAnalysis',
            'Eco Analysis Results',
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );

        analysisPanel.onDidDispose(() => {
            analysisPanel = null;
        });
    }

    analysisPanel.webview.html = getWebviewContent(localAnalysis, aiAnalysis);
}