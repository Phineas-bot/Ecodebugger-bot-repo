import * as assert from 'assert';
import { globalXpEngine } from '../utils/xp';
import { detectNestedLoops } from '../utils/bugs';
import { checkAchievements } from '../utils/achievements';
import { analyzeGreenCode } from '../utils/greenCode';
import { analyzePythonGreenCode } from '../utils/greenCodePython';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('xpForNextLevel returns correct XP', () => {
		assert.strictEqual(globalXpEngine['xpForNextLevel'](), 100);
		assert.strictEqual(globalXpEngine['xpForNextLevel'](), 500);
		assert.strictEqual(globalXpEngine['xpForNextLevel'](), 0);
	});	
	
	test('detectNestedLoops detects nested loops', () => {
		const codeWithNested = 'for(let i=0;i<10;i++){for(let j=0;j<10;j++){}}';
		const codeWithoutNested = 'for(let i=0;i<10;i++){console.log(i);}';
		assert.strictEqual(detectNestedLoops(codeWithNested), true);
		assert.strictEqual(detectNestedLoops(codeWithoutNested), false);
	});

	test('achievements system works correctly', () => {
		// Reset achievements state with proper typing
		(global as any).achievements = {} as Record<string, boolean>;
		
		// Test initial achievements
		checkAchievements(50, 1);
		assert.strictEqual((global as any).achievements['First 100 XP'], undefined);
		assert.strictEqual((global as any).achievements['Level 5'], undefined);

		// Test 100 XP achievement
		checkAchievements(150, 2);
		assert.strictEqual((global as any).achievements['First 100 XP'], true);
		assert.strictEqual((global as any).achievements['Level 5'], undefined);

		// Test Level 5 achievement
		checkAchievements(500, 5);
		assert.strictEqual((global as any).achievements['Level 5'], true);
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
		const analysis = analyzeGreenCode(jsCode);
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
		const analysis = await analyzePythonGreenCode(pythonCode);
		assert.strictEqual(analysis.hasNestedLoops, true);
		assert.ok(analysis.suggestions.length > 0);
		assert.ok(analysis.suggestions.some(s => s.includes('list comprehensions')));
		assert.ok(analysis.unusedVariables.includes('unused_var'));
		assert.strictEqual(analysis.inefficientArrayOperations, true);
	});
});
