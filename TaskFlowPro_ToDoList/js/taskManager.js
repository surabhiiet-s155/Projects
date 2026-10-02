/**
 * TaskFlow Pro - Task Manager Core Logic
 * Handles task state, CRUD operations, natural language parsing, sorting & filtering.
 */

class TaskManager {
    constructor() {
        this.tasks = StorageManager.getTasks();
        
        // If no tasks exist in storage, load demo dataset
        if (this.tasks === null || this.tasks.length === 0) {
            this.tasks = StorageManager.getDemoTasks();
            StorageManager.saveTasks(this.tasks);
        }

        this.categories = StorageManager.getCategories();
        this.settings = StorageManager.getSettings();
        this.stats = StorageManager.getStats();

        this.updateStreak();
    }

    // Natural Language Parser for Quick Input (e.g. "Buy groceries !high #personal")
    parseQuickInput(text) {
        let title = text;
        let priority = 'medium';
        let categoryId = this.categories[0]?.id || 'cat-work';
        let dueDate = '';

        // Priority tag parsing: !urgent, !high, !med, !low
        if (title.includes('!urgent')) {
            priority = 'urgent';
            title = title.replace('!urgent', '');
        } else if (title.includes('!high')) {
            priority = 'high';
            title = title.replace('!high', '');
        } else if (title.includes('!med')) {
            priority = 'medium';
            title = title.replace('!med', '');
        } else if (title.includes('!low')) {
            priority = 'low';
            title = title.replace('!low', '');
        }

        // Category tag parsing: #work, #personal, #health, #finance
        this.categories.forEach(cat => {
            const tag = `#${cat.name.toLowerCase()}`;
            if (title.toLowerCase().includes(tag)) {
                categoryId = cat.id;
                title = title.replace(new RegExp(tag, 'gi'), '');
            }
        });

        // Date keyword parsing: @today, @tomorrow
        const today = new Date();
        if (title.toLowerCase().includes('@today')) {
            dueDate = today.toISOString().split('T')[0];
            title = title.replace(/@today/gi, '');
        } else if (title.toLowerCase().includes('@tomorrow')) {
            const tom = new Date(today);
            tom.setDate(tom.getDate() + 1);
            dueDate = tom.toISOString().split('T')[0];
            title = title.replace(/@tomorrow/gi, '');
        }

        return {
            title: title.trim(),
            priority,
            category: categoryId,
            dueDate
        };
    }

    // Determine Eisenhower Matrix Quadrant
    calculateQuadrant(priority, dueDate) {
        const isUrgent = priority === 'urgent' || priority === 'high' || (dueDate && new Date(dueDate) <= new Date());
        const isImportant = priority === 'urgent' || priority === 'high' || priority === 'medium';

        if (isUrgent && isImportant) return 'q1'; // Do First
        if (!isUrgent && isImportant) return 'q2'; // Schedule
        if (isUrgent && !isImportant) return 'q3'; // Delegate
        return 'q4'; // Eliminate
    }

    // Add a New Task
    addTask(taskData) {
        const parsed = typeof taskData === 'string' ? this.parseQuickInput(taskData) : taskData;
        if (!parsed.title) return null;

        const newTask = {
            id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            title: parsed.title,
            description: parsed.description || '',
            priority: parsed.priority || 'medium',
            category: parsed.category || (this.categories[0]?.id || 'cat-work'),
            dueDate: parsed.dueDate || '',
            completed: false,
            kanbanStatus: 'todo',
            quadrant: this.calculateQuadrant(parsed.priority || 'medium', parsed.dueDate || ''),
            recurrence: parsed.recurrence || 'none',
            createdAt: new Date().toISOString(),
            focusTimeMinutes: 0,
            subtasks: parsed.subtasks || []
        };

        this.tasks.unshift(newTask);
        this.stats.totalCreated += 1;
        this.save();
        return newTask;
    }

