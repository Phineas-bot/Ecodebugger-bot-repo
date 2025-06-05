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
    console.log('Received message:', message);
    
    if (message.command === 'updateXP' && message.state) {
        console.log('Processing updateXP message:', message.state);
        const { xp, level } = message.state;
        updateXPDisplay(xp, level);
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
  players.sort((a, b) => b.xp - a.xp);

  // Clear the existing list
  playerList.innerHTML = "";

  // Populate the list with player data
  players.forEach((player) => {
    const listItem = document.createElement("li");
    listItem.innerHTML = `
      <span>${player.name}</span>
      <span>${player.xp} XP</span>
    `;
    playerList.appendChild(listItem);
  });
}

// Call the function to render the classroom mode
renderClassroomMode();

// Classroom join logic
const joinBtn = document.getElementById("join-class-btn");
const classInput = document.getElementById("class-code-input");
joinBtn.addEventListener("click", () => {
  vscode.postMessage({ command: "joinClassroom", code: classInput.value });
});

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
    const notificationsList = document.getElementById("notifications-list") || createNotificationsList();
    notificationsList.innerHTML = notifications.map(n => `
        <div class="notification">
            <span class="timestamp">${new Date(n.timestamp).toLocaleTimeString()}</span>
            <span class="message">${n.message}</span>
        </div>
    `).join('');
}

function createNotificationsList() {
    const container = document.querySelector('.classroom') || document.body;
    const list = document.createElement('div');
    list.id = 'notifications-list';
    container.appendChild(list);
    return list;
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
    const classroomIdDisplay = document.createElement('div');
    classroomIdDisplay.id = 'classroom-id-display';
    classroomSettings.appendChild(classroomIdDisplay);
    const joinClassBtn = document.createElement('button');
    joinClassBtn.textContent = 'Join Classroom';
    const leaveClassBtn = document.createElement('button');
    leaveClassBtn.textContent = 'Leave Classroom';
    leaveClassBtn.style.marginLeft = '10px';
    classroomSettings.appendChild(joinClassBtn);
    classroomSettings.appendChild(leaveClassBtn);
    if (state.classroom && state.classroom.code) {
        classroomIdDisplay.textContent = 'Classroom ID: ' + state.classroom.code;
        joinClassBtn.style.display = 'none';
        leaveClassBtn.style.display = '';
    } else {
        classroomIdDisplay.textContent = 'Not in a classroom';
        joinClassBtn.style.display = '';
        leaveClassBtn.style.display = 'none';
    }
    joinClassBtn.onclick = () => {
        const id = prompt('Enter Classroom ID:');
        const pin = prompt('Enter PIN (if required):');
        vscode.postMessage({ command: 'joinClassroom', id, pin });
    };
    leaveClassBtn.onclick = () => {
        vscode.postMessage({ command: 'leaveClassroom' });
    };

    // Weekly summary
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

    // Render enhanced leaderboard
    renderLeaderboard(state.leaderboard);

    // Render notifications
    renderNotifications(state.classroom?.notifications);
}

// Listen for classroom state updates with enhanced state handling
window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.command === 'updateXP' && message.state) {
        const { xp, level } = message.state;
        updateXPDisplay(xp, level);
        updateClassroomSidebar(message.state);
    }
});