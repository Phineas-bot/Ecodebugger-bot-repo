import axios from 'axios';
import * as vscode from 'vscode';

interface OpenAIAnalysisResult {
    suggestions: string[];
    confidence: number;
    resourceImpact: {
        cpu: number;
        memory: number;
    };
}

export class OpenAICodeAnalyzer {
    private apiKey: string | undefined;
    private lastRequestTime: number = 0;
    private minIntervalMs: number = 2000; // 2 seconds between requests

    constructor() {
        this.apiKey = this.getApiKey();
    }

    private getApiKey(): string | undefined {
        return vscode.workspace.getConfiguration('ecoDebugger').get('openaiApiKey');
    }

    private async validateApiKey(): Promise<boolean> {
        if (!this.apiKey) {
            const response = await vscode.window.showErrorMessage(
                'OpenAI API key not found. Would you like to set it now?',
                'Yes', 'No'
            );
            if (response === 'Yes') {
                const key = await vscode.window.showInputBox({
                    prompt: 'Enter your OpenAI API key',
                    password: true
                });
                if (key) {
                    await vscode.workspace.getConfiguration('ecoDebugger').update('openaiApiKey', key, true);
                    this.apiKey = key;
                    return true;
                }
            }
            return false;
        }
        return true;
    }

    async analyzeCode(code: string, language: string): Promise<OpenAIAnalysisResult | null> {
        if (!await this.validateApiKey()) {
            return null;
        }

        // Rate limit protection
        const now = Date.now();
        if (now - this.lastRequestTime < this.minIntervalMs) {
            vscode.window.showWarningMessage('You are analyzing too quickly. Please wait a moment before trying again.');
            return null;
        }
        this.lastRequestTime = now;

        const prompt = this.createAnalysisPrompt(code, language);
        const models = ["gpt-4", "gpt-3.5-turbo"];
        let lastError: any = null;

        for (const model of models) {
            try {
                const response = await axios.post(
                    'https://api.openai.com/v1/chat/completions',
                    {
                        model,
                        messages: [
                            {
                                role: "system",
                                content: "You are an eco-conscious code analyzer. Analyze code for patterns that may consume excessive CPU or memory resources. Provide specific, actionable suggestions for more efficient alternatives. Focus on real-world impact."
                            },
                            {
                                role: "user",
                                content: prompt
                            }
                        ],
                        temperature: 0.3
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                return this.parseOpenAIResponse(response.data.choices[0].message.content);
            } catch (error) {
                lastError = error;
                if (model === models[models.length - 1]) {
                    let errorMsg = '';
                    if (typeof AggregateError !== 'undefined' && error instanceof AggregateError) {
                        errorMsg = (error as AggregateError).errors
                            .map((e: any) => e?.message || String(e))
                            .join('; ');
                    } else if ((error as any)?.response?.data?.error?.message) {
                        errorMsg = (error as any).response.data.error.message;
                    } else if ((error as any)?.message) {
                        errorMsg = (error as any).message;
                    } else {
                        errorMsg = String(error);
                    }
                    vscode.window.showErrorMessage(`OpenAI analysis failed: ${errorMsg}`);
                }
            }
        }
        return null;
    }

    private createAnalysisPrompt(code: string, language: string): string {
        return `Analyze this ${language} code for resource-intensive patterns and suggest eco-friendly alternatives:

\`\`\`${language}
${code}
\`\`\`

Focus on:
1. CPU-intensive operations
2. Memory-intensive patterns
3. Energy-efficient alternatives
4. Resource optimization opportunities

Format your response as JSON:
{
    "suggestions": ["detailed suggestions..."],
    "confidence": 0.95,
    "resourceImpact": {
        "cpu": 0.8,
        "memory": 0.6
    }
}`;
    }

    private parseOpenAIResponse(response: string): OpenAIAnalysisResult {
        try {
            const parsed = JSON.parse(response);
            return {
                suggestions: parsed.suggestions || [],
                confidence: parsed.confidence || 0,
                resourceImpact: {
                    cpu: parsed.resourceImpact?.cpu || 0,
                    memory: parsed.resourceImpact?.memory || 0
                }
            };
        } catch (error) {
            console.error('Failed to parse OpenAI response:', error);
            return {
                suggestions: ['Error parsing AI suggestions'],
                confidence: 0,
                resourceImpact: { cpu: 0, memory: 0 }
            };
        }
    }
}
