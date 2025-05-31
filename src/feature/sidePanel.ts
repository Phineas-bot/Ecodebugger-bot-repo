// Side Panel: Webview provider for tabs (XP/Level, Badges, Eco Tips Log, Leaderboard, Settings)
import * as vscode from 'vscode';
import { XPManager } from './xp';
import { getAchievements } from './achievements';
import { getEcoTipLog } from './ecoTips';
import { ClassroomManager } from './classroom';

export class EcoDebuggerPanelProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ecodebugger.sidePanel';
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
        webviewView.webview.html = this.getHtmlForWebview();
        webviewView.webview.onDidReceiveMessage(msg => {
            if (msg.command === 'reset') {
                const xpManager = new XPManager(this.context);
                xpManager.resetXP();
                this.context.globalState.update('ecodebugger.achievements', undefined);
                this.context.globalState.update('ecodebugger.ecotiplog', undefined);
                vscode.window.showInformationMessage('EcoDebugger progress reset.');
            }
        });
    }

    getHtmlForWebview(): string {
        const xpManager = new XPManager(this.context);
        const classroomManager = new ClassroomManager(this.context);
        const achievements = getAchievements(this.context);
        const ecoTipLog = getEcoTipLog(this.context);
        // For demo, use first classroom if exists
        const classrooms = classroomManager.getClassrooms();
        const leaderboard = classrooms[0]?.leaderboard || [];
        const weeklyTop = classrooms[0]?.weeklyTop || '';
        return `
            <style>
                body { font-family: sans-serif; }
                .tabs { display: flex; gap: 10px; margin-bottom: 10px; }
                .tab { cursor: pointer; padding: 5px 10px; border-radius: 5px; background: #e0ffe0; }
                .tab.active { background: #4caf50; color: white; }
                .panel { display: none; }
                .panel.active { display: block; }
            </style>
            <div class="tabs">
                <div class="tab active" data-tab="xp">XP/Level</div>
                <div class="tab" data-tab="badges">Badges</div>
                <div class="tab" data-tab="eco">Eco Tips Log</div>
                <div class="tab" data-tab="leaderboard">Leaderboard</div>
                <div class="tab" data-tab="settings">Settings</div>
            </div>
            <div class="panel active" id="xp">
                <h3>XP: ${xpManager.getXP()} / Level: ${xpManager.getLevel()}</h3>
                <progress value="${xpManager.getXPBar().current}" max="${xpManager.getXPBar().max}"></progress>
            </div>
            <div class="panel" id="badges">
                <h3>Badges Earned</h3>
                <ul>${achievements.filter(a => a.unlocked).map(a => `<li>${a.name}</li>`).join('')}</ul>
            </div>
            <div class="panel" id="eco">
                <h3>Eco Tips Log</h3>
                <ul>${ecoTipLog.map(t => `<li>${t.message}</li>`).join('')}</ul>
            </div>
            <div class="panel" id="leaderboard">
                <h3>Leaderboard</h3>
                <ol>${leaderboard.map(l => `<li>${l.user}: ${l.xp} XP</li>`).join('')}</ol>
                <p>Weekly Top Coder: <b>${weeklyTop}</b></p>
            </div>
            <div class="panel" id="settings">
                <h3>Settings</h3>
                <label><input type="checkbox" id="ecoTipsToggle" checked> Enable eco tips</label><br>
                <button id="resetBtn">Reset XP/achievements</button>
            </div>
            <script>
                const tabs = document.querySelectorAll('.tab');
                const panels = document.querySelectorAll('.panel');
                tabs.forEach(tab => {
                    tab.onclick = () => {
                        tabs.forEach(t => t.classList.remove('active'));
                        panels.forEach(p => p.classList.remove('active'));
                        tab.classList.add('active');
                        document.getElementById(tab.dataset.tab).classList.add('active');
                    };
                });
                document.getElementById('resetBtn').onclick = () => {
                    vscode.postMessage({ command: 'reset' });
                };
            </script>
        `;
    }
}
