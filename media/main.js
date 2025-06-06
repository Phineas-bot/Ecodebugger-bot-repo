// Initialize vscode API
const vscode = acquireVsCodeApi();

let currentXP = 0; // Initial XP
let level = 1; // Initial level
const xpToNextLevel = 200; // XP required to level up

const levelElement = document.getElementById("level");
const currentXPElement = document.getElementById("current-xp");
const progressFill = document.getElementById("progress-fill");

// achievement: level up
const modal = document.getElementById("achievement-modal");
const title = document.getElementById("achievement-title");
const description = document.getElementById("achievement-description");
const closeBtn = document.getElementById("close-modal");

// Achievement modal logic for all badges
const achievementData = {
  "green-coder": {
    title: "Green Coder",
    description: "Apply 10 eco tips.",
  },
  "bug-slayer": {
    title: "Bug Slayer",
    description: "Fix 20 bugs.",
  },
  "efficient-thinker": {
    title: "Efficient Thinker",
    description: "Reach 500 XP.",
  },
  "team-leader": {
    title: "Team Leader",
    description: "Top of classroom leaderboard.",
  },
};
["green-coder", "bug-slayer", "efficient-thinker", "team-leader"].forEach((id) => {
  document.getElementById(id).addEventListener("click", () => {
    title.textContent = achievementData[id].title;
    description.textContent = achievementData[id].description;
    modal.classList.remove("hidden");
  });
});

closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

// Optional: Close modal on background click
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
});

// Listen for the button click
document.getElementById("copy-code-btn").addEventListener("click", () => {
  // Send a message to the VS Code extension to get the selected code
  vscode.postMessage({ command: "getSelectedCode" });
});

// Helper function to update the UI with XP state
function updateXPDisplay(xp, level) {
    console.log('Updating XP display:', { xp, level });
    
    // Update level
    const levelElement = document.getElementById('level');
    if (levelElement) {
        levelElement.textContent = level;
    }
    
    // Update XP
    const currentXPElement = document.getElementById('current-xp');
    if (currentXPElement) {
        currentXPElement.textContent = xp;
    }
    
    // Update progress bar
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        const percent = Math.floor((xp / (level * 100)) * 100);
        progressFill.style.width = percent + '%';
        console.log('Set progress width to:', percent + '%');
    }
}

// Request initial state when the webview loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Webview loaded, requesting state...');
    vscode.postMessage({ command: 'getState' });
});

// Listen for visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('Webview became visible, requesting state...');
        vscode.postMessage({ command: 'getState' });
    }
});

// Listen for messages from the extension
window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.command) {
        case 'updateXP':
            if (message.state) {
                updateXPDisplay(message.state.xp, message.state.level);
            }
            break;
        case 'updateState':
            if (message.state) {
                updateXPDisplay(message.state.xp, message.state.level);
                updateAchievements(message.state.achievements);
                updateEcoTipsLog(message.state.xpLog);
                updateBugReports(message.state.bugReports);
                updateLeaderboard(message.state.leaderboard);
                updateClassroomSidebar(message.state);
            }
            break;
        case 'updateClassroom':
            if (message.classroom) {
                updateClassroomUI(message.classroom);
            }
            break;
            
        case 'showError':
            vscode.window.showErrorMessage(message.message);
            break;
            
        case 'showInfo':
            vscode.window.showInformationMessage(message.message);
            break;
    }
});

function updateAchievements(achievements = []) {
    const list = document.getElementById('achievements-list');
    if (!list) { return; }
    list.innerHTML = achievements.map(a => `
        <div class="achievement${a.unlocked ? '' : ' locked'}">
            <span class="badge-icon">${a.icon}</span>
            <span>${a.name}${a.unlocked ? '' : ' (locked)'}</span>
            <span class="achievement-desc">${a.description}</span>
        </div>
    `).join('');
}

function updateEcoTipsLog(xpLog = []) {
    const log = document.getElementById('eco-tips-log');
    if (!log) { return; }
    log.innerHTML = xpLog.map(entry => `<div class="xp-log-entry">${entry}</div>`).join('');
}

