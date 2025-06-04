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
  progressFill.style.width = `${progressPercentage}%`;

  // Update XP display
  currentXPElement.textContent = currentXP;
}

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

window.addEventListener('message', (event) => {
  const message = event.data;
  if (message.command === 'updateXP' && message.state) {
    // Update XP, level, and progress bar in the UI
    const { xp, level } = message.state;
    document.getElementById('level').textContent = level;
    document.getElementById('current-xp').textContent = xp;
    const progressFill = document.getElementById('progress-fill');
    const percent = Math.floor((xp / (level * 100)) * 100);
    progressFill.style.width = percent + '%';
  }
});