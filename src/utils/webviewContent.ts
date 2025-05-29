export function getEcoDebuggerWebviewContent(state: any): string {
    const escapeHtml = (unsafe: string): string => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const renderEcoTip = (tip: any): string => {
        const issue = escapeHtml(tip.issue || "No issue provided");
        const suggestion = escapeHtml(tip.suggestion || "No suggestion provided");
        const explanation = escapeHtml(tip.explanation || "No explanation provided");
        const snippet = escapeHtml(tip.snippet || "");

        return `
            <article class="eco-tip">
                <header class="eco-tip-header">${issue}</header>
                <section class="eco-tip-body">
                    <p><b>Suggestion:</b> ${suggestion}</p>
                    <p><b>Explanation:</b> ${explanation}</p>
                    <pre>${snippet}</pre>
                    <button class="replace-code">Replace Code</button>
                </section>
            </article>
        `;
    };

    const ecoTipsHtml = state.ecoTips.map(renderEcoTip).join("");
    const achievementsHtml = state.achievements.map((a: any) => `
        <div class="achievement${a.unlocked ? ' unlocked' : ' locked'}">
            <span class="badge-icon">${a.icon}</span>
            <span>${a.name}${a.unlocked ? '' : ' (locked)'}</span>
            <span style="margin-left:auto;font-size:0.9rem;color:var(--vscode-descriptionForeground);">${a.description}</span>
        </div>
    `).join("");

    const leaderboardHtml = state.leaderboard.map((l: any) => `
        <li class="leader">${l.name}: ${l.xp} XP</li>
    `).join("");

    const xpHistory = state.xpHistory || [100, 200, 400, 600, 800];

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>EcoDebugger</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            :root {
                color-scheme: light dark;
            }

            body {
                font-family: Arial, sans-serif;
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                margin: 0;
                padding: 0;
            }

            .container {
                padding: 20px;
            }

            .eco-tip, .achievement, .leader {
                border: 1px solid var(--vscode-editorWidget-border);
                margin-bottom: 10px;
                padding: 10px;
                border-radius: 5px;
                background: var(--vscode-editorWidget-background);
            }

            .eco-tip-header {
                font-weight: bold;
                cursor: pointer;
            }

            .eco-tip-body {
                margin-top: 10px;
                overflow: hidden;
                max-height: 0;
                transition: max-height 0.3s ease-out;
            }

            .eco-tip-body.open {
                max-height: 1000px;
            }

            .achievement.locked {
                opacity: 0.5;
                filter: grayscale(1);
            }

            .achievement.unlocked {
                animation: sparkle 1s ease-in-out;
            }

            @keyframes sparkle {
                0% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.2); opacity: 1; }
                100% { transform: scale(1); opacity: 0.9; }
            }

            button {
                margin-top: 10px;
                padding: 5px 10px;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: 3px;
                cursor: pointer;
            }

            .tabs {
                display: flex;
                flex-wrap: wrap;
                cursor: pointer;
                margin-bottom: 10px;
            }

            .tab {
                flex: 1;
                padding: 10px;
                text-align: center;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border-radius: 3px 3px 0 0;
            }

            .tab.active {
                background: var(--vscode-button-hoverBackground);
            }

            [id^="tab-content-"] {
                display: none;
            }

            #tab-content-xp.active,
            #tab-content-badges.active,
            #tab-content-eco.active,
            #tab-content-leader.active,
            #tab-content-settings.active {
                display: block;
            }

            @keyframes xpGain {
                from { transform: scale(1); }
                to { transform: scale(1.2); }
            }

            .xp-animate {
                animation: xpGain 0.5s ease-in-out alternate infinite;
            }

            @media (max-width: 600px) {
                .tabs {
                    flex-direction: column;
                }

                .tab {
                    border-radius: 0 !important;
                }
            }

            ul {
                padding-left: 20px;
            }

            canvas {
                max-width: 400px;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <nav class="tabs">
                <div class="tab active" id="tab-xp">XP/Level</div>
                <div class="tab" id="tab-badges">Achievements</div>
                <div class="tab" id="tab-eco">Eco Tips Log</div>
                <div class="tab" id="tab-leader">Leaderboard</div>
                <div class="tab" id="tab-settings">Settings</div>
            </nav>

            <section id="tab-content-xp" class="active">
                <div class="level">Level ${state.level}</div>
                <div class="xp xp-animate">${state.xp} XP</div>
                <canvas id="xpChart"></canvas>
                <canvas id="xpHistoryChart"></canvas>
            </section>

            <section id="tab-content-badges">
                <h3>Achievements</h3>
                ${achievementsHtml || "No achievements yet."}
            </section>

            <section id="tab-content-eco">
                <h3>Eco Tips Log</h3>
                ${ecoTipsHtml || "No suggestions yet."}
            </section>

            <section id="tab-content-leader">
                <h3>Leaderboard</h3>
                <ul>${leaderboardHtml || "<li>No leaderboard data available.</li>"}</ul>
            </section>

            <section id="tab-content-settings">
                <h3>Settings</h3>
                <label><input type="checkbox" id="eco-tips-toggle" ${state.ecoTipsEnabled ? 'checked' : ''}/> Enable Eco Tips</label>
                <br/>
                <button id="reset-xp">Reset XP/Achievements</button>
            </section>
        </div>

        <script>
            const vscode = acquireVsCodeApi();

            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('[id^="tab-content-"]').forEach(c => c.classList.remove('active'));
                    tab.classList.add('active');
                    document.getElementById('tab-content-' + tab.id.split('-')[1]).classList.add('active');
                });
            });

            document.getElementById('eco-tips-toggle').addEventListener('change', (event) => {
                vscode.postMessage({ command: 'toggleEcoTips', enabled: event.target.checked });
            });

            document.getElementById('reset-xp').addEventListener('click', () => {
                vscode.postMessage({ command: 'resetXP' });
            });

            document.querySelectorAll('.eco-tip-header').forEach(header => {
                header.addEventListener('click', () => {
                    const body = header.nextElementSibling;
                    body?.classList.toggle('open');
                });
            });

            document.querySelectorAll('.replace-code').forEach(button => {
                button.addEventListener('click', (event) => {
                    const snippet = event.target.closest('.eco-tip').querySelector('pre').textContent;
                    vscode.postMessage({ command: 'replaceCode', snippet });
                });
            });

            const xpChart = new Chart(document.getElementById('xpChart'), {
                type: 'bar',
                data: {
                    labels: ['XP'],
                    datasets: [{
                        label: 'XP Progress',
                        data: [${state.xp}],
                        backgroundColor: '#4caf50'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 1000
                        }
                    }
                }
            });

            const xpHistoryChart = new Chart(document.getElementById('xpHistoryChart'), {
                type: 'line',
                data: {
                    labels: xpHistory.map((_, i) => 'Day ' + (i + 1)),
                    datasets: [{
                        label: 'XP History',
                        data: xpHistory,
                        borderColor: '#4caf50',
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        </script>
    </body>
    </html>`;
}


