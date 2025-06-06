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
// ClassroomManager for EcoDebugger Classroom Mode
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
    addNotification(message) {
        if (!this.classroom) {
            return;
        }
        this.classroom.notifications = this.classroom.notifications || [];
        this.classroom.notifications.unshift({
            id: Date.now().toString(),
            message,
            timestamp: new Date().toISOString(),
            read: false
        });
        // Keep only last 50 notifications
        this.classroom.notifications = this.classroom.notifications.slice(0, 50);
        // Show notification in VS Code
        vscode.window.showInformationMessage(`🎓 ${message}`);
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
            const { error } = await supabase
                .from('classrooms')
                .insert(this.classroom);
            if (error) {
                throw error;
            }
        }
        else {
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
    async joinClassroom(classroom_id, pin) {
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
    addOrUpdateUser(xp = 0, achievements = []) {
        if (!this.classroom) {
            return;
        }
        let user = this.classroom.users.find(u => u.user_id === this.userId);
        if (!user) {
            user = { user_id: this.userId, username: this.username, xp, achievements, weeklyXP: 0, lastActive: new Date().toISOString() };
            this.classroom.users.push(user);
        }
        else {
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
    checkXPLimit(userId, amount, actionId) {
        const today = new Date().toDateString();
        if (!this.xpLimits[userId] || this.xpLimits[userId].date !== today) {
            this.xpLimits[userId] = { date: today, xp: 0, lastAction: {} };
        }
        // Check daily limit
        if (this.xpLimits[userId].xp + amount > ClassroomManager.MAX_DAILY_XP) {
            vscode.window.showWarningMessage(`Daily XP limit (${ClassroomManager.MAX_DAILY_XP}) reached!`);
            return false;
        }
        // Check duplicate action
        if (actionId) {
            const now = Date.now();
            const lastActionTime = this.xpLimits[userId].lastAction[actionId] || 0;
            if (now - lastActionTime < ClassroomManager.ACTION_COOLDOWN) {
                vscode.window.showWarningMessage('Please wait before repeating the same action.');
                return false;
            }
            this.xpLimits[userId].lastAction[actionId] = now;
        }
        this.xpLimits[userId].xp += amount;
        return true;
    }
    async syncXP(xp, achievements, actionId) {
        if (!this.checkXPLimit(this.userId, xp - (this.getCurrentUser()?.xp || 0), actionId)) {
            return false;
        }
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
        }
        else {
            await this.saveLocal();
        }
        return true;
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
        // Store the report in the classroom data
        if (!this.classroom.reports) {
            this.classroom.reports = [];
        }
        this.classroom.reports.push({
            reporterId: this.userId,
            reportedId: reportedUserId,
            reason,
            timestamp: new Date().toISOString()
        });
        try {
            // Save the report
            if (this.mode === 'cloud' && supabase) {
                await supabase.from('classrooms').update(this.classroom)
                    .eq('classroom_id', this.classroom.classroom_id);
                vscode.window.showInformationMessage('Report submitted successfully');
            }
            else {
                this.saveLocal();
                vscode.window.showInformationMessage('Report submitted successfully');
            }
        }
        catch (error) {
            console.error('Failed to save report:', error);
            vscode.window.showErrorMessage('Failed to submit report');
        }
    }
    // Helper method to calculate weekly metrics
    getWeekStart(date = new Date()) {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    }
    // Update weekly XP when syncing
    updateWeeklyXP(user, xp) {
        const weekStart = this.getWeekStart();
        // Reset weekly XP if it's a new week
        if (new Date(user.lastActive) < weekStart) {
            user.weeklyXP = 0;
        }
        user.weeklyXP += xp - (user.xp || 0); // Only add the difference
        user.lastActive = new Date().toISOString();
    }
}
exports.ClassroomManager = ClassroomManager;
//# sourceMappingURL=classroom.js.map