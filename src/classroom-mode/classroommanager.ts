import { db, collection, doc, setDoc, onSnapshot, query, orderBy, limit } from './firebaseConfig';
import * as vscode from 'vscode';
import { XpEngine } from './xpengine';

interface Student {
    id: string;
    name: string;
    xp: number;
    level: number;
    avatar: string;
    lastActive: Date;
}

interface Classroom {
    id: string;
    name: string;
    hostId: string;
    joinCode: string;
    createdAt: Date;
}

export class ClassroomManager {
    private _xpEngine: XpEngine;
    private _currentClassroom: Classroom | null = null;
    private _students: Student[] = [];
    private _userId: string;
    private _userName: string;
    private _isTeacher: boolean;

    constructor(xpEngine: XpEngine, context: vscode.ExtensionContext) {
        this._xpEngine = xpEngine;
        this._userId = context.globalState.get('ecoDebugger.userId') || this._generateUserId();
        this._userName = context.globalState.get('ecoDebugger.userName') || 'Anonymous';
        this._isTeacher = false;

        context.globalState.update('ecoDebugger.userId', this._userId);
    }

    private _generateUserId(): string {
        return 'user-' + Math.random().toString(36).substr(2, 9);
    }

    public async createClassroom(className: string): Promise<void> {
        try {
            this._isTeacher = true;
            const joinCode = this._generateJoinCode();
            const classroomRef = doc(collection(db, 'classrooms'));
            
            const newClassroom: Classroom = {
                id: classroomRef.id,
                name: className,
                hostId: this._userId,
                joinCode: joinCode,
                createdAt: new Date()
            };

            await setDoc(classroomRef, newClassroom);
            this._currentClassroom = newClassroom;

            vscode.window.showInformationMessage(
                'Classroom "${className}" created! Join code: ${joinCode}',
                { modal: true }
            );
        } catch (error) {
            vscode.window.showErrorMessage('Failed to create classroom: ${error}');
        }
    }

    public async joinClassroom(joinCode: string): Promise<void> {
        try {
            // In a real app, you would query Firestore for the classroom with this join code
            // For this example, we'll simulate finding a classroom
            this._isTeacher = false;
            
            // Simulate finding classroom (replace with actual Firestore query)
            const classroomRef = doc(db, 'classrooms', 'SIMULATED_CLASSROOM_ID');
            this._currentClassroom = {
                id: 'SIMULATED_CLASSROOM_ID',
                name: 'Sample Classroom',
                hostId: 'teacher-123',
                joinCode: joinCode,
                createdAt: new Date()
            };

            // Add student to classroom
            await this._updateStudentData();

            vscode.window.showInformationMessage(
                'Joined classroom: ${this._currentClassroom.name}',
                { modal: true }
            );

            // Start listening for leaderboard updates
            this._setupLeaderboardListener();
        } catch (error) {
            vscode.window.showErrorMessage('Failed to join classroom: ${error}');
        }
    }

    private async _updateStudentData(): Promise<void> {
        if (!this._currentClassroom) return;

        const studentRef = doc(db, 'classrooms', this._currentClassroom.id, 'students', this._userId);
        
        await setDoc(studentRef, {
            id: this._userId,
            name: this._userName,
            xp: this._xpEngine.currentXp,
            level: this._xpEngine.currentLevel,
            avatar: this._getRandomAvatar(),
            lastActive: new Date()
        });
    }

    private _setupLeaderboardListener(): void {
        if (!this._currentClassroom) return;

        const studentsRef = collection(db, 'classrooms', this._currentClassroom.id, 'students');
        const leaderboardQuery = query(studentsRef, orderBy('xp', 'desc'), limit(10));

        onSnapshot(leaderboardQuery, (snapshot: { docs: any[]; }) => {
            this._students = snapshot.docs.map((doc: { data: () => Student; }) => doc.data() as Student);
            
            // Update webview if it's open
            vscode.commands.executeCommand('eco-debugger.updateLeaderboard', this._students);
        });
    }

    private _generateJoinCode(): string {
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    private _getRandomAvatar(): string {
        const avatars = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];
        return avatars[Math.floor(Math.random() * avatars.length)];
    }

    public get leaderboard(): Student[] {
        return this._students;
    }

    public get currentClassroom(): Classroom | null {
        return this._currentClassroom;
    }

    public get isInClassroom(): boolean {
        return this._currentClassroom !== null;
    }

    public get isTeacher(): boolean {
        return this._isTeacher;
    }

    public async updateXp(): Promise<void> {
        if (this.isInClassroom) {
            await this._updateStudentData();
        }
    }

    public async setUserName(name: string): Promise<void> {
        this._userName = name;
        if (this.isInClassroom) {
            await this._updateStudentData();
        }
    }
}