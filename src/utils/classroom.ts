import * as dotenv from 'dotenv';
dotenv.config();

// ClassroomManager for EcoDebugger Classroom Mode
// ---
// Supabase Cloud Sync Setup:
// 1. Set SUPABASE_URL and SUPABASE_KEY as environment variables (or hardcode for dev only).
// 2. Your Supabase project must have a 'classrooms' table with the appropriate schema.
// 3. The code below will use Supabase for cloud sync if credentials are present, otherwise it will use local file storage.
// 4. Example usage for cloud sync is in the ClassroomManager methods (createClassroom, joinClassroom, syncXP, etc).
// ---

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

// Supabase setup (replace with your project URL and anon key)
const supabaseUrl = "https://dunqjypvdtebnvotvacu.supabase.co";
const postgresql = "//postgres:[Ecodebugger@2025]@db.dunqjypvdtebnvotvacu.supabase.co:5432/postgres";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1bnFqeXB2ZHRlYm52b3R2YWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzODcyOTYsImV4cCI6MjA2NDk2MzI5Nn0.p1SngmNZk0qme8cX_A-c7fqyXKjssNNnp1BMGldnqH4";
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : undefined;

export type ClassroomUser = {
    user_id: string;
    username: string;
    xp: number;
    achievements: string[];
    weeklyXP: number;
    lastActive: string;
};

export type ClassroomReport = {
    reporterId: string;
    reportedId: string;
    reason: string;
    timestamp: string;
};

export type ClassroomNotification = {
    notificationid: string;
    message: string;
    timestamp: string;
    read: boolean;
};

export type ClassroomData = {
    classroom_id: string;
    users: ClassroomUser[];
    last_updated: string;
    pin?: string;
    weeklyTopUser?: string;
    notifications?: ClassroomNotification[];
    reports?: ClassroomReport[];
};

const LOCAL_CLASSROOM_FILE = path.join(
    (vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ''),
    '.ecodebugger_classroom.json'
);

export class ClassroomManager {
    private classroom: ClassroomData | null = null;
    private mode: 'cloud' | 'local';
    private userId: string;
    private username: string;
    private lastSync: number = 0;
    private syncInterval: NodeJS.Timeout | null = null;

    private xpLimits: { [userId: string]: { date: string, xp: number, lastAction: { [key: string]: number } } } = {};
    private static readonly MAX_DAILY_XP = 300;
    private static readonly ACTION_COOLDOWN = 60000; // 1 minute cooldown between same actions

    constructor(userId: string, username: string) {
        this.userId = userId;
        this.username = username;
        // Only use cloud mode if valid Supabase credentials are set
        this.mode = (supabaseUrl && supabaseKey) ? 'cloud' : 'local';
        if (this.mode === 'cloud') {
            this.startSync();
        }
    }

