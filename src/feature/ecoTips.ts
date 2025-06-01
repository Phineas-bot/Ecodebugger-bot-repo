// Eco Tips Engine: tip list, get tips for language, trigger on save/manual, log tips
import { getEcoTipFromOllama } from '../utils/ollama';

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

export async function getEcoTipForCodeWithLLM(code: string, language: string): Promise<EcoTip | null> {
    const tip = await getEcoTipFromOllama(code, language);
    if (tip) {
        return { id: 'llama3-ollama', message: tip, language };
    }
    return null;
}