    // Update Task
    updateTask(id, updatedFields) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index === -1) return false;

        const task = this.tasks[index];
        const newPriority = updatedFields.priority || task.priority;
        const newDueDate = updatedFields.dueDate !== undefined ? updatedFields.dueDate : task.dueDate;

        this.tasks[index] = {
            ...task,
            ...updatedFields,
            quadrant: this.calculateQuadrant(newPriority, newDueDate)
        };

        this.save();
        return this.tasks[index];
    }

    // Toggle Completion Status
    toggleTaskComplete(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return null;

        task.completed = !task.completed;
        task.kanbanStatus = task.completed ? 'completed' : 'todo';

        if (task.completed) {
            this.stats.totalCompleted += 1;

            // Recurring task auto-generation if enabled
            if (task.recurrence && task.recurrence !== 'none') {
                this.generateNextRecurringTask(task);
            }
        }

        this.updateStreak();
        this.save();
        return task;
    }

    // Delete Task
    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.save();
    }

    // Add Subtask
    addSubtask(taskId, title) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !title.trim()) return null;

        const subtask = {
            id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            title: title.trim(),
            completed: false
        };

        if (!task.subtasks) task.subtasks = [];
        task.subtasks.push(subtask);
        this.save();
        return subtask;
    }

    // Toggle Subtask Complete
    toggleSubtaskComplete(taskId, subtaskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !task.subtasks) return;

        const subtask = task.subtasks.find(s => s.id === subtaskId);
        if (subtask) {
            subtask.completed = !subtask.completed;
            this.save();
        }
    }

    // Delete Subtask
    deleteSubtask(taskId, subtaskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !task.subtasks) return;

        task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
        this.save();
    }

    // Handle Recurring Task Renewal
    generateNextRecurringTask(task) {
        if (!task.dueDate) return;
        const currentDueDate = new Date(task.dueDate);
        const nextDueDate = new Date(currentDueDate);

        if (task.recurrence === 'daily') nextDueDate.setDate(nextDueDate.getDate() + 1);
        else if (task.recurrence === 'weekly') nextDueDate.setDate(nextDueDate.getDate() + 7);
        else if (task.recurrence === 'monthly') nextDueDate.setMonth(nextDueDate.getMonth() + 1);

        this.addTask({
            title: task.title,
            description: task.description,
            priority: task.priority,
            category: task.category,
            dueDate: nextDueDate.toISOString().split('T')[0],
            recurrence: task.recurrence,
            subtasks: task.subtasks ? task.subtasks.map(s => ({ ...s, completed: false })) : []
        });
    }

    // Categories Operations
    addCategory(name, color) {
        const newCat = {
            id: 'cat-' + Date.now(),
            name,
            color: color || '#6366f1',
            icon: 'fa-folder'
        };
        this.categories.push(newCat);
        StorageManager.saveCategories(this.categories);
        return newCat;
    }

    // Filter & Search Logic
    getFilteredTasks(filter = 'all', statusFilter = 'all', searchQuery = '') {
        const todayStr = new Date().toISOString().split('T')[0];

        return this.tasks.filter(task => {
            // Search Query Filter
            if (searchQuery.trim() !== '') {
                const query = searchQuery.toLowerCase();
                const matchTitle = task.title.toLowerCase().includes(query);
                const matchDesc = task.description.toLowerCase().includes(query);
                if (!matchTitle && !matchDesc) return false;
            }

            // Status Filter (Active, Completed, Overdue)
            if (statusFilter === 'active' && task.completed) return false;
            if (statusFilter === 'completed' && !task.completed) return false;
            if (statusFilter === 'overdue') {
                if (task.completed || !task.dueDate) return false;
                if (task.dueDate >= todayStr) return false;
            }

            // View Mode Filter
            if (filter === 'today') {
                return task.dueDate === todayStr;
            }
            if (filter === 'upcoming') {
                return task.dueDate && task.dueDate > todayStr && !task.completed;
            }
            if (filter.startsWith('cat-')) {
                return task.category === filter;
            }

            return true;
        });
    }

    // Sort Logic
    sortTasks(tasksList, sortKey = 'createdAt-desc') {
        const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };

        return [...tasksList].sort((a, b) => {
            if (sortKey === 'createdAt-desc') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            if (sortKey === 'dueDate-asc') {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            if (sortKey === 'priority-desc') {
                return priorityWeight[b.priority] - priorityWeight[a.priority];
            }
            if (sortKey === 'title-asc') {
                return a.title.localeCompare(b.title);
            }
            return 0;
        });
    }

    // Daily Streak Logic
    updateStreak() {
        const today = new Date().toISOString().split('T')[0];
        const lastActive = this.stats.lastActiveDate;

        if (lastActive !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastActive === yesterdayStr) {
                this.stats.streakDays += 1;
            } else {
                this.stats.streakDays = 1;
            }
            this.stats.lastActiveDate = today;
            StorageManager.saveStats(this.stats);
        }
    }

    save() {
        StorageManager.saveTasks(this.tasks);
        StorageManager.saveStats(this.stats);
    }
}
