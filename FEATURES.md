# EcoDebugger Feature Specifications

## Overview

EcoDebugger is a VS Code extension that gamifies debugging and promotes eco-conscious coding. It includes a local static analyzer, an AI-based bug and eco tip engine powered by Groq (with shared API key support), a reward system with XP and achievements, and a classroom leaderboard.

---

## 🎮 XP System

- Users earn XP when:
  - They fix bugs detected by the extension.
  - They apply eco tips suggested by the extension.
- XP values:
  - Fix a bug → +10 XP
  - Apply an eco tip → +5 XP
- Level up every 100 XP.
- XP bar shown in the side panel.

---

## 🐞 Bug Detection Engine

### Static Analysis (Local)

- Uses linters and AST parsing for Python, JavaScript, and TypeScript.
- Detects:
  - Unused variables/imports
  - Unreachable code
  - Infinite loops
  - Syntax errors
  - Common anti-patterns

### AI-Powered Bug Detection (Groq)

- Sends code snippets to Groq LLM (e.g., LLaMA 3.1) via shared API key.
- Returns:
  - List of bugs
  - Explanation
  - Fix suggestions
- Trigger points:
  - On Save
  - Manual Scan via Command Palette

---

## 🌱 Eco Tips Engine

### Local Rules

- Languages: Python, JavaScript, TypeScript.
- Sample Tips:
  - Use `map()` over manual loops.
  - Use list comprehensions instead of for-loops in Python.
  - Avoid `console.log`/`print()` in production.

### AI-Based Eco Analysis (Groq)

- Sends code to Groq to suggest eco-friendly improvements.
- Merged into the same API request as bug analysis.
- Trigger points:
  - On Save
  - Manual Scan

---

## 🏆 Achievements

- **Green Coder**: Apply 10 eco tips.
- **Bug Slayer**: Fix 20 bugs.
- **Efficient Thinker**: Reach 500 XP.
- **Team Leader**: Top of classroom leaderboard.

Each unlock triggers a modal celebration and badge display in the sidebar.

---

## 👩‍🏫 Classroom Mode

- XP leaderboard per classroom.
- Users join via class code or shared link.
- Optional cloud sync or local persistence.
- Weekly top coder badge.

---

## 🔐 API Key Handling

- A **shared API key** is embedded for Groq usage.
- Groq API is used for:
  - Smart bug detection
  - AI-generated eco tips
- Requests are batched to minimize usage.
- Rate limiting and basic abuse prevention handled in extension logic.

---

## ⚙️ Extension Side Panel

- Tabs:
  - XP/Level
  - Badges Earned
  - Eco Tips Log
  - Bug Reports
  - Leaderboard
- Settings:
  - Enable/disable eco tips
  - Enable/disable Groq AI usage
  - Reset XP and achievements

---

## Future Roadmap

- Implement real-time code hinting with inline annotations.
- Web dashboard sync for classroom stats.

---
