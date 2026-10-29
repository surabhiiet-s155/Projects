/**
 * TaskFlow Pro - Storage Manager Module
 * Handles local persistence, data backup/export/import, and initial state setup.
 */

const STORAGE_KEYS = {
    TASKS: 'taskflow_tasks',
    CATEGORIES: 'taskflow_categories',
    SETTINGS: 'taskflow_settings',
    STATS: 'taskflow_stats'
};

const DEFAULT_CATEGORIES = [
    { id: 'cat-work', name: 'Work', color: '#6366f1', icon: 'fa-briefcase' },
    { id: 'cat-personal', name: 'Personal', color: '#ec4899', icon: 'fa-user' },
    { id: 'cat-health', name: 'Health', color: '#10b981', icon: 'fa-heart-pulse' },
    { id: 'cat-finance', name: 'Finance', color: '#f59e0b', icon: 'fa-wallet' }
];

const DEFAULT_SETTINGS = {
    theme: 'dark',
    soundEnabled: true,
    viewMode: 'list',
    sortMode: 'createdAt-desc',
    activeView: 'all'
};

const StorageManager = {
    // Load Tasks from localStorage
    getTasks() {
        const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (e) {
            console.error('Error parsing tasks from storage', e);
            return [];
        }
    },

    // Save Tasks to localStorage
    saveTasks(tasks) {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    },

    // Load Categories
    getCategories() {
        const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        if (!raw) return DEFAULT_CATEGORIES;
        try {
            return JSON.parse(raw);
        } catch (e) {
            return DEFAULT_CATEGORIES;
        }
    },

    // Save Categories
    saveCategories(categories) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    },

    // Load Settings
    getSettings() {
        const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (!raw) return DEFAULT_SETTINGS;
        try {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
        } catch (e) {
            return DEFAULT_SETTINGS;
        }
    },

    // Save Settings
    saveSettings(settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    },

    // Load Stats
    getStats() {
        const raw = localStorage.getItem(STORAGE_KEYS.STATS);
        const defaultStats = {
            totalCreated: 0,
            totalCompleted: 0,
            totalFocusSeconds: 0,
            streakDays: 1,
            lastActiveDate: new Date().toISOString().split('T')[0]
        };
        if (!raw) return defaultStats;
        try {
            return { ...defaultStats, ...JSON.parse(raw) };
        } catch (e) {
            return defaultStats;
        }
    },

    // Save Stats
    saveStats(stats) {
        localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    },

    // Generate Demo Data for First-Time Users or via Settings
    getDemoTasks() {
        const todayStr = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 5);
        const nextWeekStr = nextWeek.toISOString().split('T')[0];

        return [
            {
                id: 'demo-task-1',
                title: '🚀 Launch Quarter Project Proposal',
                description: 'Review pitch deck slides and send finalized draft to team leads.',
                priority: 'urgent',
                category: 'cat-work',
                dueDate: todayStr,
                completed: false,
                kanbanStatus: 'in-progress',
                quadrant: 'q1',
                recurrence: 'none',
                createdAt: new Date().toISOString(),
                focusTimeMinutes: 45,
                subtasks: [
                    { id: 'sub-1', title: 'Prepare slide deck', completed: true },
                    { id: 'sub-2', title: 'Gather metric graphs', completed: true },
                    { id: 'sub-3', title: 'Final executive summary', completed: false }
                ]
            },
            {
                id: 'demo-task-2',
                title: '🏋️‍♂️ Morning Gym & Cardio Session',
                description: '30 mins treadmill + upper body workout routine.',
                priority: 'high',
                category: 'cat-health',
                dueDate: todayStr,
                completed: true,
                kanbanStatus: 'completed',
                quadrant: 'q2',
                recurrence: 'daily',
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                focusTimeMinutes: 30,
                subtasks: [
                    { id: 'sub-4', title: 'Stretching & Warmup', completed: true },
                    { id: 'sub-5', title: 'Hydrate 1L water', completed: true }
                ]
            },
            {
                id: 'demo-task-3',
                title: '📊 Review Monthly Budget & Investments',
                description: 'Check stock portfolio performance and update expense log.',
                priority: 'medium',
                category: 'cat-finance',
                dueDate: tomorrowStr,
                completed: false,
                kanbanStatus: 'todo',
                quadrant: 'q2',
                recurrence: 'monthly',
                createdAt: new Date().toISOString(),
                focusTimeMinutes: 0,
                subtasks: []
            },
            {
                id: 'demo-task-4',
                title: '☕ Weekly Team Sync & Catchup',
                description: 'Align on upcoming release goals and sprint backlog.',
                priority: 'low',
                category: 'cat-personal',
                dueDate: nextWeekStr,
                completed: false,
                kanbanStatus: 'todo',
                quadrant: 'q3',
                recurrence: 'weekly',
                createdAt: new Date().toISOString(),
                focusTimeMinutes: 0,
                subtasks: []
            }
        ];
    },

    // Export all data as JSON file download
    exportData() {
        const exportObj = {
            tasks: this.getTasks() || [],
            categories: this.getCategories(),
            settings: this.getSettings(),
            stats: this.getStats(),
            exportedAt: new Date().toISOString()
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `taskflow_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    },

    // Import JSON data
    importData(jsonContent) {
        try {
            const data = JSON.parse(jsonContent);
            if (data.tasks) this.saveTasks(data.tasks);
            if (data.categories) this.saveCategories(data.categories);
            if (data.settings) this.saveSettings(data.settings);
            if (data.stats) this.saveStats(data.stats);
            return true;
        } catch (e) {
            console.error('Invalid JSON import file', e);
            return false;
        }
    },

    // Clear all tasks & reset
    clearAll() {
        localStorage.removeItem(STORAGE_KEYS.TASKS);
        localStorage.removeItem(STORAGE_KEYS.STATS);
    }
};
