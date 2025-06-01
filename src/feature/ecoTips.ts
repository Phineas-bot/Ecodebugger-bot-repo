// Eco Tips Engine: tip list, get tips for language, trigger on save/manual, log tips
export type EcoTip = { id: string; message: string; language: string };

export const ecoTips: EcoTip[] = [
    { id: 'map-for', message: 'Use map() instead of for loop when possible.', language: 'javascript' },
    { id: 'no-console', message: 'Avoid unnecessary console.log in production.', language: 'javascript' },
    { id: 'map-for', message: 'Use map() instead of for loop when possible.', language: 'typescript' },
    { id: 'no-console', message: 'Avoid unnecessary console.log in production.', language: 'typescript' },
    { id: 'no-print', message: 'Avoid unnecessary print() in production.', language: 'python' },
    { id: 'comprehension', message: 'Use list/set comprehensions for better efficiency.', language: 'python' },
];

export function getTipsForLanguage(language: string): EcoTip[] {
    return ecoTips.filter(tip => tip.language === language.toLowerCase());
}

export function logEcoTip(tip: EcoTip, context: import('vscode').ExtensionContext) {
    const log = context.globalState.get<EcoTip[]>('ecodebugger.ecotiplog', []) || [];
    log.push(tip);
    context.globalState.update('ecodebugger.ecotiplog', log);
}

export function getEcoTipLog(context: import('vscode').ExtensionContext): EcoTip[] {
    return context.globalState.get<EcoTip[]>('ecodebugger.ecotiplog', []) || [];
}

import * as vscode from 'vscode';

export async function getEcoTipsFromAI(code: string, language: string, apiKey: string): Promise<string[]> {
    const endpoint = 'https://api.openai.com/v1/chat/completions';
    const prompt = `You are an expert eco-friendly coding assistant. Analyze the following ${language} code and suggest practical, eco-friendly improvements or tips. Respond with a concise, actionable list.\n\nCode:\n${code}`;
    const body = {
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: 'You are an expert eco-friendly coding assistant.' },
            { role: 'user', content: prompt }
        ],
        max_tokens: 256,
        temperature: 0.5
    };
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        throw new Error('Failed to get eco tips from AI');
    }
    const data = await response.json();
    // Type guard for OpenAI response
    if (!data || !Array.isArray((data as any).choices) || !(data as any).choices[0]?.message?.content) {
        throw new Error('Unexpected AI response format');
    }
    const text = (data as any).choices[0].message.content as string;
    return text.split(/\n|\r/).map(line => line.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean);
}
