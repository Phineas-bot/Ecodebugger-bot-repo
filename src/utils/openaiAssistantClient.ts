// openaiAssistantClient.ts
// Reusable module for interacting with OpenAI Assistants API (v4)
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '', // Set your API key in environment or use VS Code secret storage
});

// Helper to load the Assistant ID from config file if present
function getAssistantId(): string {
  // Try to load assistant ID from config file
  try {
    const configPath = path.join(__dirname, 'openai-assistant-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.assistant_id) { return config.assistant_id; }
    }
  } catch (e) {
    // Ignore and fallback
  }
  // Fallback to env or placeholder
  return process.env.OPENAI_ASSISTANT_ID || '<YOUR_ASSISTANT_ID>';
}

// The Assistant ID should be configured for your use case
const ASSISTANT_ID = getAssistantId();

export interface AssistantSuggestion {
  issue: string;
  suggestion: string;
  snippet: string;
  explanation: string;
}

export interface AssistantAnalysisResult {
  suggestions: AssistantSuggestion[];
}

/**
 * Analyze Python code using OpenAI Assistants API (structured response).
 * @param code Python code as string
 * @returns Structured JSON response with suggestions: issue, suggestion, snippet, explanation
 */
export async function analyzePythonCodeWithAssistant(code: string): Promise<AssistantAnalysisResult> {
    if (!isAiAnalysisEnabled()) {
        vscode.window.showInformationMessage('AI-powered analysis is disabled in settings.');
        return { suggestions: [] };
    }
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
        return { suggestions: [] };
    }
  // Create a new thread for the assistant
  const thread = await openai.beta.threads.create();

  // Send the code as a message to the assistant
  await openai.beta.threads.messages.create(thread.id, {
    role: 'user',
    content: `Analyze the following Python code. Identify inefficient, resource-intensive, or environmentally unfriendly patterns. For each issue, return: issue, suggestion, snippet, explanation. Respond in valid JSON.\n\nCode:\n${code}`,
  });

  // Run the assistant
  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: ASSISTANT_ID,
    instructions: 'Return a JSON array of suggestions, each with: issue, suggestion, snippet, explanation.'
  });

  // Wait for the run to complete (polling)
  let status = run.status;
  let runResult = run;
  while (status !== 'completed' && status !== 'failed' && status !== 'cancelled') {
    await new Promise(res => setTimeout(res, 1500));
    runResult = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    status = runResult.status;
  }

  if (status !== 'completed') {
    throw new Error('Assistant run failed or was cancelled.');
  }

  // Get the latest message from the assistant
  const messages = await openai.beta.threads.messages.list(thread.id);
  const lastMessage = messages.data.find((m: any) => m.role === 'assistant');
  if (!lastMessage) { throw new Error('No assistant response received.'); }

  // Parse the JSON content from the assistant's message
  let suggestions: AssistantSuggestion[] = [];
  try {
    const content = lastMessage.content[0]?.text?.value || lastMessage.content[0]?.text || '';
    // Accepts either { suggestions: [...] } or just [...]
    const parsed = JSON.parse(content);
    suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions;
  } catch (e) {
    throw new Error('Failed to parse assistant response as JSON.');
  }

  return { suggestions };
}

/**
 * Gets the code from the active editor if it's a Python file.
 * Returns the code as a string, or undefined if not a Python file.
 * Shows a warning if no Python file is active.
 */
export function getActivePythonCode(): string | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('No active editor found.');
    return undefined;
  }
  const doc = editor.document;
  if (doc.languageId !== 'python' && !doc.fileName.endsWith('.py')) {
    vscode.window.showWarningMessage('Please open a Python (.py) file to analyze.');
    return undefined;
  }
  return doc.getText();
}

function getOpenAIApiKey(): string | undefined {
    const config = vscode.workspace.getConfiguration('ecoDebugger');
    let apiKey = config.get<string>('openaiApiKey');
    if (!apiKey) {
        vscode.window.showWarningMessage('OpenAI API Key is not set. Please enter your API key.', 'Enter Key').then(async (choice) => {
            if (choice === 'Enter Key') {
                const input = await vscode.window.showInputBox({
                    prompt: 'Enter your OpenAI API Key',
                    ignoreFocusOut: true,
                    password: true
                });
                if (input) {
                    await config.update('openaiApiKey', input, vscode.ConfigurationTarget.Global);
                    vscode.window.showInformationMessage('OpenAI API Key saved.');
                }
            }
        });
        return undefined;
    }
    return apiKey;
}

function isAiAnalysisEnabled(): boolean {
    const config = vscode.workspace.getConfiguration('ecoDebugger');
    return config.get<boolean>('enableAiAnalysis', true);
}

// Real-time analysis setup

let debounceTimer: NodeJS.Timeout | undefined;

/**
 * Trigger real-time analysis on Python file edits with a 3-second debounce.
 */
export function setupRealTimeAnalysis(context: vscode.ExtensionContext): void {
    vscode.workspace.onDidChangeTextDocument((event) => {
        const document = event.document;

        // Only trigger for Python files
        if (document.languageId !== 'python') {
            return;
        }

        // Clear any existing debounce timer
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        // Set a new debounce timer
        debounceTimer = setTimeout(async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document !== document) {
                return;
            }

            // Show loading indicator in the panel
            vscode.window.showInformationMessage('Analyzing Python code...');

            // Get the code and run analysis
            const code = document.getText();
            const analysisResult = await analyzePythonCodeWithAssistant(code);

            // Refresh the panel with new suggestions
            vscode.commands.executeCommand('ecoDebugger.showEcoTips', analysisResult.suggestions);
        }, 3000); // 3-second debounce
    });
}
