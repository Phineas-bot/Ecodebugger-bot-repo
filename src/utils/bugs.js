"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectNestedLoops = detectNestedLoops;
exports.detectUnusedVariables = detectUnusedVariables;
function detectNestedLoops(text) {
    const nestedLoopPattern = /for\s*\(.*\)\s*{[^{}]*for\s*\(.*\)/;
    return nestedLoopPattern.test(text);
}
function detectUnusedVariables(text) {
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
//# sourceMappingURL=bugs.js.map