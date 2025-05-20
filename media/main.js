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

// Example function to fetch player data from a database (replace with your API endpoint)
async function fetchPlayerData() {
  // Replace with your actual API endpoint
  const response = await fetch("https://example.com/api/players");
  const players = await response.json();
  return players;
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