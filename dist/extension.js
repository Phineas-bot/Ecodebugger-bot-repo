/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(__webpack_require__(1));
const path = __importStar(__webpack_require__(2));
const achievements_1 = __webpack_require__(3);
const xp_1 = __webpack_require__(4);
const statusBar_1 = __webpack_require__(5);
const bugs_1 = __webpack_require__(6);
let xp = 0;
let level = 1;
let statusBarItem;
let debounceTimer;
function analyzeCodeInRealTime(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            console.log('No active editor found');
            return;
        }
        const text = editor.document.getText();
        if ((0, bugs_1.detectNestedLoops)(text)) {
            vscode.window.showWarningMessage('⚡ Eco Tip: Avoid nested loops when possible. Consider using more efficient algorithms or data structures.');
        }
        else {
            xp += 50;
            if (xp >= (0, xp_1.xpForNextLevel)(level)) {
                xp -= (0, xp_1.xpForNextLevel)(level);
                level++;
                vscode.window.showInformationMessage(`🎉 Congratulations! You reached Level ${level}!`);
            }
            (0, achievements_1.checkAchievements)(xp, level);
            (0, statusBar_1.updateStatusBar)(statusBarItem, xp, level);
        }
    }, 500);
}
function activate(context) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);
    (0, statusBar_1.updateStatusBar)(statusBarItem, xp, level);
    console.log('Congratulations, your extension "Ecodebugger" is now active!');
    // Register the webview view provider
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('ecodebuggerView', new EcoDebuggerViewProvider(context)));
}
class EcoDebuggerViewProvider {
    context;
    constructor(context) {
        this.context = context;
    }
    resolveWebviewView(webviewView) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'media'))],
        };
        webviewView.webview.html = getWebviewContent(webviewView.webview, this.context.extensionPath);
    }
}
function getWebviewContent(webview, extensionPath) {
    const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'media', 'style.css')));
    const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'out', 'main.js')));
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>EcoDebugger</title>
            <link rel="stylesheet" href="${styleUri}">
        </head>
        <body>
            <div class="sidebar">
                <div class="level-box">
                    <span class="level">Level <span id="level">1</span></span>
                    <span class="xp"><span id="current-xp">0</span> XP</span>
                    <div class="progress-bar">
                        <div id="progress-fill" style="width: 60%;"></div>
                    </div>
                </div>

                <h4>Eco Tips</h4>
                <div class="eco-tip">
                    <p id="analysis-text">🌱 This loop wastes CPU → try map()</p>
                    <p class="carbon">Et: 0.4 g</p>
                    <button id="copy-code-btn">Copy Selected Code</button>
                </div>

                <h4>Achievements</h4>
                <div class="achievements">
                    <button id="green-coder">✅ Green Coder</button>
                    <button id="bug-slayer">🚫 Bug Slayer</button>
                </div>

                <div id="achievement-modal" class="modal hidden">
                    <div class="modal-content">
                        <span id="close-modal">&times;</span>
                        <h3 id="achievement-title"></h3>
                        <p id="achievement-description"></p>
                    </div>
                </div>

                <h4>Classroom Mode</h4>
                <div class="classroom">
                    <ul id="player-list"></ul>
                </div>
            </div>
            <script src="${scriptUri}"></script>
        </body>
        </html>
    `;
}
function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 3 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.checkAchievements = checkAchievements;
const vscode = __importStar(__webpack_require__(1));
const achievements = {};
function checkAchievements(xp, level) {
    if (!achievements['First 100 XP'] && xp >= 100) {
        achievements['First 100 XP'] = true;
        vscode.window.showInformationMessage('🎉 Achievement Unlocked: First 100 XP!');
    }
    if (!achievements['Level 5'] && level >= 5) {
        achievements['Level 5'] = true;
        vscode.window.showInformationMessage('🎉 Achievement Unlocked: Level 5!');
    }
}


/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.xpForNextLevel = xpForNextLevel;
function xpForNextLevel(level) {
    return level * 100;
}


/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.updateStatusBar = updateStatusBar;
function updateStatusBar(statusBarItem, xp, level) {
    if (statusBarItem) {
        statusBarItem.text = `$(star) Level: ${level} | XP: ${xp}/${level * 100}`;
        statusBarItem.show();
    }
}


/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
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


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map