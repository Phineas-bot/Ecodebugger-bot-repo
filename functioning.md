# EcoDebugger Extension: Functioning & Usage Guide

## 1. Building and Running the Extension

1. **Install dependencies** (if not already):

   ```powershell
   npm install
   ```

2. **Build the extension**:

   ```powershell
   npm run compile
   ```

3. **Launch the Extension Development Host**:
   - Press `F5` in VS Code, or run:

     ```powershell
     code --extensionDevelopmentPath=.
     ```

   - This opens a new VS Code window with EcoDebugger loaded for testing.

---

## 2. Using the Extension Features

### A. Side Panel (EcoDebugger)

- Open the **EcoDebugger** icon in the Activity Bar (left sidebar).
- The panel has tabs:
  - **XP/Level**: View your XP, level, and progress bar.
  - **Badges Earned**: See unlocked achievements.
  - **Eco Tips Log**: Review eco tips you've received.
  - **Leaderboard**: See classroom leaderboard and weekly top coder.
  - **Settings**: Enable/disable eco tips, reset XP/achievements.

### B. Earning XP

- **Fix bugs** (if detected by the extension): +10 XP each.
- **Apply eco tips**: +5 XP each.
- Level up every 100 XP.

### C. Eco Tips Engine

- **Supported languages**: Python, JavaScript, TypeScript.
- **How to trigger tips:**
  - **On Save**: Save a supported file to receive a tip.
  - **Manual Scan**: Open Command Palette (`Ctrl+Shift+P`), run `Scan for Eco Tips`.
- Tips are logged in the Eco Tips Log tab.

### D. Achievements

- **Green Coder**: Apply 10 eco tips.
- **Bug Slayer**: Fix 20 bugs.
- **Efficient Thinker**: Reach 500 XP.
- **Team Leader**: Top leaderboard in classroom mode.
- Unlocking an achievement shows a celebration modal and adds a badge in the sidebar.

### E. Classroom Mode

- Join classrooms by code or shared ID (UI for this is stubbed, see code for details).
- Leaderboard tab shows XP ranking.
- Weekly top coder badge is displayed.

### F. Settings

- In the EcoDebugger side panel, go to **Settings** tab:
  - Toggle eco tips on/off (UI only, logic can be extended).
  - Click **Reset XP/achievements** to clear your progress.

---

## 3. Testing

- Run the included test suite:

  ```powershell
  npm test
  ```

- Or use the VS Code Testing UI.

---

## 4. Troubleshooting

- If you encounter issues with npm scripts, ensure your shell allows script execution or use Command Prompt.
- For feature details, see `FEATURES.md`.
