# Ecodebugger Extension Documentation

## Architecture Diagram

```
+-------------------+
|   VS Code Editor  |
+-------------------+
          |
          v
+-------------------+
|  Ecodebugger Core |
|  (extension.ts)   |
+-------------------+
 |   |   |   |   |   |
 v   v   v   v   v   v
[EcoTips][Bugs][XP][Achievements][Classroom][AI]
   |      |      |      |         |         |
   v      v      v      v         v         v
[Sidebar UI (TreeView) & Status Bar]
```

---

## Overview

Ecodebugger is a gamified Visual Studio Code extension that encourages eco-friendly coding practices. It provides real-time eco tips, bug detection, XP/leveling, achievements, and a collaborative classroom mode. The extension uses static analysis and AI (Groq API) to suggest improvements and tracks your progress with a rich sidebar UI.

---

## How the Extension Works

- **Eco Tips**: Analyzes your code for energy-inefficient patterns and suggests eco-friendly alternatives.
- **Bug Detection**: Detects common bugs (e.g., nested loops, unused variables) and notifies you.
- **XP & Leveling**: Earn XP for fixing bugs and applying eco tips. Level up as you progress.
- **Achievements**: Unlock badges for milestones (e.g., fixing bugs, applying tips, XP goals).
- **Classroom Mode**: Join or create classrooms to compete and collaborate with others. Syncs via Supabase cloud or local storage.
- **AI Integration**: Uses Groq API for advanced code analysis and eco suggestions.
- **Sidebar UI**: All progress, tips, bugs, and leaderboards are shown in a custom sidebar (TreeView).

---

## Main Files and Their Roles

- `src/extension.ts`: Main entry point. Handles activation, command registration, state management, XP/level logic, bug/tip detection, and integration with the sidebar and status bar.
- `src/feature/sidePanel.ts`: Implements the TreeView sidebar UI, showing XP, achievements, eco tips, bug reports, leaderboard, and settings. Handles context menu commands and UI refresh.
- `src/utils/ecoTips.ts`: Provides static eco tip analysis for JavaScript/TypeScript/Python files.
- `src/utils/greenCode.ts`: Analyzes JavaScript/TypeScript code for eco issues (nested loops, inefficient string concat, etc.).
- `src/utils/greenCodePython.ts`: (Not shown above) Similar to greenCode.ts but for Python.
- `src/utils/bugs.ts`: Detects bugs like nested loops and unused variables.
- `src/utils/achievements.ts`: Defines and tracks achievements, unlocks badges, and persists state.
- `src/utils/xp.ts`: XP calculation logic for leveling up.
- `src/utils/classroom.ts`: Manages classroom mode, user sync, cloud/local storage, and notifications.
- `src/utils/groqApi.ts`: Handles AI-powered eco tip analysis via Groq API, batching, and rate limiting.
- `src/utils/statusBar.ts`: Updates the VS Code status bar with XP/level info.

---

## Functionalities & Implementation


### 1. Eco Tips & Bug Detection

- On file save, the extension analyzes your code for eco issues and bugs.
- Static analysis is performed by `ecoTips.ts`, `greenCode.ts`, and `bugs.ts`.
- AI-powered analysis (if enabled) uses `groqApi.ts` to get deeper suggestions.
- Tips and bugs are shown as notifications and in the sidebar.

### 2. XP, Leveling, and Achievements

- Fixing bugs or applying eco tips awards XP (`awardXP` in `extension.ts`).
- Level up when XP threshold is reached (`xpForNextLevel` in `xp.ts`).
- Achievements are unlocked for milestones (see `achievements.ts`).
- All progress is shown in the sidebar and status bar.

### 3. Sidebar (TreeView)

- Implemented in `sidePanel.ts` as a custom TreeView.
- Shows XP/level, badges, eco tips, bug reports, leaderboard, and settings.
- Context menu commands: copy bug, mark bug fixed, show badge info, insert eco tip code, toggle eco tips/AI, reset XP.

