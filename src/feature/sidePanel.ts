// Side Panel: Webview provider for tabs (XP/Level, Badges, Eco Tips Log, Leaderboard, Settings)
import * as vscode from 'vscode';
import { XPManager } from './xp';
import { getAchievements } from './achievements';
import { getEcoTipLog } from './ecoTips';
import { ClassroomManager } from './classroom';

export class EcoDebuggerPanelProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ecodebuggerPanel';
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
            } else if (msg.command === 'insertReplacement' && typeof msg.text === 'string') {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    editor.edit(editBuilder => {
                        const selection = editor.selection;
                        editBuilder.replace(selection, msg.text);
                    });
                } else {
                    vscode.window.showWarningMessage('No active editor to insert replacement.');
                }
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
                .xp-bar { width: 100%; height: 20px; background: #e0e0e0; border-radius: 10px; overflow: hidden; margin: 10px 0; }
                .xp-bar-inner { height: 100%; background: #4caf50; transition: width 0.3s; }
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
                <div class="xp-bar"><div class="xp-bar-inner" style="width:${(xpManager.getXPBar().current / xpManager.getXPBar().max) * 100}%"></div></div>
                <small>${xpManager.getXPBar().current} / ${xpManager.getXPBar().max} XP to next level</small>
            </div>
            <div class="panel" id="badges">
                <h3>Badges Earned</h3>
                <ul>${achievements.filter(a => a.unlocked).length ? achievements.filter(a => a.unlocked).map(a => `<li>🏅 ${a.name}</li>`).join('') : '<li>No badges earned yet.</li>'}</ul>
            </div>
            <div class="panel" id="eco">
                <h3>Eco Tips Log</h3>
                <ul>
                    ${ecoTipLog.length ? ecoTipLog.map((t, idx) => {
                        const anyTip = t as any;
                        const isDetailed = anyTip.issue && anyTip.suggestion && anyTip.cpuSaved && anyTip.replacement;
                        return '<li style="margin-bottom:1em;">' +
                            '<div style="background:#f4fff4;padding:8px;border-radius:6px;">' +
                                `<b>🌱 Tip ${idx + 1}</b><br/>` +
                                (isDetailed ? (
                                    `<b>Issue:</b> ${anyTip.issue}<br/>` +
                                    `<b>Suggestion:</b> ${anyTip.suggestion}<br/>` +
                                    `<b>CPU Saved:</b> ${anyTip.cpuSaved}<br/>` +
                                    `<button onclick="showReplacement(${idx})">Show Replacement</button> ` +
                                    `<button onclick="copyReplacement(${idx})">Copy Replacement</button> ` +
                                    `<button onclick="insertReplacement(${idx})">Insert Replacement</button>` +
                                    `<pre id="replacement-${idx}" style="display:none;background:#e8e8e8;padding:6px;border-radius:4px;">${anyTip.replacement}</pre>`
                                ) : (
                                    `<b>Message:</b> ${t.message}`
                                )) +
                            '</div>' +
                        '</li>';
                    }).join('') : '<li>No eco tips yet.</li>'}
                </ul>
                <script>
                    function showReplacement(idx) {
                        const pre = document.getElementById('replacement-' + idx);
                        if (pre.style.display === 'none') {
                            pre.style.display = 'block';
                        } else {
                            pre.style.display = 'none';
                        }
                    }
                    function copyReplacement(idx) {
                        const pre = document.getElementById('replacement-' + idx);
                        if (pre) {
                            const text = pre.textContent;
                            navigator.clipboard.writeText(text);
                        }
                    }
                    function insertReplacement(idx) {
                        const pre = document.getElementById('replacement-' + idx);
                        if (pre) {
                            const text = pre.textContent;
                            vscode.postMessage({ command: 'insertReplacement', text });
                        }
                    }
                </script>
            </div>
            <div class="panel" id="leaderboard">
                <h3>Leaderboard</h3>
                <ol>${leaderboard.length ? leaderboard.map(l => `<li>${l.user}: ${l.xp} XP</li>`).join('') : '<li>No leaderboard data.</li>'}</ol>
                <p>Weekly Top Coder: <b>${weeklyTop || 'N/A'}</b></p>
            </div>
            <div class="panel" id="settings">
                <h3>Settings</h3>
                <label><input type="checkbox" id="ecoTipsToggle" checked> Enable eco tips</label><br>
                <button id="resetBtn">Reset XP/achievements</button>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
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
