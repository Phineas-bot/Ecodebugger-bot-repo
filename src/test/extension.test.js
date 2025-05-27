"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const xp_1 = require("../utils/xp");
const bugs_1 = require("../utils/bugs");
const achievements_1 = require("../utils/achievements");
const greenCode_1 = require("../utils/greenCode");
const greenCodePython_1 = require("../utils/greenCodePython");
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = __importStar(require("vscode"));
// import * as myExtension from '../../extension';
suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('Sample test', () => {
        assert.strictEqual(-1, [1, 2, 3].indexOf(5));
        assert.strictEqual(-1, [1, 2, 3].indexOf(0));
    });
    test('xpForNextLevel returns correct XP', () => {
        assert.strictEqual((0, xp_1.xpForNextLevel)(1), 100);
        assert.strictEqual((0, xp_1.xpForNextLevel)(5), 500);
        assert.strictEqual((0, xp_1.xpForNextLevel)(0), 0);
    });
    test('detectNestedLoops detects nested loops', () => {
        const codeWithNested = 'for(let i=0;i<10;i++){for(let j=0;j<10;j++){}}';
        const codeWithoutNested = 'for(let i=0;i<10;i++){console.log(i);}';
        assert.strictEqual((0, bugs_1.detectNestedLoops)(codeWithNested), true);
        assert.strictEqual((0, bugs_1.detectNestedLoops)(codeWithoutNested), false);
    });
    test('achievements system works correctly', () => {
        // Reset achievements state
        global.achievements = {};
        // Test initial achievements
        (0, achievements_1.checkAchievements)(50, 1);
        assert.strictEqual(global.achievements['First 100 XP'], undefined);
        assert.strictEqual(global.achievements['Level 5'], undefined);
        // Test 100 XP achievement
        (0, achievements_1.checkAchievements)(150, 2);
        assert.strictEqual(global.achievements['First 100 XP'], true);
        assert.strictEqual(global.achievements['Level 5'], undefined);
        // Test Level 5 achievement
        (0, achievements_1.checkAchievements)(500, 5);
        assert.strictEqual(global.achievements['Level 5'], true);
    });
    test('eco tips analyzes JavaScript code', () => {
        const jsCode = `
			function inefficientLoop() {
				for(let i=0; i<10; i++) {
					for(let j=0; j<10; j++) {
						console.log(i + j);
					}
				}
			}
		`;
        const analysis = (0, greenCode_1.analyzeGreenCode)(jsCode);
        assert.strictEqual(analysis.hasNestedLoops, true);
        assert.ok(analysis.suggestions.length > 0);
        assert.ok(analysis.suggestions.some(s => s.includes('nested loops')));
    });
    test('eco tips analyzes Python code', async () => {
        const pythonCode = `
def inefficient_function():
    list1 = [1, 2, 3]
    list2 = [4, 5, 6]
    result = []
    for x in list1:
        for y in list2:
            result.append(x + y)
    unused_var = 42
    return result
`;
        const analysis = await (0, greenCodePython_1.analyzePythonGreenCode)(pythonCode);
        assert.strictEqual(analysis.hasNestedLoops, true);
        assert.ok(analysis.suggestions.length > 0);
        assert.ok(analysis.suggestions.some(s => s.includes('list comprehensions')));
        assert.ok(analysis.unusedVariables.includes('unused_var'));
        assert.strictEqual(analysis.inefficientArrayOperations, true);
    });
});
//# sourceMappingURL=extension.test.js.map