// Classroom Mode: leaderboard, join, sync, weekly badge (stub implementation)
import * as vscode from 'vscode';

export type Classroom = {
    id: string;
    name: string;
    members: string[];
    leaderboard: { user: string; xp: number }[];
    weeklyTop: string;
};

export class ClassroomManager {
    private static CLASSROOMS_KEY = 'ecodebugger.classrooms';
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    getClassrooms(): Classroom[] {
        return this.context.globalState.get<Classroom[]>(ClassroomManager.CLASSROOMS_KEY, []);
    }

    joinClassroom(id: string, name: string, user: string) {
        let classrooms = this.getClassrooms();
        let classroom = classrooms.find(c => c.id === id);
        if (!classroom) {
            classroom = { id, name, members: [], leaderboard: [], weeklyTop: '' };
            classrooms.push(classroom);
        }
        if (!classroom.members.includes(user)) {
            classroom.members.push(user);
        }
        this.context.globalState.update(ClassroomManager.CLASSROOMS_KEY, classrooms);
    }

    updateLeaderboard(id: string, user: string, xp: number) {
        let classrooms = this.getClassrooms();
        let classroom = classrooms.find(c => c.id === id);
        if (classroom) {
            let entry = classroom.leaderboard.find(l => l.user === user);
            if (entry) {
                entry.xp = xp;
            } else {
                classroom.leaderboard.push({ user, xp });
            }
            classroom.leaderboard.sort((a, b) => b.xp - a.xp);
            classroom.weeklyTop = classroom.leaderboard[0]?.user || '';
            this.context.globalState.update(ClassroomManager.CLASSROOMS_KEY, classrooms);
        }
    }

    getLeaderboard(id: string) {
        let classrooms = this.getClassrooms();
        let classroom = classrooms.find(c => c.id === id);
        return classroom ? classroom.leaderboard : [];
    }

    getWeeklyTop(id: string) {
        let classrooms = this.getClassrooms();
        let classroom = classrooms.find(c => c.id === id);
        return classroom ? classroom.weeklyTop : '';
    }
}