### 4. Classroom Mode

- Managed by `classroom.ts`.
- Users can create/join/leave classrooms, tracked by a unique code.
- XP and achievements are synced across users (cloud via Supabase or local file).
- Leaderboard and classroom details are shown in the sidebar.

### 5. AI Integration (Groq API)

- `groqApi.ts` batches and sends code to the Groq API for advanced eco analysis.
- Results are shown as eco tips in the sidebar.
- Rate limiting and batching are handled internally.

---

## Example Workflow

### Workflow Diagram

```
[Edit Code] -> [Save File] -> [Eco Tips & Bug Detection]
                                 |
                                 v
                        [Show Notifications]
                                 |
                                 v
                        [Award XP & Achievements]
                                 |
                                 v
                        [Update Sidebar UI]
                                 |
                                 v
                        [Classroom Sync (optional)]
                                 |
                                 v
                        [AI Analysis (optional)]
```

1. Install and activate the extension.
2. Start coding in JavaScript, TypeScript, or Python.
3. On save, receive eco tips and bug notifications.
4. Fix issues to earn XP and unlock achievements.
5. View your progress and tips in the sidebar.
6. Join or create a classroom to compete with others.
7. Enable AI analysis for deeper suggestions.

---

## File Map (Key Files)

- `src/extension.ts` — Main logic, activation, commands, XP, bug/tip detection
- `src/feature/sidePanel.ts` — Sidebar UI (TreeView)
- `src/utils/ecoTips.ts` — Static eco tip analysis
- `src/utils/greenCode.ts` — JS/TS eco code analysis
- `src/utils/greenCodePython.ts` — Python eco code analysis
- `src/utils/bugs.ts` — Bug detection
- `src/utils/achievements.ts` — Achievements logic
- `src/utils/xp.ts` — XP/level logic
- `src/utils/classroom.ts` — Classroom mode logic
- `src/utils/groqApi.ts` — AI eco tip integration
- `src/utils/statusBar.ts` — Status bar updates

---

## Code Samples for Key Features

#### Eco Tip Analysis (ecoTips.ts)
```typescript
export async function provideEcoTips(): Promise<{ ecoTips: string[] }> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return { ecoTips: [] };
    const text = editor.document.getText();
    if (editor.document.languageId === 'python') {
        return await analyzePythonGreenCode(text, true);
    } else {
        return analyzeGreenCode(text, true) as { ecoTips: string[] };
    }
}
```

#### Bug Detection (bugs.ts)
```typescript
export function detectNestedLoops(text: string): boolean {
    const nestedLoopPattern = /for\s*\(.*\)\s*{[^{}]*for\s*\(.*\)/;
    return nestedLoopPattern.test(text);
}
```

#### XP & Leveling (xp.ts)
```typescript
export function xpForNextLevel(level: number): number {
    return level * 100;
}
```

#### Classroom Join/Create (classroom.ts)
```typescript
async createClassroom(pin?: string) {
    const classroom_id = 'CLSRM-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    // ...create classroom logic...
    return this.classroom;
}

async joinClassroom(classroom_id: string, pin?: string) {
    // ...join classroom logic...
    return true;
}
```

#### AI Integration (groqApi.ts)
```typescript
async function realGroqApiCall(codes: string[]): Promise<any[]> {
    // ...
    const results = await Promise.all(
        codes.map(async (code) => {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: GROQ_MODEL,
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: code }
                    ]
                })
            });
            return response.json();
        })
    );
    return results;
}
```

---

## For Developers

- All extension logic is TypeScript-based and modular.
- Add new eco tips or bug detectors in `ecoTips.ts`, `greenCode.ts`, or `bugs.ts`.
- Extend achievements in `achievements.ts`.
- UI/UX is handled in `sidePanel.ts` (TreeView) and status bar.
- Classroom mode can be extended for more collaboration features.
- AI integration can be swapped or extended in `groqApi.ts`.

---

## License

MIT
