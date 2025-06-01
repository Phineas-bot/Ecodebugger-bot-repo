import * as vscode from 'vscode';
import { XPManager } from './xp';
import { getAchievements } from './achievements';
import { getEcoTipLog } from './ecoTips';
import { ClassroomManager } from './classroom';
import { getDetailedEcoTipForCodeWithLLM } from './ecoTips';

export class CustomEcoDebuggerPanelProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ecodebuggerCustomPanel';
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        webviewView.webview.options = {
            enableScripts: true
        };
        webviewView.webview.html = getGamifiedDashboardHtml();
    }
}

export function registerCustomEcoDebuggerPanel(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            CustomEcoDebuggerPanelProvider.viewType,
            new CustomEcoDebuggerPanelProvider(context)
        )
    );
}

function getGamifiedDashboardHtml(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EcoDebugger Dashboard</title>
  <style>
    :root {
      --bg: #1e1e1e;
      --panel: #23272e;
      --accent: #43d675;
      --accent-dark: #2e7d32;
      --text: #e0e0e0;
      --badge-bg: linear-gradient(90deg, #43d675 60%, #2e7d32 100%);
      --eco-tip-bg: #263238;
      --eco-tip-icon: #43d675;
      --badge-shadow: 0 2px 8px #0008;
      --section-gap: 28px;
      --border-radius: 10px;
    }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Segoe UI', 'Arial', sans-serif;
      margin: 0;
      padding: 0 0 24px 0;
      min-width: 340px;
    }
    .dashboard {
      padding: 24px 20px 0 20px;
      max-width: 420px;
      margin: 0 auto;
    }
    .level-badge {
      background: var(--badge-bg);
      color: #fff;
      border-radius: 32px;
      box-shadow: var(--badge-shadow);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: bold;
      padding: 14px 28px;
      margin-bottom: var(--section-gap);
      letter-spacing: 0.5px;
      border: 2px solid #2e7d32;
    }
    .section {
      background: var(--panel);
      border-radius: var(--border-radius);
      box-shadow: 0 1px 4px #0004;
      margin-bottom: var(--section-gap);
      padding: 20px 18px 16px 18px;
    }
    .section-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--accent);
      margin-bottom: 12px;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    /* Eco Tips */
    .eco-tip-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .eco-tip {
      display: flex;
      align-items: flex-start;
      background: var(--eco-tip-bg);
      border-radius: 7px;
      padding: 12px 14px;
      margin-bottom: 12px;
      box-shadow: 0 1px 3px #0002;
      gap: 12px;
      position: relative;
    }
    .eco-tip:last-child { margin-bottom: 0; }
    .eco-tip-icon {
      font-size: 1.5rem;
      color: var(--eco-tip-icon);
      margin-top: 2px;
      flex-shrink: 0;
    }
    .eco-tip-content {
      flex: 1;
    }
    .eco-tip-text {
      font-size: 1rem;
      margin-bottom: 4px;
      color: #b9f6ca;
    }
    .eco-tip-meta {
      font-size: 0.92rem;
      color: #b0bec5;
      display: flex;
      gap: 16px;
    }
    /* Achievements */
    .achievements-list {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
      margin-top: 6px;
    }
    .achievement-badge {
      background: #263238;
      color: #fff;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 1rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 7px;
      box-shadow: 0 1px 3px #0003;
      border: 1.5px solid #43d675;
      transition: background 0.2s;
    }
    .achievement-badge.locked {
      opacity: 0.5;
      filter: grayscale(0.7);
      border-style: dashed;
    }
    /* Leaderboard */
    .leaderboard-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .leaderboard-entry {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #263238;
      font-size: 1rem;
    }
    .leaderboard-entry:last-child { border-bottom: none; }
    .leaderboard-rank {
      font-weight: bold;
      color: var(--accent);
      margin-right: 10px;
      min-width: 24px;
      text-align: right;
    }
    .leaderboard-name {
      flex: 1;
      color: #fff;
      margin-left: 2px;
    }
    .leaderboard-xp {
      color: #b9f6ca;
      font-weight: 500;
      font-size: 1rem;
      margin-left: 10px;
    }
    /* Scrollbar styling for dark mode */
    ::-webkit-scrollbar {
      width: 8px;
      background: #23272e;
    }
    ::-webkit-scrollbar-thumb {
      background: #2e7d32;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <!-- Level Badge -->
    <div class="level-badge" id="levelBadge">
      Level 3 &ndash; 182 XP
    </div>

    <!-- Eco Tips Section -->
    <div class="section" id="ecoTipsSection">
      <div class="section-title">🌱 Eco Tips</div>
      <ul class="eco-tip-list" id="ecoTipList">
        <li class="eco-tip">
          <span class="eco-tip-icon">💡</span>
          <div class="eco-tip-content">
            <div class="eco-tip-text">This loop wastes CPU — try <b>map()</b></div>
            <div class="eco-tip-meta">
              <span>Et: 0.5s</span>
              <span>0.4g CO₂</span>
            </div>
          </div>
        </li>
        <li class="eco-tip">
          <span class="eco-tip-icon">⚡</span>
          <div class="eco-tip-content">
            <div class="eco-tip-text">Avoid unnecessary <b>console.log</b> in production</div>
            <div class="eco-tip-meta">
              <span>Et: 0.2s</span>
              <span>0.1g CO₂</span>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- Achievements Section -->
    <div class="section" id="achievementsSection">
      <div class="section-title">🏆 Achievements</div>
      <div class="achievements-list" id="achievementsList">
        <span class="achievement-badge">🌿 Green Coder</span>
        <span class="achievement-badge">🐞 Bug Slayer</span>
        <span class="achievement-badge locked">🚀 Speedster</span>
      </div>
    </div>

    <!-- Classroom Mode Leaderboard -->
    <div class="section" id="leaderboardSection">
      <div class="section-title">🏫 Classroom Mode</div>
      <ol class="leaderboard-list" id="leaderboardList">
        <li class="leaderboard-entry">
          <span class="leaderboard-rank">1</span>
          <span class="leaderboard-name">Victory-1</span>
          <span class="leaderboard-xp">250 XP</span>
        </li>
        <li class="leaderboard-entry">
          <span class="leaderboard-rank">2</span>
          <span class="leaderboard-name">Maria</span>
          <span class="leaderboard-xp">210 XP</span>
        </li>
        <li class="leaderboard-entry">
          <span class="leaderboard-rank">3</span>
          <span class="leaderboard-name">Alex</span>
          <span class="leaderboard-xp">180 XP</span>
        </li>
      </ol>
    </div>
  </div>
  <script>
    // Placeholder for dynamic updates from the extension backend
    // Example: window.addEventListener('message', event => { ... });
  </script>
</body>
</html>
    `;
}
