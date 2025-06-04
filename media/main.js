// VS Code webview messaging API
const vscode = acquireVsCodeApi();

// Debounce function for smoother updates
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// State management
let state = {
    xp: 0,
    level: 1,
    xpToNextLevel: 100,
    ecoTips: [],
    achievements: [],
    leaderboard: [],
    settings: {
        ecoTipsEnabled: true,
        groqAIEnabled: true
    }
};

// Initialize state from previous session if available
const previousState = vscode.getState();
if (previousState) {
    state = previousState;
    updateUI(state);
}

// XP and Level Management
const updateXPDisplay = debounce((newXP, newLevel) => {
    const oldLevel = state.level;
    const oldXP = state.xp;
    
    // Update state
    state.xp = newXP;
    state.level = newLevel;
    
    // Get DOM elements
    const levelElement = document.getElementById('level');
    const xpElement = document.getElementById('current-xp');
    const progressFill = document.getElementById('progress-fill');
    
    if (!levelElement || !xpElement || !progressFill) {
        return; // Guard against missing elements
    }
    
    // Handle level up animation
    if (newLevel > oldLevel) {
        levelElement.classList.add('level-up-animation');
        setTimeout(() => levelElement.classList.remove('level-up-animation'), 1000);
    }
    
    // Handle XP change animation
    if (newXP !== oldXP) {
        xpElement.classList.add('xp-change');
        setTimeout(() => xpElement.classList.remove('xp-change'), 500);
    }
    
    // Calculate and update progress bar
    const xpForNext = newLevel * 100; // XP needed for next level
    const progressPercent = (newXP / xpForNext) * 100;
    
    // Animate progress bar
    progressFill.style.transition = 'width 0.5s ease-out';
    progressFill.style.width = `${Math.min(100, progressPercent)}%`;
    
    // Update text displays
    levelElement.textContent = newLevel;
    xpElement.textContent = newXP;
    
    // Save state
    vscode.setState(state);
}, 50);

// Achievement Management
function updateAchievements(achievements) {
    const achievementsList = document.getElementById('achievements-list');
    achievementsList.innerHTML = achievements.map(achievement => `
        <div class="achievement ${achievement.unlocked ? 'unlocked' : ''}" 
             data-name="${achievement.name}">
            <span class="achievement-icon">${achievement.icon}</span>
            <div class="achievement-info">
                <span class="achievement-name">${achievement.name}</span>
                <span class="achievement-desc">${achievement.description}</span>
            </div>
            ${achievement.unlocked ? '<span class="achievement-unlocked">✓</span>' : ''}
        </div>
    `).join('');
    
    // Add click handlers for achievement details
    document.querySelectorAll('.achievement').forEach(ach => {
        ach.addEventListener('click', () => showAchievementDetails(
            achievements.find(a => a.name === ach.dataset.name)
        ));
    });
}

function showAchievementDetails(achievement) {
    const modal = document.getElementById('achievement-modal');
    document.getElementById('achievement-title').textContent = achievement.name;
    document.getElementById('achievement-description').textContent = achievement.description;
    modal.classList.remove('hidden');
    
    // Add unlock animation if newly achieved
    if (achievement.unlocked && !achievement.acknowledged) {
        modal.classList.add('achievement-unlock-animation');
        achievement.acknowledged = true;
        vscode.setState(state);
    }
}

// Eco Tips Management
function updateEcoTips(tips) {
    const tipsList = document.getElementById('eco-tips-list');
    tipsList.innerHTML = tips.map(tip => `
        <div class="eco-tip">
            <p>${tip.tip}</p>
            ${tip.carbon ? `<p class="carbon">Et: ${tip.carbon} g</p>` : ''}
            ${tip.code ? `<button class="copy-code-btn" data-code="${encodeURIComponent(tip.code)}">
                Copy Code
            </button>` : ''}
        </div>
    `).join('');
    
    // Add copy code handlers
    document.querySelectorAll('.copy-code-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const code = decodeURIComponent(btn.dataset.code);
            vscode.postMessage({ command: 'copyCode', code });
        });
    });
}

// Leaderboard Management
function updateLeaderboard(players) {
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = players
        .sort((a, b) => b.xp - a.xp)
        .map((player, index) => `
            <div class="leaderboard-entry ${index === 0 ? 'top-player' : ''}">
                <span class="player-rank">${index + 1}</span>
                <span class="player-name">${player.name}</span>
                <span class="player-xp">${player.xp} XP</span>
            </div>
        `).join('');
}

// Settings Management
function initializeSettings() {
    const ecoTipsToggle = document.getElementById('eco-tips-toggle');
    const groqAIToggle = document.getElementById('groq-ai-toggle');
    const resetXPBtn = document.getElementById('reset-xp');
    
    ecoTipsToggle.checked = state.settings.ecoTipsEnabled;
    groqAIToggle.checked = state.settings.groqAIEnabled;
    
    ecoTipsToggle.addEventListener('change', () => {
        state.settings.ecoTipsEnabled = ecoTipsToggle.checked;
        vscode.postMessage({ 
            command: 'toggleEcoTips', 
            enabled: ecoTipsToggle.checked 
        });
        vscode.setState(state);
    });
    
    groqAIToggle.addEventListener('change', () => {
        state.settings.groqAIEnabled = groqAIToggle.checked;
        vscode.postMessage({ 
            command: 'toggleGroqAI', 
            enabled: groqAIToggle.checked 
        });
        vscode.setState(state);
    });
    
    resetXPBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset your XP and achievements? This cannot be undone.')) {
            vscode.postMessage({ command: 'resetXP' });
        }
    });
}

