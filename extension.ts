import * as vscode from 'vscode';
import * as path from 'path';
import { checkAchievements } from './utils/achievements';
import { provideEcoTips } from './utils/ecoTips';
import { xpForNextLevel } from './utils/xp';
import { updateStatusBar } from './utils/statusBar';
import { detectNestedLoops } from './utils/bugs';

let xp = 0;
let level = 1;
let statusBarItem: vscode.StatusBarItem;
let debounceTimer: NodeJS.Timeout | undefined;

function analyzeCodeInRealTime(event: vscode.TextDocumentChangeEvent): void {
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

        if (detectNestedLoops(text)) {
            vscode.window.showWarningMessage(
                '⚡ Eco Tip: Avoid nested loops when possible. Consider using more efficient algorithms or data structures.'
            );
        } else {
            xp += 50;

            if (xp >= xpForNextLevel(level)) {
                xp -= xpForNextLevel(level);
                level++;
                vscode.window.showInformationMessage(`🎉 Congratulations! You reached Level ${level}!`);
            }

            checkAchievements(xp, level);
            updateStatusBar(statusBarItem, xp, level);
        }
    }, 500);
}

export function activate(context: vscode.ExtensionContext): void {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);
    updateStatusBar(statusBarItem, xp, level);

    console.log('Congratulations, your extension "Ecodebugger" is now active!');

    // Register the webview view provider
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('ecodebuggerView', new EcoDebuggerViewProvider(context))
    );
}

class EcoDebuggerViewProvider implements vscode.WebviewViewProvider {
    private readonly context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    resolveWebviewView(webviewView: vscode.WebviewView): void {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'media'))],
        };
               const state = {
            ecoTips: [
                { tip: 'This loop wastes CPU → try map()!' },
                { tip: 'Use list comprehensions for efficiency.' }
            ],
            achievements: [
                { name: 'Green Coder', unlocked: true, icon: '🌱', description: 'Apply 10 eco tips.' },
                { name: 'Bug Slayer', unlocked: true, icon: '🪲', description: 'Fix 20 bugs.' },
                { name: 'Efficient Thinker', unlocked: false, icon: '⚡', description: 'Reach 500 XP.' },
                { name: 'Team Leader', unlocked: false, icon: '👑', description: 'Top leaderboard in classroom mode.' },
                { name: 'XP Novice', unlocked: true, icon: '⭐', description: 'Earn your first XP.' },
                { name: 'Eco Streak', unlocked: false, icon: '🔥', description: 'Apply eco tips 5 times in a row.' }
            ],
        };

        webviewView.webview.html = getWebviewContent(state, webviewView.webview, this.context.extensionPath);
    }
}

function getWebviewContent(state: any, webview: vscode.Webview, extensionPath: string): string {
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
                    ${state.achievements.map((a: any) => `
                    <button class="messi${a.unlocked ? '' : ' locked'}">
                        <span class="badge-icon">${a.icon}</span>
                        <span>${a.name}${a.unlocked ? '' : ' (locked)'}</span>
                        <span style="margin-left:auto;font-size:0.9rem;color:#aaa;">${a.description}</span>
                    </button>
                `).join('')}
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
<script>
(function() {
    let currentXP = 0; // Initial XP
    let level = 1; // Initial level
    const xpToNextLevel = 200; // XP required to level up

    const levelElement = document.getElementById("level");
    const currentXPElement = document.getElementById("current-xp");
    const progressFill = document.getElementById("progress-fill");

    function updateXP(newXP) {
      currentXP += newXP;

      // Check if level up is needed
      while (currentXP >= xpToNextLevel) {
        currentXP -= xpToNextLevel; // Carry over extra XP
        level++;
        levelElement.textContent = level; // Update level in UI
      }

      // Update progress bar
      const progressPercentage = (currentXP / xpToNextLevel) * 100;
      progressFill.style.width = progressPercentage + "%";

      // Update XP display
      currentXPElement.textContent = currentXP;
    }

    // Example: Add 50 XP
    updateXP(600);

    // achievement: level up
    const modal = document.getElementById("achievement-modal");
    const title = document.getElementById("achievement-title");
    const description = document.getElementById("achievement-description");
    const closeBtn = document.getElementById("close-modal");

    document.getElementById("green-coder").addEventListener("click", () => {
      title.textContent = "Green Coder";
      description.textContent = "Awarded for writing energy-efficient code using best practices like map(), filter(), and async/await.";
      modal.classList.remove("hidden");
    });

    document.getElementById("bug-slayer").addEventListener("click", () => {
      title.textContent = "Bug Slayer";
      description.textContent = "Earned by identifying and resolving multiple logical errors or anti-patterns in your code.";
      modal.classList.remove("hidden");
    });

    closeBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
    });

    // Optional: Close modal on background click
    window.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.add("hidden");
    });

    // Listen for the button click
    document.getElementById("copy-code-btn").addEventListener("click", () => {
      // Send a message to the VS Code extension to get the selected code
      if (window.vscode) {
        window.vscode.postMessage({ command: "getSelectedCode" });
      }
    });

    // Listen for messages from the VS Code extension
    window.addEventListener("message", (event) => {
      const message = event.data;

      if (message.command === "setSelectedCode") {
        // Update the analysis text with the selected code
        const analysisText = document.getElementById("analysis-text");
        analysisText.textContent = message.selectedCode;
      }
    });

    // Mock function to simulate fetching player data
    async function fetchPlayerData() {
      // Simulated player data with random XP values
      const players = [
        { name: "🏆 Victory-1", xp: Math.floor(Math.random() * 500) },
        { name: "👩 Maria", xp: Math.floor(Math.random() * 500) },
        { name: "👨 You", xp: Math.floor(Math.random() * 500) },
        { name: "🧑 Alex", xp: Math.floor(Math.random() * 500) },
        { name: "👩‍💻 Sarah", xp: Math.floor(Math.random() * 500) },
      ];
      return players;
    }

    // Function to render players in the "Classroom Mode" section
    async function renderClassroomMode() {
      const playerList = document.getElementById("player-list");

      // Fetch player data
      const players = await fetchPlayerData();

      // Sort players by XP in descending order
      players.sort(function(a, b) { return b.xp - a.xp; });

      // Clear the existing list
      playerList.innerHTML = "";

      // Populate the list with player data
      players.forEach(function(player) {
        const listItem = document.createElement("li");
        listItem.innerHTML =
          '<span>' + player.name + '</span>' +
          '<span>' + player.xp + ' XP</span>';
        playerList.appendChild(listItem);
      });
    }

    // Call the function to render the classroom mode
    renderClassroomMode();
})();
</script>

        </body>
        </html>
    `;
}

export function deactivate(): void {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}