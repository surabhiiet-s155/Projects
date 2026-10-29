/**
 * TaskFlow Pro - UI Rendering Engine
 * Renders views (List, Kanban, Matrix, Calendar) and handles DOM interactions.
 */
class UIRenderer {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.currentCalendarDate = new Date();
    }

    // Helper: Format Date for display
    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const diffDays = Math.round((date - today) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // Trigger Reward Confetti
    triggerConfetti() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.7 }
            });
        }
    }

    // Render Sidebar Navigation Categories
    renderCategoryNav() {
        const catContainer = document.getElementById('categoryNavList');
        if (!catContainer) return;

        catContainer.innerHTML = this.taskManager.categories.map(cat => {
            const count = this.taskManager.tasks.filter(t => t.category === cat.id && !t.completed).length;
            return `
                <li class="nav-item" data-view="${cat.id}">
                    <a href="#" class="nav-link">
                        <span class="cat-dot" style="background-color: ${cat.color};"></span>
                        <span>${cat.name}</span>
                        <span class="count-badge">${count}</span>
                    </a>
                </li>
            `;
        }).join('');
    }

    // Render Task Item HTML String
    createTaskItemHTML(task) {
        const category = this.taskManager.categories.find(c => c.id === task.category) || { name: 'General', color: '#6366f1' };
        const formattedDate = this.formatDate(task.dueDate);

        const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate + 'T23:59:59') < new Date();
        const subtasksTotal = task.subtasks ? task.subtasks.length : 0;
        const subtasksDone = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;

        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-checkbox-wrapper">
                    <div class="custom-checkbox task-check-btn" title="Toggle Completion">
                        <i class="fa-solid fa-check"></i>
                    </div>
                </div>

                <div class="task-main">
                    <div class="task-header-row">
                        <span class="task-title">${task.title}</span>
                    </div>

                    ${task.description ? `<p class="task-desc">${task.description}</p>` : ''}

                    <div class="task-meta">
                        <!-- Priority Badge -->
                        <span class="meta-badge priority-badge priority-${task.priority}">
                            <i class="fa-solid fa-flag"></i> ${task.priority.toUpperCase()}
                        </span>

                        <!-- Category Badge -->
                        <span class="meta-badge category-badge" style="background-color: ${category.color};">
                            ${category.name}
                        </span>

                        <!-- Due Date Badge -->
                        ${task.dueDate ? `
                            <span class="meta-badge date-badge ${isOverdue ? 'overdue' : ''}">
                                <i class="fa-regular fa-clock"></i> ${formattedDate} ${isOverdue ? '(Overdue)' : ''}
                            </span>
                        ` : ''}

                        <!-- Subtasks Progress Badge -->
                        ${subtasksTotal > 0 ? `
                            <span class="meta-badge subtasks-badge">
                                <i class="fa-solid fa-list-check"></i> ${subtasksDone}/${subtasksTotal}
                            </span>
                        ` : ''}

                        <!-- Recurrence Badge -->
                        ${task.recurrence && task.recurrence !== 'none' ? `
                            <span class="meta-badge subtasks-badge">
                                <i class="fa-solid fa-arrows-rotate"></i> ${task.recurrence}
                            </span>
                        ` : ''}
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="task-actions">
                    <button class="task-action-btn edit-btn" title="Edit Task">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="task-action-btn delete-btn" title="Delete Task">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // 1. Render List / Grid View
    renderListView(filter = 'all', statusFilter = 'all', searchQuery = '', sortKey = 'createdAt-desc') {
        const taskListContainer = document.getElementById('taskList');
        const emptyState = document.getElementById('emptyState');
        if (!taskListContainer) return;

        let filtered = this.taskManager.getFilteredTasks(filter, statusFilter, searchQuery);
        filtered = this.taskManager.sortTasks(filtered, sortKey);

        if (filtered.length === 0) {
            taskListContainer.innerHTML = '';
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            taskListContainer.innerHTML = filtered.map(t => this.createTaskItemHTML(t)).join('');
        }

        this.updateCounts();
    }

    // 2. Render Kanban Board View
    renderKanbanView() {
        const todoCol = document.getElementById('kanbanTodo');
        const progressCol = document.getElementById('kanbanProgress');
        const doneCol = document.getElementById('kanbanDone');

        if (!todoCol || !progressCol || !doneCol) return;

        const tasks = this.taskManager.tasks;
        const todoTasks = tasks.filter(t => !t.completed && t.kanbanStatus === 'todo');
        const progressTasks = tasks.filter(t => !t.completed && t.kanbanStatus === 'in-progress');
        const doneTasks = tasks.filter(t => t.completed || t.kanbanStatus === 'completed');

        todoCol.innerHTML = todoTasks.map(t => this.createTaskItemHTML(t)).join('');
        progressCol.innerHTML = progressTasks.map(t => this.createTaskItemHTML(t)).join('');
        doneCol.innerHTML = doneTasks.map(t => this.createTaskItemHTML(t)).join('');

        document.getElementById('countKanbanTodo').textContent = todoTasks.length;
        document.getElementById('countKanbanProgress').textContent = progressTasks.length;
        document.getElementById('countKanbanDone').textContent = doneTasks.length;
    }

    // 3. Render Eisenhower Matrix View
    renderMatrixView() {
        const q1List = document.getElementById('matrixQ1');
        const q2List = document.getElementById('matrixQ2');
        const q3List = document.getElementById('matrixQ3');
        const q4List = document.getElementById('matrixQ4');

        if (!q1List) return;

        const tasks = this.taskManager.tasks.filter(t => !t.completed);

        const q1 = tasks.filter(t => t.quadrant === 'q1');
        const q2 = tasks.filter(t => t.quadrant === 'q2');
        const q3 = tasks.filter(t => t.quadrant === 'q3');
        const q4 = tasks.filter(t => t.quadrant === 'q4');

        q1List.innerHTML = q1.map(t => this.createTaskItemHTML(t)).join('');
        q2List.innerHTML = q2.map(t => this.createTaskItemHTML(t)).join('');
        q3List.innerHTML = q3.map(t => this.createTaskItemHTML(t)).join('');
        q4List.innerHTML = q4.map(t => this.createTaskItemHTML(t)).join('');

        document.getElementById('countQ1').textContent = q1.length;
        document.getElementById('countQ2').textContent = q2.length;
        document.getElementById('countQ3').textContent = q3.length;
        document.getElementById('countQ4').textContent = q4.length;
    }

    // 4. Render Calendar View
    renderCalendarView(targetDate = new Date()) {
        this.currentCalendarDate = targetDate;
        const monthYearText = document.getElementById('calMonthYearText');
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) return;

        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();

        monthYearText.textContent = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const startingDay = firstDayOfMonth.getDay();
        const totalDays = lastDayOfMonth.getDate();

        let cellsHTML = '';

        // Empty padding cells for previous month
        for (let i = 0; i < startingDay; i++) {
            cellsHTML += `<div class="cal-day-cell other-month"></div>`;
        }

        // Calendar days
        const todayStr = new Date().toISOString().split('T')[0];

        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;

            const dayTasks = this.taskManager.tasks.filter(t => t.dueDate === dateStr);

            const tasksPillsHTML = dayTasks.map(t => `
                <div class="cal-task-pill ${t.completed ? 'completed' : ''}" data-task-id="${t.id}" title="${t.title}">
                    ${t.title}
                </div>
            `).join('');

            cellsHTML += `
                <div class="cal-day-cell ${isToday ? 'today' : ''}">
                    <span class="cal-day-num">${day}</span>
                    <div class="cal-tasks-wrapper">${tasksPillsHTML}</div>
                </div>
            `;
        }

        calendarGrid.innerHTML = cellsHTML;
    }

    // Update Nav Count Badges
    updateCounts() {
        const tasks = this.taskManager.tasks;
        const todayStr = new Date().toISOString().split('T')[0];

        document.getElementById('countAll').textContent = tasks.filter(t => !t.completed).length;
        document.getElementById('countToday').textContent = tasks.filter(t => t.dueDate === todayStr && !t.completed).length;
        document.getElementById('countUpcoming').textContent = tasks.filter(t => t.dueDate > todayStr && !t.completed).length;
        
        document.getElementById('streakDays').textContent = `${this.taskManager.stats.streakDays} Days`;
        this.renderCategoryNav();
    }
}
