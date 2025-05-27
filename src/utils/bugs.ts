export function detectNestedLoops(code: string): boolean {
    // Simple regex to detect nested for loops
    const forLoopPattern = /for\s*\([^)]*\)\s*\{[^{}]*for\s*\([^)]*\)/;
    return forLoopPattern.test(code);
}

export function detectUnusedVariables(text: string): boolean {
    const variablePattern = /let\s+(\w+)\s*=/g;
    const matches = text.match(variablePattern);
    if (!matches) {
        return false;
    }

    for (const match of matches) {
        const variableName = match.split(' ')[1];
        const usagePattern = new RegExp(`\\b${variableName}\\b`, 'g');
        if ((text.match(usagePattern) || []).length === 1) {
            return true; // Variable is declared but never used
        }
    }
    return false;
}

// Add more bug detection functions here...