    private startSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        this.syncInterval = setInterval(() => this.syncWithCloud(), 30000); // Sync every 30s
    }

    private async syncWithCloud() {
        if (this.mode !== 'cloud' || !this.classroom || !supabase) {
            return;
        }

        try {
            // Get latest classroom data
            const { data, error } = await supabase
                .from('classrooms')
                .select('*')
                .eq('classroom_id', this.classroom.classroom_id)
                .single();

            if (error) {
                throw error;
            }

            // Update local state if cloud data is newer
            if (new Date(data.last_updated) > new Date(this.classroom.last_updated)) {
                this.classroom = data;
                this.addNotification('Classroom data synced from cloud');
            }
        } catch (err) {
            console.error('Cloud sync failed:', err);
        }
    }

    async createClassroom(pin?: string) {
        const classroom_id = 'CLSRM-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        this.classroom = {
            classroom_id,
            users: [{
                user_id: this.userId,
                username: this.username,
                xp: 0,
                achievements: [],
                weeklyXP: 0,
                lastActive: new Date().toISOString()
            }],
            last_updated: new Date().toISOString(),
            pin,
            notifications: [],
            weeklyTopUser: '',
            reports: []
        };
        if (this.mode === 'cloud' && supabase) {
            await supabase.from('classrooms').insert({
                classroom_id,
                last_updated: this.classroom.last_updated,
                pin,
                weeklyTopUser: ''
            });
            await supabase.from('classroom_users').insert({
                classroom_id: this.classroom!.classroom_id,
                user_id: this.userId,
                username: this.username,
                xp: 0,
                achievements: [],
                weeklyXP: 0,
                lastActive: new Date().toISOString()
            });
        } else {
            await this.saveLocal();
        }
        this.addNotification('Classroom created');
        return this.classroom;
    }

    clearNotifications() {
        if (this.classroom) {
            this.classroom.notifications = [];
            this.saveState();
        }
    }

    markAllNotificationsRead() {
        if (this.classroom) {
            this.classroom.notifications = (this.classroom.notifications ?? []).map(n => ({
                ...n,
                read: true
            }));
            this.saveState();
        }
    }

    markNotificationRead(id: string) {
        if (this.classroom) {
            const notification = (this.classroom.notifications ?? []).find(n => n.notificationid === id);
            if (notification) {
                notification.read = true;
                this.saveState();
            }
        }
    }

    private async saveState() {
        if (this.mode === 'cloud' && supabase && this.classroom) {
            await supabase.from('classrooms')
                .update(this.classroom)
                .eq('classroom_id', this.classroom.classroom_id);
        } else {
            await this.saveLocal();
        }
    }

    async setMode(mode: 'cloud' | 'local') {
        // Only allow cloud mode if credentials are set
        if (mode === 'cloud' && (!supabaseUrl || !supabaseKey)) {
            vscode.window.showWarningMessage('Cloud mode unavailable: SUPABASE_URL and SUPABASE_KEY are not set.');
            this.mode = 'local';
            return;
        }
        this.mode = mode;
        if (mode === 'cloud') {
            this.startSync();
        } else if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
    }

    getWeeklySummary() {
        if (!this.classroom) {
            return null;
        }

        const now = new Date();
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

        const weeklyUsers = this.classroom.users
            .filter(u => new Date(u.lastActive) >= weekStart)
            .sort((a, b) => b.weeklyXP - a.weeklyXP);

        return {
            topUsers: weeklyUsers.slice(0, 3),
            totalXP: weeklyUsers.reduce((sum, u) => sum + u.weeklyXP, 0),
            activeUsers: weeklyUsers.length,
            weekStartDate: weekStart.toISOString()
        };
    }

    async joinClassroom(classroom_id: string, pin?: string) {
        if (this.mode === 'local') {
            if (fs.existsSync(LOCAL_CLASSROOM_FILE)) {
                const data = JSON.parse(fs.readFileSync(LOCAL_CLASSROOM_FILE, 'utf-8'));
                if (data.classroom_id === classroom_id && (!data.pin || data.pin === pin)) {
                    this.classroom = data;
                    this.addOrUpdateUser();
                    await this.saveLocal();
                    return true;
                }
            }
            return false;
        }
        if (this.mode === 'cloud' && supabase) {
            let { data: classroom, error: classErr } = await supabase
                .from('classrooms')
                .select('*')
                .eq('classroom_id', classroom_id)
                .single();
            if (classErr || !classroom) {
                // Classroom does not exist, so create it
                await supabase.from('classrooms').insert({
                    classroom_id,
                    last_updated: new Date().toISOString(),
                    pin,
                    weeklyTopUser: ''
                });
                await supabase.from('classroom_users').insert({
                    classroom_id: this.classroom!.classroom_id,
                    user_id: this.userId,
                    username: this.username,
                    xp: 0,
                    achievements: [],
                    weeklyXP: 0,
                    lastActive: new Date().toISOString()
                });
                // Now fetch the classroom again
                const result = await supabase
                    .from('classrooms')
                    .select('*')
                    .eq('classroom_id', classroom_id)
                    .single();
                classroom = result.data;
                if (!classroom) { return false; }
            }
            if (classroom.pin && classroom.pin !== pin) { return false; }
            const { data: users } = await supabase
                .from('classroom_users')
                .select('*')
                .eq('classroom_id', classroom_id);
            const { data: notifications } = await supabase
                .from('classroom_notifications')
                .select('*')
                .eq('classroom_id', classroom_id)
                .order('timestamp', { ascending: false });
            const { data: reports } = await supabase
                .from('classroom_reports')
                .select('*')
                .eq('classroom_id', classroom_id);
            this.classroom = {
                classroom_id,
                users: users || [],
                last_updated: classroom.last_updated,
                pin: classroom.pin,
                weeklyTopUser: classroom.weeklyTopUser,
                notifications: notifications || [],
                reports: reports || []
            };
            this.addOrUpdateUser();
            return true;
        }
        return false;
    }

    async addOrUpdateUser(xp = 0, achievements: string[] = []) {
        if (!this.classroom) { return; }
        let user = this.classroom.users.find(u => u.user_id === this.userId);
        const now = new Date().toISOString();
        if (!user) {
            user = { user_id: this.userId, username: this.username, xp, achievements, weeklyXP: 0, lastActive: now };
            this.classroom.users.push(user);
            if (this.mode === 'cloud' && supabase) {
                try {
                    await supabase.from('classroom_users').insert({
                        classroom_id: this.classroom.classroom_id,
                        user_id: this.userId,
                        username: this.username,
                        xp: 0,
                        achievements: [],
                        weeklyXP: 0,
                        lastActive: new Date().toISOString()
                    });
                } catch (err) {
                    console.error('Supabase insert user error:', err);
                }
            }
        } else {
            user.xp = xp;
            user.achievements = achievements;
            this.updateWeeklyXP(user, xp);
            user.lastActive = now;
            if (this.mode === 'cloud' && supabase) {
                try {
                    await supabase.from('classroom_users').upsert([
                        {
                            classroom_id: this.classroom.classroom_id,
                            user_id: this.userId,
                            username: this.username,
                            xp: user.xp,
                            achievements: user.achievements, // send as array
                            weeklyXP: user.weeklyXP,
                            lastActive: user.lastActive
                        }
                    ], { onConflict: 'classroom_id,user_id' });
                } catch (err) {
                    console.error('Supabase update user error:', err);
                }
            }
        }
        this.classroom.last_updated = new Date().toISOString();
        // --- Check achievements after leaderboard update ---
        try {
            const { checkAchievements } = require('./achievements');
            // Find current user and check if they are at the top
            const leaderboard = this.getLeaderboard();
            const userIdx = leaderboard.findIndex(u => u.user_id === this.userId);
            const userOnBoard = leaderboard[userIdx];
            const leaderboardTop = userIdx === 0;
            checkAchievements(userOnBoard?.xp || 0, 1, leaderboardTop);
        } catch (e) { /* ignore */ }
    }

    private addNotification(message: string) {
        if (!this.classroom) { return; }
        const notification = {
            notificationid: Date.now().toString(),
            message,
            timestamp: new Date().toISOString(),
            read: false
        };
        this.classroom.notifications = this.classroom.notifications || [];
        this.classroom.notifications.unshift(notification);
        this.classroom.notifications = this.classroom.notifications.slice(0, 50);
        if (this.mode === 'cloud' && supabase) {
            supabase.from('classroom_notifications').insert({
                classroom_id: this.classroom.classroom_id,
                message,
                timestamp: notification.timestamp,
                read: false
            });
        }
        vscode.window.showInformationMessage(`🎓 ${message}`);
    }

    async reportSuspiciousActivity(reportedUserId: string, reason: string): Promise<void> {
        if (!this.classroom) { return; }
        const reportedUser = this.classroom.users.find(u => u.user_id === reportedUserId);
        if (!reportedUser) { return; }
        this.addNotification(`🚨 Suspicious activity reported for ${reportedUser.username}`);
        const report = {
            reporterId: this.userId,
            reportedId: reportedUserId,
            reason,
            timestamp: new Date().toISOString()
        };
        if (!this.classroom.reports) { this.classroom.reports = []; }
        this.classroom.reports.push(report);
        if (this.mode === 'cloud' && supabase) {
            await supabase.from('classroom_reports').insert({
                classroom_id: this.classroom.classroom_id,
                reporterId: this.userId,
                reportedId: reportedUserId,
                reason,
                timestamp: report.timestamp
            });
        } else {
            await this.saveLocal();
        }
        vscode.window.showInformationMessage('Report submitted successfully');
    }

    private async saveLocal() {
        if (!this.classroom) {return;}
        fs.writeFileSync(LOCAL_CLASSROOM_FILE, JSON.stringify(this.classroom, null, 4));
    }

    private updateWeeklyXP(user: ClassroomUser, additionalXP: number) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        if (!this.xpLimits[user.user_id]) {
            this.xpLimits[user.user_id] = { date: today, xp: 0, lastAction: {} };
        }
        const userXP = this.xpLimits[user.user_id];
        if (userXP.date !== today) {
            userXP.date = today;
            userXP.xp = 0;
            userXP.lastAction = {};
        }
        const actions = Object.keys(userXP.lastAction);
        const actionCooldown = ClassroomManager.ACTION_COOLDOWN;
        const nowMillis = now.getTime();
        let canAddXP = true;
        actions.forEach(action => {
            if (nowMillis - userXP.lastAction[action] < actionCooldown) {
                canAddXP = false;
            }
        });
        if (canAddXP) {
            userXP.xp += additionalXP;
            user.weeklyXP += additionalXP;
            userXP.lastAction[new Date().toISOString()] = nowMillis;
            if (userXP.xp > ClassroomManager.MAX_DAILY_XP) {
                userXP.xp = ClassroomManager.MAX_DAILY_XP;
            }
        }
    }

    getLeaderboard() {
        if (!this.classroom) {
            return [];
        }
        // Sort users by XP descending
        const users = [...this.classroom.users].sort((a, b) => b.xp - a.xp);
        return users;
    }

    getClassroomId() {
        return this.classroom?.classroom_id || '';
    }

    async leaveClassroom() {
        if (!this.classroom) { return; }
        if (this.mode === 'local') {
            this.classroom.users = this.classroom.users.filter(u => u.user_id !== this.userId);
            await this.saveLocal();
        } else if (this.mode === 'cloud' && this.classroom && typeof supabase !== 'undefined') {
            // Optionally, remove user from classroom_users in Supabase
            await supabase.from('classroom_users')
                .delete()
                .eq('classroom_id', this.classroom.classroom_id)
                .eq('user_id', this.userId);
        }
        this.classroom = null;
    }
}
