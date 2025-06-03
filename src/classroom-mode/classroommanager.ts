import {
    db,
    collection,
    doc,
    setDoc,
    getDocs,
    onSnapshot,
    query,
    where,
    orderBy,
    limit
} from './firebaseConfig';

import * as vscode from 'vscode';
import { xpForNextLevel } from './xp';

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
    private _xpEngine: typeof xpForNextLevel;
    private _currentClassroom: Classroom | null = null;
    private _students: Student[] = [];
    private _userId: string;
    private _userName: string;
    private _isTeacher: boolean;

    constructor(xpEngine:typeof xpForNextLevel, context: vscode.ExtensionContext) {
        this._xpEngine = xpEngine;
        this._userId = context.globalState.get('ecoDebugger.userId') || this._generateUserId();
        const savedName = context.globalState.get('ecoDebugger.userName');
        const name = savedName as string;
this._userName = name && name.trim() !== '' ? name : 'Anonymous';
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
                `Classroom "${className}" created! Join code: ${joinCode}`,
                { modal: true }
            );
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to create classroom: ${error.message}`);
        }
    }

    public async joinClassroom(joinCode: string): Promise<void> {
        try {
            this._isTeacher = false;

            const classroomsRef = collection(db, 'classrooms');
            const q = query(classroomsRef, where('joinCode', '==', joinCode));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                vscode.window.showErrorMessage(`No classroom found with join code: ${joinCode}`);
                return;
            }

            const classroomDoc = querySnapshot.docs[0];
            this._currentClassroom = {
                ...classroomDoc.data(),
                id: classroomDoc.id
            } as Classroom;

            await this._updateStudentData();

            vscode.window.showInformationMessage(
                `Joined classroom: ${this._currentClassroom.name}`,
                { modal: true }
            );

            this._setupLeaderboardListener();
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to join classroom: ${error.message}`);
        }
    }

    private async _updateStudentData(): Promise<void> {
        if (!this._currentClassroom) return;

        const studentRef = doc(
            db,
            'classrooms',
            this._currentClassroom.id,
            'students',
            this._userId
        );

     await setDoc(doc(db, "users",), {
        name: this._userName,
            avatar: this._getRandomAvatar(),
            lastActive: new Date(),
             updatedAt: serverTimestamp()
});

            
        
    }

    private _setupLeaderboardListener(): void {
        if (!this._currentClassroom) return;

        const studentsRef = collection(
            db,
            'classrooms',
            this._currentClassroom.id,
            'students'
        );
        const leaderboardQuery = query(studentsRef, orderBy('xp', 'desc'), limit(10));

        onSnapshot(leaderboardQuery, (snapshot: { docs: any[]; }) => {
  // your logic here
  
            this._students = snapshot.docs.map(doc => {
                return doc.data() as Student;
});


            vscode.commands.executeCommand(
                'eco-debugger.updateLeaderboard',
                this._students
            );
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
function serverTimestamp() {
    throw new Error('Function not implemented.');
}

