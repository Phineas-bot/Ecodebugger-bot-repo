# 🧑‍🏫 EcoDebugger – Classroom Mode Guide

Classroom Mode allows users to collaborate and compete on eco-conscious coding and debugging. It introduces a shared leaderboard, classroom XP tracking, and motivational badges for coding in a group setting (e.g., a class or team).

---

## 📌 Overview

Classroom Mode is designed to make EcoDebugger more engaging and collaborative by allowing users to:

- Join a shared **classroom**
- Earn XP for fixing bugs and applying eco tips
- Compete on a **leaderboard**
- Unlock **team-based achievements**

---

## 🎯 Use Cases

- Programming classrooms (teachers and students)
- Coding bootcamps and hackathons
- Developer teams practicing sustainable coding

---

## 🔐 1. Classroom Access

### 🧑‍🏫 Create a Classroom
- Generates a unique **Classroom ID** (e.g., `CLSRM-AX91ZB`)
- Optionally requires a **PIN** for joining
- Stores classroom data in cloud or shared local file

### 🙋‍♂️ Join a Classroom
- Enter the Classroom ID and optional PIN
- Your XP now contributes to that classroom's leaderboard

### 🚪 Leave a Classroom
- You can leave anytime
- Your local XP is retained
- Your classroom progress is paused

---

## 🔁 2. XP Synchronization

| Action        | When it Happens        | Destination             |
|---------------|------------------------|-------------------------|
| Fix a bug     | On save or manual scan | Classroom XP updated    |
| Apply eco tip | On save or manual scan | XP + tips saved         |
| Manual sync   | On button click        | Force update to backend |

> **Tip**: EcoDebugger queues and batches syncs to reduce API calls.

---

## 📊 3. Leaderboard View

Shows top contributors in the classroom.

| Rank | User    | XP  | Badges              |
|------|-------- |-----|---------------------|
| 🥇 1 | @Alice | 180 | Green Coder 🟢      |
| 🥈 2 | @Bob   | 155 | Bug Slayer 🐞       |
| 🥉 3 | @Claire| 140 | Efficient Thinker ⚡|

### 🎖 Badges Awarded
- **Top Coder of the Week**
- **Fastest Fixer**
- **Most Eco Tips Applied**

> Badges appear next to usernames and in the "Badges Earned" panel.

---

## ⚙️ 4. Side Panel Tabs

Classroom Mode adds or enhances these tabs in the EcoDebugger sidebar:

- **Leaderboard**: Displays ranks, XP, and badges
- **Classroom Settings**:
  - Join or leave a classroom
  - View your Classroom ID
  - Toggle notifications
- **Weekly Report**: (Planned)
  - View your weekly performance summary

---

## 🧩 5. Data Storage Options

### 🔌 Cloud Mode (Recommended)
- Uses Supabase 
- Enables real-time syncing and global access
- Suitable for schools and remote teams

### 📁 Local Mode (Offline)
- XP and leaderboard data saved in a `.json` file
- Suitable for isolated environments or local teams

---

## 🔐 6. Security and Abuse Prevention

- XP rate-limited (e.g., max 300 XP/day)
- Duplicate submissions filtered
- Option to report suspicious activity

---

## 📦 Sample Classroom JSON Schema

```json
{
  "classroom_id": "CLSRM-AX91ZB",
  "users": [
    {
      "user_id": "user123",
      "username": "JaneDoe",
      "xp": 120,
      "achievements": ["Green Coder", "Bug Slayer"]
    },
    ...
  ],
  "last_updated": "2025-06-05T15:32:00Z"
}
