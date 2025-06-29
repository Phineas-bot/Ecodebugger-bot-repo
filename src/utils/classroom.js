"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassroomManager = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// ClassroomManager for EcoDebugger Classroom Mode
// ---
// Supabase Cloud Sync Setup:
// 1. Set SUPABASE_URL and SUPABASE_KEY as environment variables (or hardcode for dev only).
// 2. Your Supabase project must have a 'classrooms' table with the appropriate schema.
// 3. The code below will use Supabase for cloud sync if credentials are present, otherwise it will use local file storage.
// 4. Example usage for cloud sync is in the ClassroomManager methods (createClassroom, joinClassroom, syncXP, etc).
// ---
const supabase_js_1 = require("@supabase/supabase-js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
// Supabase setup (replace with your project URL and anon key)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey) : undefined;
const LOCAL_CLASSROOM_FILE = path.join((vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ''), '.ecodebugger_classroom.json');
class ClassroomManager {
    classroom = null;
    mode;
    userId;
    username;
    lastSync = 0;
    syncInterval = null;
    xpLimits = {};
    static MAX_DAILY_XP = 300;
    static ACTION_COOLDOWN = 60000; // 1 minute cooldown between same actions
    constructor(userId, username) {
        this.userId = userId;
        this.username = username;
        // Only use cloud mode if valid Supabase credentials are set
        this.mode = (supabaseUrl && supabaseKey) ? 'cloud' : 'local';
        if (this.mode === 'cloud') {
            this.startSync();
        }
    }
    startSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        this.syncInterval = setInterval(() => this.syncWithCloud(), 30000); // Sync every 30s
    }
    async syncWithCloud() {
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
        }
        catch (err) {
            console.error('Cloud sync failed:', err);
        }
    }
    async createClassroom(pin) {
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
            await supabase.from('classrooms').insert({
                classroom_id,
                last_updated: this.classroom.last_updated,
                pin,
                weeklyTopUser: null
            });
            await supabase.from('classroom_users').insert({
                classroom_id,
                user_id: this.userId,
                username: this.username,
                xp: 0,
                achievements: [],
                weeklyXP: 0,
                lastActive: new Date().toISOString()
            });
        }
        else {
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
            this.classroom.notifications = this.classroom.notifications.map(n => ({
                ...n,
                read: true
            }));
            this.saveState();
        }
    }
    markNotificationRead(id) {
        if (this.classroom) {
            const notification = this.classroom.notifications.find(n => n.id === id);
            if (notification) {
                notification.read = true;
                this.saveState();
            }
        }
    }
    async saveState() {
        if (this.mode === 'cloud' && supabase && this.classroom) {
            await supabase.from('classrooms')
                .update(this.classroom)
                .eq('classroom_id', this.classroom.classroom_id);
        }
        else {
            await this.saveLocal();
        }
    }
    async setMode(mode) {
        // Only allow cloud mode if credentials are set
        if (mode === 'cloud' && (!supabaseUrl || !supabaseKey)) {
            vscode.window.showWarningMessage('Cloud mode unavailable: SUPABASE_URL and SUPABASE_KEY are not set.');
            this.mode = 'local';
            return;
        }
        this.mode = mode;
        if (mode === 'cloud') {
            this.startSync();
        }
        else if (this.syncInterval) {
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
    async joinClassroom(classroom_id, pin) {
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
            const { data: classroom, error: classErr } = await supabase
                .from('classrooms')
                .select('*')
                .eq('classroom_id', classroom_id)
                .single();
            if (classErr || !classroom) {
                return false;
            }
            if (classroom.pin && classroom.pin !== pin) {
                return false;
            }
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
    addOrUpdateUser(xp = 0, achievements = []) {
        if (!this.classroom) {
            return;
        }
        let user = this.classroom.users.find(u => u.user_id === this.userId);
        if (!user) {
            user = { user_id: this.userId, username: this.username, xp, achievements, weeklyXP: 0, lastActive: new Date().toISOString() };
            this.classroom.users.push(user);
            if (this.mode === 'cloud' && supabase) {
                supabase.from('classroom_users').insert({
                    classroom_id: this.classroom.classroom_id,
                    user_id: this.userId,
                    username: this.username,
                    xp,
                    achievements,
                    weeklyXP: 0,
                    lastActive: user.lastActive
                });
            }
        }
        else {
            user.xp = xp;
            user.achievements = achievements;
            this.updateWeeklyXP(user, xp);
            if (this.mode === 'cloud' && supabase) {
                supabase.from('classroom_users').update({
                    xp,
                    achievements,
                    weeklyXP: user.weeklyXP,
                    lastActive: user.lastActive
                }).eq('classroom_id', this.classroom.classroom_id).eq('user_id', this.userId);
            }
        }
        this.classroom.last_updated = new Date().toISOString();
        // --- Check achievements after leaderboard update ---
        try {
            const { checkAchievements } = require('./achievements');
            // Find current user and check if they are at the top
            const leaderboard = this.getLeaderboard();
            const userIdx = leaderboard.findIndex(u => u.user_id === this.userId);
            const user = leaderboard[userIdx];
            const leaderboardTop = userIdx === 0;
            checkAchievements(user?.xp || 0, 1, leaderboardTop);
        }
        catch (e) { /* ignore */ }
    }
    addNotification(message) {
        if (!this.classroom) {
            return;
        }
        const notification = {
            id: Date.now().toString(),
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
    async reportSuspiciousActivity(reportedUserId, reason) {
        if (!this.classroom) {
            return;
        }
        const reportedUser = this.classroom.users.find(u => u.user_id === reportedUserId);
        if (!reportedUser) {
            return;
        }
        this.addNotification(`🚨 Suspicious activity reported for ${reportedUser.username}`);
        const report = {
            reporterId: this.userId,
            reportedId: reportedUserId,
            reason,
            timestamp: new Date().toISOString()
        };
        if (!this.classroom.reports) {
            this.classroom.reports = [];
        }
        this.classroom.reports.push(report);
        if (this.mode === 'cloud' && supabase) {
            await supabase.from('classroom_reports').insert({
                classroom_id: this.classroom.classroom_id,
                reporterId: this.userId,
                reportedId: reportedUserId,
                reason,
                timestamp: report.timestamp
            });
        }
        else {
            await this.saveLocal();
        }
        vscode.window.showInformationMessage('Report submitted successfully');
    }
    async saveLocal() {
        if (!this.classroom) {
            return;
        }
        fs.writeFileSync(LOCAL_CLASSROOM_FILE, JSON.stringify(this.classroom, null, 4));
    }
    updateWeeklyXP(user, additionalXP) {
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
        if (!this.classroom) {
            return;
        }
        if (this.mode === 'local') {
            this.classroom.users = this.classroom.users.filter(u => u.user_id !== this.userId);
            await this.saveLocal();
        }
        else if (this.mode === 'cloud' && this.classroom && typeof supabase !== 'undefined') {
            // Optionally, remove user from classroom_users in Supabase
            await supabase.from('classroom_users')
                .delete()
                .eq('classroom_id', this.classroom.classroom_id)
                .eq('user_id', this.userId);
        }
        this.classroom = null;
    }
}
exports.ClassroomManager = ClassroomManager;
//# sourceMappingURL=classroom.js.map