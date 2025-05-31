# EcoDebugger Feature Specifications

## Overview

EcoDebugger is a VS Code extension that gamifies debugging and promotes eco-conscious coding.

---

## 🎮 XP System

- Users earn XP when:
  - They fix bugs detected by the extension.
  - They apply eco tips suggested by the extension.
- XP values:
  - Fix a bug → +10 XP
  - Apply an eco tip → +5 XP
- Level up every 100 XP.
- Display XP bar in the extension side panel.

---

## 🌱 Eco Tips Engine

- Languages supported: Python, JavaScript, TypeScript.
- Example tips:
  - Use `map()` instead of `for` loop when possible.
  - Avoid unnecessary `print()`/`console.log()` in production.
  - Use list/set comprehensions in Python for better efficiency.
- Tip trigger points:
  - On save
  - Manual scan (command palette)

---

## 🏆 Achievements

- **Green Coder**: Apply 10 eco tips.
- **Bug Slayer**: Fix 20 bugs.
- **Efficient Thinker**: Reach 500 XP.
- **Team Leader**: Top leaderboard in classroom mode.

Each unlock shows a celebration modal and badge in the sidebar.

---

## 👩‍🏫 Classroom Mode

- Leaderboard of XP earned by users.
- Classrooms joined by code or shared ID.
- Syncs to cloud or local server (depending on implementation).
- Weekly top coder badge.

---

## ⚙️ Extension Side Panel

- Tabs:
  - XP/Level
  - Badges Earned
  - Eco Tips Log
  - Leaderboard
- Settings:
  - Enable/disable eco tips
  - Reset XP/achievements