// UI Update Functions
function updateUI(newState) {
    // Update state
    Object.assign(state, newState);
    
    // Update XP and level with animation
    updateXPDisplay(state.xp, state.level);
    
    // Update XP log if available
    const xpLog = document.querySelector('.xp-log');
    if (xpLog && state.xpLog) {
        const newEntries = state.xpLog
            .map(entry => `<div class="xp-log-entry">${entry}</div>`)
            .join('');
            
        if (xpLog.innerHTML !== newEntries) {
            xpLog.innerHTML = newEntries;
        }
    }
    
    // Update other UI elements
    if (state.achievements) {
        updateAchievements(state.achievements);
    }
    
    if (state.ecoTips) {
        updateEcoTips(state.ecoTips);
    }
    
    if (state.leaderboard) {
        updateLeaderboard(state.leaderboard);
    }
    
    // Update settings
    if (state.settings) {
        const ecoTipsToggle = document.getElementById('eco-tips-toggle');
        const groqAIToggle = document.getElementById('groq-ai-toggle');
        
        if (ecoTipsToggle && ecoTipsToggle.checked !== state.settings.ecoTipsEnabled) {
            ecoTipsToggle.checked = state.settings.ecoTipsEnabled;
        }
        
        if (groqAIToggle && groqAIToggle.checked !== state.settings.groqAIEnabled) {
            groqAIToggle.checked = state.settings.groqAIEnabled;
        }
    }
    
    // Save state
    vscode.setState(state);
}

// Message handler
window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.command) {
        case 'updateState':
            updateUI(message.state);
            break;
            
        case 'updateXP':
            // Handle XP update with animation
            const { xp: newXP, level: newLevel, xpLog } = message.state;
            
            // Update XP with animation
            updateXPDisplay(newXP, newLevel);
            
            // Update XP log if provided
            if (xpLog) {
                const xpLogElement = document.querySelector('.xp-log');
                if (xpLogElement) {
                    xpLogElement.innerHTML = xpLog
                        .map(entry => `<div class="xp-log-entry">${entry}</div>`)
                        .join('');
                }
            }
            
            // Save state
            state = { ...state, xp: newXP, level: newLevel, xpLog };
            vscode.setState(state);
            break;
            
        case 'achievementUnlocked':
            showAchievementDetails(message.achievement);
            updateAchievements(state.achievements);
            break;
            
        case 'newEcoTip':
            state.ecoTips.unshift(message.tip);
            updateEcoTips(state.ecoTips);
            vscode.setState(state);
            break;
            
        case 'updateLeaderboard':
            updateLeaderboard(message.players);
            break;
    }
});

// Tab switching functionality
const tabs = Array.from(document.querySelectorAll('.tab'));
const tabContents = Array.from(document.querySelectorAll('[id^=tab-content-]'));

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetId = `tab-content-${tab.id.split('-')[1]}`;
        
        // Update tab active states
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Hide all content and show target
        tabContents.forEach(content => {
            if (content.id === targetId) {
                content.style.display = 'block';
                content.classList.add('fade-in');
            } else {
                content.style.display = 'none';
                content.classList.remove('fade-in');
            }
        });
        
        // Save current tab in state
        state.currentTab = targetId;
        vscode.setState(state);
    });
});

// Initialize all event listeners
function initializeEventListeners() {
    // Mini game
    const fixBugBtn = document.getElementById('fix-bug-btn');
    if (fixBugBtn) {
        fixBugBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'fixBug' });
            fixBugBtn.disabled = true;
            setTimeout(() => {
                fixBugBtn.disabled = false;
            }, 1000);
        });
    }

    // Settings
    const ecoTipsToggle = document.getElementById('eco-tips-toggle');
    const groqAIToggle = document.getElementById('groq-ai-toggle');
    const resetXPBtn = document.getElementById('reset-xp');

    if (ecoTipsToggle) {
        ecoTipsToggle.addEventListener('change', () => {
            state.settings.ecoTipsEnabled = ecoTipsToggle.checked;
            vscode.postMessage({ 
                command: 'toggleEcoTips', 
                enabled: ecoTipsToggle.checked 
            });
            vscode.setState(state);
        });
    }

    if (groqAIToggle) {
        groqAIToggle.addEventListener('change', () => {
            state.settings.groqAIEnabled = groqAIToggle.checked;
            vscode.postMessage({ 
                command: 'toggleGroqAI', 
                enabled: groqAIToggle.checked 
            });
            vscode.setState(state);
        });
    }

    if (resetXPBtn) {
        resetXPBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset your XP and achievements? This cannot be undone.')) {
                vscode.postMessage({ command: 'resetXP' });
            }
        });
    }

    // Classroom join
    const joinClassBtn = document.getElementById('join-class-btn');
    const classInput = document.getElementById('class-code-input');

    if (joinClassBtn && classInput) {
        joinClassBtn.addEventListener('click', () => {
            const code = classInput.value.trim();
            if (code) {
                vscode.postMessage({ 
                    command: 'joinClassroom', 
                    code 
                });
                classInput.value = '';
            }
        });
    }

    // Modal close handlers
    const closeModalBtn = document.getElementById('close-modal');
    const modal = document.getElementById('achievement-modal');

    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        window.addEventListener('click', event => {
            if (event.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }
}

// Initialize event listeners
initializeEventListeners();