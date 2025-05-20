import * as assert from 'assert';
import { xpForNextLevel } from '../utils/xp';
import { detectNestedLoops } from '../utils/bugs';

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
		assert.strictEqual(xpForNextLevel(1), 100);
		assert.strictEqual(xpForNextLevel(5), 500);
		assert.strictEqual(xpForNextLevel(0), 0);
	});

	test('detectNestedLoops detects nested loops', () => {
		const codeWithNested = 'for(let i=0;i<10;i++){for(let j=0;j<10;j++){}}';
		const codeWithoutNested = 'for(let i=0;i<10;i++){console.log(i);}';
		assert.strictEqual(detectNestedLoops(codeWithNested), true);
		assert.strictEqual(detectNestedLoops(codeWithoutNested), false);
	});
});