function updateBugReports(bugReports = []) {
    const list = document.getElementById('bug-reports-list');
    if (!list) { return; }
    if (!bugReports.length) {
        list.innerHTML = '<div class="empty">No bugs detected!</div>';
        return;
    }
    list.innerHTML = bugReports.map(bug => `
        <div class="bug-report">
            <div class="bug-desc">🐞 ${bug.description}</div>
            <div class="bug-fix">💡 ${bug.suggestion || ''}</div>
        </div>
    `).join('');
}

function updateLeaderboard(leaderboard = []) {
    const list = document.getElementById('leaderboard-list');
    if (!list) { return; }
    if (!leaderboard.length) {
        list.innerHTML = '<div class="empty">No leaderboard data.</div>';
        return;
    }
    list.innerHTML = leaderboard.map((user, i) => `
        <div class="leaderboard-item">
            <span class="rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
            <span class="username">${user.username}</span>
            <span class="user-xp">${user.xp} XP</span>
            <span class="badges">${(user.achievements || []).map(a => a.icon || '').join(' ')}</span>
        </div>
    `).join('');
}

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

// Function to render players and weekly summary in the "Classroom Mode" section
async function renderClassroomMode() {
    const playerList = document.getElementById("player-list");
    if (!playerList) {
        return;
    }

    // Get parent container
    const classroomContainer = playerList.closest('.classroom');
    if (!classroomContainer) {
        return;
    }

    // Add or update weekly summary before player list if not exists
    let weeklySummary = classroomContainer.querySelector('.weekly-summary');
    if (!weeklySummary) {
        weeklySummary = document.createElement('div');
        weeklySummary.className = 'weekly-summary';
        classroomContainer.insertBefore(weeklySummary, playerList);
    }

    // Fetch player data
    const players = await fetchPlayerData();

    // Sort players by weekly XP
    players.sort((a, b) => b.xp - a.xp);
    
    // Calculate weekly stats
    const topWeeklyPlayer = players[0];
    const totalWeeklyXP = players.reduce((sum, p) => sum + p.xp, 0);
    const yourWeeklyXP = players.find(p => p.name === "👨 You")?.xp || 0;

    // Update weekly summary
    weeklySummary.innerHTML = `
        <div style="margin-bottom: 12px;">
            <div>🏆 Weekly Leader: ${topWeeklyPlayer?.name || 'No leader yet'}</div>
            <div>📊 Your Weekly XP: ${yourWeeklyXP}</div>
            <div>👥 Active Users: ${players.length}</div>
            <div>💫 Total Team XP: ${totalWeeklyXP}</div>
        </div>
    `;

    // Clear the existing list
    playerList.innerHTML = "";

    // Populate the list with player data
    players.forEach((player) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
            <span>${player.name}</span>
            <span>${player.xp} XP</span>
            <button class="report-btn" title="Report suspicious activity" style="margin-left: 8px; padding: 2px 6px; opacity: 0.6;">⚠️</button>
        `;
        
        // Add click handler for report button
        const reportBtn = listItem.querySelector('.report-btn');
        if (reportBtn) {
            reportBtn.onclick = async (e) => {
                e.stopPropagation();
                const reason = await vscode.window.showInputBox({
                    prompt: 'Please provide a reason for reporting',
                    placeHolder: 'e.g., Unusually rapid XP gain'
                });
                if (reason) {
                    vscode.postMessage({
                        command: 'reportUser',
                        userId: player.id,
                        reason
                    });
                }
            };
        }
        playerList.appendChild(listItem);
    });
}

// Call the function to render the classroom mode
renderClassroomMode();

// Settings toggles
const ecoTipsToggle = document.getElementById("eco-tips-toggle");
ecoTipsToggle.onchange = function () {
  vscode.postMessage({ command: "toggleEcoTips", enabled: this.checked });
};
const groqAIToggle = document.getElementById("groq-ai-toggle");
groqAIToggle.onchange = function () {
  vscode.postMessage({ command: "toggleGroqAI", enabled: this.checked });
};
document.getElementById("reset-xp").onclick = function () {
  vscode.postMessage({ command: "resetXP" });
};

// Function to render notifications
function renderNotifications(notifications = []) {
    const container = document.querySelector('.notifications-container') || createNotificationsContainer();
    container.innerHTML = '';

    if (notifications.length === 0) {
        container.innerHTML = '<div class="notification">No notifications</div>';
        return;
    }

    notifications.forEach(notification => {
        const notifElement = document.createElement('div');
        notifElement.className = `notification ${notification.read ? '' : 'unread'}`;
        
        const time = new Date(notification.timestamp).toLocaleString();
        
        notifElement.innerHTML = `
            <div class="notification-content">${notification.message}</div>
            <div class="notification-time">${time}</div>
            <span class="notification-close">×</span>
        `;

        // Add click handler to mark as read
        notifElement.onclick = () => {
            if (!notification.read) {
                vscode.postMessage({
                    command: 'markNotificationRead',
                    id: notification.id
                });
                notifElement.classList.remove('unread');
            }
        };

        // Add close button handler
        const closeBtn = notifElement.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                notifElement.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => {
                    notifElement.remove();
                    vscode.postMessage({
                        command: 'removeNotification',
                        id: notification.id
                    });
                }, 300);
            };
        }

        container.appendChild(notifElement);
    });
}

function createNotificationsContainer() {
    const container = document.createElement('div');
    container.className = 'notifications-container';
    const classroomSection = document.querySelector('.classroom') || document.body;
    classroomSection.appendChild(container);
    return container;
}

// Enhanced classroom leaderboard with badges
function renderLeaderboard(users = []) {
    const leaderboardDiv = document.getElementById('class-leaderboard');
    if (!leaderboardDiv) {
        return;
    }

    let leaderboardHtml = '<h4>Leaderboard</h4><ul class="leaderboard-list">';
    users.forEach((user, i) => {
        const badges = getBadgeEmojis(user.achievements);
        const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : '';
        const weeklyBadge = user.weeklyXP > 100 ? '🔥' : '';
        leaderboardHtml += `
            <li class="leaderboard-item">
                <div class="user-info">
                    <span class="rank">${medal}</span>
                    <span class="username">${user.username}</span>
                    <span class="badges">${badges}</span>
                    <span class="weekly-badge">${weeklyBadge}</span>
                </div>
                <div class="xp-info">
                    <span class="total-xp">${user.xp} XP</span>
                    <span class="weekly-xp">This week: ${user.weeklyXP}</span>
                </div>
            </li>`;
    });
    leaderboardHtml += '</ul>';
    leaderboardDiv.innerHTML = leaderboardHtml;
}

function getBadgeEmojis(achievements = []) {
    const badgeMap = {
        'Green Coder': '🌱',
        'Bug Slayer': '🐞',
        'Efficient Thinker': '⚡',
        'Team Leader': '👑'
    };
    return achievements.map(a => badgeMap[a] || '').join(' ');
}

// Update classroom sidebar with enhanced features
function updateClassroomSidebar(state) {
    // Classroom ID and join/leave
    let classroomSettings = document.getElementById('classroom-settings');
    if (!classroomSettings) {
        classroomSettings = document.createElement('div');
        classroomSettings.id = 'classroom-settings';
        const sidebar = document.querySelector('.sidebar') || document.body;
        sidebar.appendChild(classroomSettings);
    }
    classroomSettings.innerHTML = '';

    // Create status display
    const classroomIdDisplay = document.createElement('div');
    classroomIdDisplay.id = 'classroom-id-display';
    classroomSettings.appendChild(classroomIdDisplay);
    
    // Create buttons container for better layout
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'classroom-controls';
    
    const joinInput = document.createElement('input');
    joinInput.type = 'text';
    joinInput.id = 'class-code-input';
    joinInput.placeholder = 'Enter classroom ID';
    
    const joinClassBtn = document.createElement('button');
    joinClassBtn.id = 'join-class-btn';
    joinClassBtn.textContent = 'Join';
    
    const createClassBtn = document.createElement('button');
    createClassBtn.id = 'create-class-btn';
    createClassBtn.textContent = 'Create New';
    createClassBtn.style.backgroundColor = '#2ecc71';
    
    const leaveClassBtn = document.createElement('button');
    leaveClassBtn.id = 'leave-class-btn';
    leaveClassBtn.textContent = 'Leave';

    // Show/hide buttons based on classroom state
    if (state.classroom && state.classroom.classroom_id) {
        classroomIdDisplay.textContent = `Classroom ID: ${state.classroom.classroom_id}`;
        joinInput.style.display = 'none';
        joinClassBtn.style.display = 'none';
        createClassBtn.style.display = 'none';
        leaveClassBtn.style.display = '';
    } else {
        classroomIdDisplay.textContent = 'Not in a classroom';
        joinInput.style.display = '';
        joinClassBtn.style.display = '';
        createClassBtn.style.display = '';
        leaveClassBtn.style.display = 'none';
    }

    // Set up button event handlers
    joinClassBtn.onclick = () => {
        const id = joinInput.value.trim();
        if (id) {
            vscode.postMessage({ 
                command: 'joinClassroom', 
                id: id,
                pin: undefined // Optional PIN support
            });
        } else {
            vscode.window.showErrorMessage('Please enter a classroom ID');
        }
    };

    createClassBtn.onclick = () => {
        vscode.postMessage({ command: 'createClassroom' });
    };

    leaveClassBtn.onclick = () => {
        if (confirm('Are you sure you want to leave this classroom?')) {
            vscode.postMessage({ command: 'leaveClassroom' });
        }
    };

    // Add elements to container
    buttonsContainer.appendChild(joinInput);
    buttonsContainer.appendChild(joinClassBtn);
    buttonsContainer.appendChild(createClassBtn);
    buttonsContainer.appendChild(leaveClassBtn);
    classroomSettings.appendChild(buttonsContainer);

    // Update leaderboard if available
    if (state.classroom?.users) {
        renderLeaderboard(state.classroom.users);
    }

    // Update notifications if available
    if (state.classroom?.notifications) {
        renderNotifications(state.classroom.notifications);
    }

    // Add weekly summary if available
    if (state.classroom?.weeklyTopUser) {
        const weeklySummary = document.createElement('div');
        weeklySummary.className = 'weekly-summary';
        weeklySummary.innerHTML = `
            <h4>Weekly Progress</h4>
            <div class="weekly-stats">
                <div>🏆 Top Coder: ${state.classroom.weeklyTopUser}</div>
                <div>📊 Your Weekly XP: ${state.currentUser?.weeklyXP || 0}</div>
                <div>👥 Active Users: ${state.classroom.users?.length || 0}</div>
            </div>
        `;
        classroomSettings.appendChild(weeklySummary);
    }
}

// Add 'Sync Now' button next to join button (only if not already present)
(function addSyncNowButton() {
  const joinBtn = document.getElementById("join-class-btn");
  if (joinBtn && !document.getElementById("sync-now-btn")) {
    const syncBtn = document.createElement("button");
    syncBtn.id = "sync-now-btn";
    syncBtn.textContent = "Sync Now";
    syncBtn.style.marginLeft = "8px";
    syncBtn.onclick = () => {
      vscode.postMessage({ command: "syncClassroom" });
    };
    joinBtn.parentElement.insertBefore(syncBtn, joinBtn.nextSibling);
  }
})();

// Update the UI with classroom state
function updateClassroomUI(state) {
    // Update leaderboard
    if (state.users && Array.isArray(state.users)) {
        renderLeaderboard(state.users);
    }

    // Update notifications
    if (Array.isArray(state.notifications)) {
        renderNotifications(state.notifications);
    }

    // Update weekly summary
    const weeklyDiv = document.getElementById('weekly-top');
    if (weeklyDiv && state.weeklyTopUser) {
        weeklyDiv.innerHTML = `
            <h4>Weekly Top User</h4>
            <div class="weekly-leader">${state.weeklyTopUser}</div>
        `;
    }

    // Update classroom ID display
    const idDisplay = document.getElementById('classroom-id-display');
    if (idDisplay) {
        idDisplay.textContent = state.classroom_id ? 
            `Classroom ID: ${state.classroom_id}` : 
            'Not in a classroom';
    }
}