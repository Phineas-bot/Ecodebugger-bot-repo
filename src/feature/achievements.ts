export interface Achievement {
  name: string;
  type: 'green' | 'bug' | 'milestone';
}

export const achievements: Achievement[] = [
  { name: 'Green Coder', type: 'green' },
  { name: 'Bug Slayer', type: 'bug' },
  { name: 'Efficient Thinker', type: 'milestone' },
  { name: 'Team Leader', type: 'milestone' },
];
