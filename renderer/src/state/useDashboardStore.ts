import { create } from 'zustand';

export type Category = 'study' | 'work' | 'health' | 'personal' | 'custom';

export type TaskPriority = 0 | 1 | 2 | 3;

export type TaskStatus = 'pending' | 'completed';

export type Task = {
    id: string;
    date: string; // YYYY-MM-DD (instance date)
    title: string;
    category: Category;
    startTime?: string | null;
    dueTime?: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    completedAt?: string | null;
    starred: boolean;
    recurrenceTemplateId?: string | null;
};

export type DailyStats = {
    date: string;
    taskCountTotal: number;
    taskCountCompleted: number;
    completionPercent: number;
    productivityScore: number;
    streakCount: number;
    streakBest: number;
};

export type Note = {
    date: string;
    contentMarkdown: string;
    contentHtml: string;
};

export type Bullet = {
    id: string;
    date: string;
    text: string;
};

export type DashboardState = {
    selectedDate: string; // YYYY-MM-DD
    dailyStats?: DailyStats;

    tasks: Task[];
    notes?: Note;
    wins: Bullet[];
    challenges: Bullet[];

    loading: boolean;
    error?: string;

    setSelectedDate: (date: string) => void;
    hydrateForDate: (date: string) => Promise<void>;
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const toDateStr = (d: Date) => {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const initDate = toDateStr(new Date());

export const useDashboardStore = create<DashboardState>((set, get) => ({
    selectedDate: initDate,
    dailyStats: undefined,

    tasks: [],
    notes: undefined,
    wins: [],
    challenges: [],

    loading: false,
    error: undefined,

    setSelectedDate: (date) => set({ selectedDate: date }),

    hydrateForDate: async (date) => {
        const { electronAPI } = window as any;
        if (!electronAPI?.dbGetForDate) {
            // Phase 1 scaffolding without backend connection
            set({
                loading: false,
                error: 'IPC not ready',
                dailyStats: undefined,
                tasks: [],
                wins: [],
                challenges: []
            });
            return;
        }

        set({ loading: true, error: undefined });

        try {
            const payload = await electronAPI.dbGetForDate(date);
            set({
                loading: false,
                dailyStats: payload.dailyStats,
                tasks: payload.tasks,
                notes: payload.notes,
                wins: payload.wins,
                challenges: payload.challenges
            });
        } catch (e: any) {
            set({ loading: false, error: e?.message ?? String(e) });
        }
    }
}));

