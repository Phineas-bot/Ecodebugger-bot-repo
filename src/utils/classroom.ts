// ClassroomManager for EcoDebugger Classroom Mode
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

// Supabase setup (replace with your project URL and anon key)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : undefined;

export type ClassroomUser = {
    user_id: string;
    username: string;
    xp: number;
    achievements: string[];
    weeklyXP: number;
    lastActive: string;
};

export type ClassroomData = {
    classroom_id: string;
    users: ClassroomUser[];
    last_updated: string;
    pin?: string;
    weeklyTopUser?: string;
    notifications: Array<{
        message: string;
        timestamp: string;
    }>;
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

    private addNotification(message: string) {
        if (!this.classroom) {
            return;
        }
        
        this.classroom.notifications = this.classroom.notifications || [];
        this.classroom.notifications.unshift({
            message,
            timestamp: new Date().toISOString()
        });

        // Keep only last 50 notifications
        this.classroom.notifications = this.classroom.notifications.slice(0, 50);

        // Show notification in VS Code
        vscode.window.showInformationMessage(`🎓 ${message}`);
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
            notifications: []
        };

        if (this.mode === 'cloud' && supabase) {
            const { error } = await supabase
                .from('classrooms')
                .insert(this.classroom);
            if (error) {
                throw error;
            }
        } else {
            await this.saveLocal();
        }

        this.addNotification('Classroom created');
        return this.classroom;
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
        // For local mode, load from file if exists
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
        
        // Cloud mode
        if (this.mode === 'cloud' && supabase) {
            const { data, error } = await supabase
                .from('classrooms')
                .select('*')
                .eq('classroom_id', classroom_id)
                .single();
            
            if (error) {
                return false;
            }

            if (data.pin && data.pin !== pin) {
                return false;
            }

            this.classroom = data;
            this.addOrUpdateUser();
            await this.syncXP(0, []);
            return true;
        }

        return false;
    }

    async leaveClassroom() {
        if (!this.classroom) {
            return;
        }
        this.classroom.users = this.classroom.users.filter(u => u.user_id !== this.userId);
        await this.saveLocal();
        this.classroom = null;
    }

    addOrUpdateUser(xp = 0, achievements: string[] = []) {
        if (!this.classroom) {
            return;
        }
        let user = this.classroom.users.find(u => u.user_id === this.userId);
        if (!user) {
            user = { user_id: this.userId, username: this.username, xp, achievements, weeklyXP: 0, lastActive: new Date().toISOString() };
            this.classroom.users.push(user);
        } else {
            user.xp = xp;
            user.achievements = achievements;
            this.updateWeeklyXP(user, xp);
        }
        this.classroom.last_updated = new Date().toISOString();
    }

    getLeaderboard() {
        if (!this.classroom) {
            return [];
        }
        const users = [...this.classroom.users].sort((a, b) => b.xp - a.xp);
        
        // Add medal emoji for top 3
        if (users.length > 0) {
            users[0].username = `🥇 ${users[0].username}`;
        }
        if (users.length > 1) {
            users[1].username = `🥈 ${users[1].username}`;
        }
        if (users.length > 2) {
            users[2].username = `🥉 ${users[2].username}`;
        }

        return users;
    }

    getClassroomId() {
        return this.classroom?.classroom_id || '';
    }

    getCurrentUser() {
        return this.classroom?.users.find(u => u.user_id === this.userId);
    }

    async saveLocal() {
        if (!this.classroom) {
            return;
        }
        fs.writeFileSync(LOCAL_CLASSROOM_FILE, JSON.stringify(this.classroom, null, 2));
    }

    async syncXP(xp: number, achievements: string[]) {
        const prevXP = this.getCurrentUser()?.xp || 0;
        this.addOrUpdateUser(xp, achievements);

        // Check if user became top scorer
        const leaderboard = this.getLeaderboard();
        if (leaderboard[0]?.user_id === this.userId && xp > prevXP) {
            this.addNotification(`${this.username} took the lead with ${xp} XP! 🎉`);
        }

        if (this.mode === 'cloud' && supabase) {
            const { error } = await supabase
                .from('classrooms')
                .update(this.classroom)
                .eq('classroom_id', this.classroom?.classroom_id);
            if (error) {
                throw error;
            }
        } else {
            await this.saveLocal();
        }
        return true;
    }

    // Helper method to calculate weekly metrics
    private getWeekStart(date: Date = new Date()): Date {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    }

    // Update weekly XP when syncing
    private updateWeeklyXP(user: ClassroomUser, xp: number) {
        const weekStart = this.getWeekStart();
        // Reset weekly XP if it's a new week
        if (new Date(user.lastActive) < weekStart) {
            user.weeklyXP = 0;
        }
        user.weeklyXP += xp - (user.xp || 0); // Only add the difference
        user.lastActive = new Date().toISOString();
    }
}
