/**
 * TaskFlow Pro - Main Application Controller & Entry Point
 * Orchestrates event listeners, user interactions, keyboard shortcuts, and theme engine.
 */

class TaskFlowApp {
    constructor() {
        this.taskManager = new TaskManager();
        this.ui = new UIRenderer(this.taskManager);
        this.cmdPalette = new CommandPalette(this);
        this.analytics = new AnalyticsDashboard(this.taskManager);

        this.currentView = this.taskManager.settings.activeView || 'all';
        this.statusFilter = 'all';
        this.searchQuery = '';
        this.sortKey = this.taskManager.settings.sortMode || 'createdAt-desc';
        this.viewMode = this.taskManager.settings.viewMode || 'list';

        this.initTimer();
        this.initVoice();
        this.initTheme();
        this.initEventListeners();
        this.initSortableDragDrop();

        this.renderCurrentView();
    }

    // Initialize Pomodoro Timer
    initTimer() {
        this.timer = new PomodoroTimer(
            this.taskManager,
            (timeLeft, totalDuration) => this.updateTimerUI(timeLeft, totalDuration),
            (mode) => {
                this.showToast(`Pomodoro ${mode} session completed! Great job!`, 'success');
                this.ui.triggerConfetti();
                document.getElementById('timerDot').classList.add('hidden');
            }
        );
    }

    // Update Pomodoro Timer Display UI
    updateTimerUI(timeLeft, totalDuration) {
        const timeDisplay = document.getElementById('pomoTimeDisplay');
        const progressCircle = document.getElementById('pomoProgressCircle');
        const timerDot = document.getElementById('timerDot');

        if (timeDisplay) timeDisplay.textContent = this.timer.getFormattedTime();

        if (progressCircle) {
            const circumference = 283;
            const offset = circumference - (timeLeft / totalDuration) * circumference;
            progressCircle.style.strokeDashoffset = offset;
        }

        if (timerDot) {
            if (this.timer.isRunning) timerDot.classList.remove('hidden');
            else timerDot.classList.add('hidden');
        }
    }

    // Initialize Voice Speech Recognition
    initVoice() {
        this.voiceHandler = new VoiceInputHandler(
            (transcript) => {
                this.closeVoiceModal();
                const added = this.taskManager.addTask(transcript);
                if (added) {
                    this.showToast(`Voice Task Created: "${added.title}"`, 'success');
                    this.renderCurrentView();
                }
            },
            (errorMsg) => {
                this.closeVoiceModal();
                this.showToast(`Voice Error: ${errorMsg}`, 'error');
            }
        );
    }

    // Initialize Theme
    initTheme() {
        const theme = this.taskManager.settings.theme || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
    }

    setTheme(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
        this.taskManager.settings.theme = themeName;
        StorageManager.saveSettings(this.taskManager.settings);
        this.showToast(`Theme changed to ${themeName.toUpperCase()}`);
    }

    // Show Toast Notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: 'fa-circle-check text-success',
            error: 'fa-circle-exclamation text-danger',
            warning: 'fa-triangle-exclamation text-warning',
            info: 'fa-circle-info text-primary'
        };

        toast.innerHTML = `
            <i class="fa-solid ${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(50px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Switch Main Views
    switchView(viewName) {
        this.currentView = viewName;
        this.taskManager.settings.activeView = viewName;
        StorageManager.saveSettings(this.taskManager.settings);

        // Update active class in sidebar
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
            if (item.getAttribute('data-view') === viewName) item.classList.add('active');
            else item.classList.remove('active');
        });

        // Hide all view containers
        document.querySelectorAll('.view-container').forEach(c => c.classList.add('hidden'));

        // Update Header Titles
        const pageTitle = document.getElementById('pageTitle');
        const pageSubtitle = document.getElementById('pageSubtitle');
        const mainToolbar = document.getElementById('mainToolbar');
        const quickAddCard = document.getElementById('quickAddCard');

        if (mainToolbar) mainToolbar.classList.remove('hidden');
        if (quickAddCard) quickAddCard.classList.remove('hidden');

        if (viewName === 'kanban') {
            document.getElementById('kanbanViewContainer').classList.remove('hidden');
            pageTitle.textContent = 'Kanban Board';
            pageSubtitle.textContent = 'Drag & drop tasks across workflow columns';
            this.ui.renderKanbanView();
        } else if (viewName === 'matrix') {
            document.getElementById('matrixViewContainer').classList.remove('hidden');
            pageTitle.textContent = 'Eisenhower Matrix';
            pageSubtitle.textContent = 'Prioritize tasks by Urgency and Importance';
            this.ui.renderMatrixView();
        } else if (viewName === 'calendar') {
            document.getElementById('calendarViewContainer').classList.remove('hidden');
            pageTitle.textContent = 'Calendar';
            pageSubtitle.textContent = 'View monthly schedule and deadlines';
            this.ui.renderCalendarView();
        } else if (viewName === 'pomodoro') {
            document.getElementById('pomodoroViewContainer').classList.remove('hidden');
            if (mainToolbar) mainToolbar.classList.add('hidden');
            if (quickAddCard) quickAddCard.classList.add('hidden');
            pageTitle.textContent = 'Focus Pomodoro Timer';
            pageSubtitle.textContent = 'Boost productivity using timed focus sprints';
            this.populatePomoTaskSelect();
        } else if (viewName === 'analytics') {
            document.getElementById('analyticsViewContainer').classList.remove('hidden');
            if (mainToolbar) mainToolbar.classList.add('hidden');
            if (quickAddCard) quickAddCard.classList.add('hidden');
            pageTitle.textContent = 'Analytics & Insights';
            pageSubtitle.textContent = 'Track your completion trends and velocity';
            this.analytics.renderAll();
        } else {
            // Default: List / Grid View
            document.getElementById('listViewContainer').classList.remove('hidden');
            if (viewName === 'today') {
                pageTitle.textContent = "Today's Focus";
                pageSubtitle.textContent = 'Tasks scheduled for today';
            } else if (viewName === 'upcoming') {
                pageTitle.textContent = 'Upcoming Deadlines';
                pageSubtitle.textContent = 'Tasks scheduled for future dates';
            } else if (viewName.startsWith('cat-')) {
                const cat = this.taskManager.categories.find(c => c.id === viewName);
                pageTitle.textContent = cat ? cat.name : 'Category Tasks';
                pageSubtitle.textContent = `Tasks in ${cat ? cat.name : 'Category'}`;
            } else {
                pageTitle.textContent = 'All Tasks';
                pageSubtitle.textContent = 'Manage and organize your daily work';
            }
            this.ui.renderListView(this.currentView, this.statusFilter, this.searchQuery, this.sortKey);
        }
    }

    renderCurrentView() {
        this.switchView(this.currentView);
    }

    // Populate Task select in Pomodoro
    populatePomoTaskSelect() {
        const select = document.getElementById('pomoTaskSelect');
        if (!select) return;

        const activeTasks = this.taskManager.tasks.filter(t => !t.completed);
        select.innerHTML = '<option value="">-- Unlinked General Session --</option>' + 
            activeTasks.map(t => `<option value="${t.id}">${t.title}</option>`).join('');
    }

    // Modal Operations
    openTaskModal(taskId = null) {
        const backdrop = document.getElementById('taskModalBackdrop');
        const modalTitle = document.getElementById('taskModalTitle');
        const categorySelect = document.getElementById('modalTaskCategory');

        if (!backdrop) return;

        // Populate Categories in Select
        categorySelect.innerHTML = this.taskManager.categories.map(c => 
            `<option value="${c.id}">${c.name}</option>`
        ).join('');

        if (taskId) {
            const task = this.taskManager.tasks.find(t => t.id === taskId);
            if (!task) return;

            modalTitle.textContent = 'Edit Task';
            document.getElementById('modalTaskId').value = task.id;
            document.getElementById('modalTaskTitle').value = task.title;
            document.getElementById('modalTaskDesc').value = task.description || '';
            document.getElementById('modalTaskPriority').value = task.priority;
            document.getElementById('modalTaskCategory').value = task.category;
            document.getElementById('modalTaskDueDate').value = task.dueDate || '';
            document.getElementById('modalTaskRecurrence').value = task.recurrence || 'none';

            this.renderModalSubtasks(task.subtasks || []);
        } else {
            modalTitle.textContent = 'New Task';
            document.getElementById('taskForm').reset();
            document.getElementById('modalTaskId').value = '';
            this.renderModalSubtasks([]);
        }

        backdrop.classList.remove('hidden');
        setTimeout(() => document.getElementById('modalTaskTitle').focus(), 50);
    }

    closeTaskModal() {
        const backdrop = document.getElementById('taskModalBackdrop');
        if (backdrop) backdrop.classList.add('hidden');
    }

    renderModalSubtasks(subtasks) {
        const container = document.getElementById('modalSubtasksList');
        const progressText = document.getElementById('modalSubtaskProgressText');
        if (!container) return;

        const doneCount = subtasks.filter(s => s.completed).length;
        if (progressText) progressText.textContent = `${doneCount} / ${subtasks.length}`;

        container.innerHTML = subtasks.map(s => `
            <div class="subtask-row ${s.completed ? 'completed' : ''}" data-subtask-id="${s.id}">
                <input type="checkbox" class="subtask-check" ${s.completed ? 'checked' : ''}>
                <input type="text" class="subtask-title-input" value="${s.title}">
                <button type="button" class="icon-btn-sm remove-subtask-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `).join('');
    }

    // Voice Modal Operations
    openVoiceModal() {
        const backdrop = document.getElementById('voiceModalBackdrop');
        if (backdrop) backdrop.classList.remove('hidden');
        document.getElementById('voiceTranscript').textContent = 'Listening... Say task title';
        this.voiceHandler.start();
    }

    closeVoiceModal() {
        const backdrop = document.getElementById('voiceModalBackdrop');
        if (backdrop) backdrop.classList.add('hidden');
        this.voiceHandler.stop();
    }

    // Sortable JS Drag & Drop for Kanban and List
    initSortableDragDrop() {
        const kanbanCols = ['kanbanTodo', 'kanbanProgress', 'kanbanDone'];
        
        kanbanCols.forEach(colId => {
            const el = document.getElementById(colId);
            if (el && typeof Sortable !== 'undefined') {
                Sortable.create(el, {
                    group: 'kanban',
                    animation: 150,
                    onEnd: (evt) => {
                        const taskId = evt.item.getAttribute('data-task-id');
                        const targetStatusMap = {
                            kanbanTodo: 'todo',
                            kanbanProgress: 'in-progress',
                            kanbanDone: 'completed'
                        };
                        const newStatus = targetStatusMap[evt.to.id];
                        if (taskId && newStatus) {
                            const isDone = newStatus === 'completed';
                            this.taskManager.updateTask(taskId, {
                                kanbanStatus: newStatus,
                                completed: isDone
                            });
                            if (isDone) this.ui.triggerConfetti();
                            this.renderCurrentView();
                        }
                    }
                });
            }
        });
    }

    // Load Demo Data
    loadDemoData() {
        this.taskManager.tasks = StorageManager.getDemoTasks();
        this.taskManager.save();
        this.showToast('Demo tasks loaded successfully!', 'success');
        this.renderCurrentView();
    }

    // Event Listeners Setup
    initEventListeners() {
        // Quick Add Form
        const quickInput = document.getElementById('quickAddInput');
        const quickAddSubmitBtn = document.getElementById('quickAddSubmitBtn');

        const handleQuickAdd = () => {
            const val = quickInput.value.trim();
            if (!val) return;

            const priority = document.getElementById('quickPriority').value;
            const dueDate = document.getElementById('quickDueDate').value;

            const task = this.taskManager.addTask({
                title: val,
                priority,
                dueDate
            });

            if (task) {
                quickInput.value = '';
                this.showToast('Task created successfully!', 'success');
                this.renderCurrentView();
            }
        };

        if (quickInput) {
            quickInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleQuickAdd();
            });
        }
        if (quickAddSubmitBtn) {
            quickAddSubmitBtn.addEventListener('click', handleQuickAdd);
        }

        // Sidebar Add Task Button
        document.getElementById('sidebarAddBtn')?.addEventListener('click', () => this.openTaskModal());
        document.getElementById('emptyStateAddBtn')?.addEventListener('click', () => this.openTaskModal());

        // Sidebar View Links Delegated Handler
        document.querySelector('.sidebar-nav')?.addEventListener('click', (e) => {
            const item = e.target.closest('.nav-item');
            if (item) {
                e.preventDefault();
                const view = item.getAttribute('data-view');
                if (view) this.switchView(view);

                // Mobile drawer close
                document.getElementById('sidebar')?.classList.remove('open');
                document.getElementById('sidebarOverlay')?.classList.remove('open');
            }
        });

        // Mobile Sidebar Toggle
        document.getElementById('toggleSidebarBtn')?.addEventListener('click', () => {
            document.getElementById('sidebar')?.classList.add('open');
            document.getElementById('sidebarOverlay')?.classList.add('open');
        });
        document.getElementById('closeSidebarBtn')?.addEventListener('click', () => {
            document.getElementById('sidebar')?.classList.remove('open');
            document.getElementById('sidebarOverlay')?.classList.remove('open');
        });
        document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
            document.getElementById('sidebar')?.classList.remove('open');
            document.getElementById('sidebarOverlay')?.classList.remove('open');
        });

        // Status Filter Tabs
        document.getElementById('statusFilterTabs')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.tab-btn');
            if (btn) {
                document.querySelectorAll('#statusFilterTabs .tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.statusFilter = btn.getAttribute('data-status');
                this.renderCurrentView();
            }
        });

        // Sort Select Dropdown
        document.getElementById('sortSelect')?.addEventListener('change', (e) => {
            this.sortKey = e.target.value;
            this.taskManager.settings.sortMode = this.sortKey;
            StorageManager.saveSettings(this.taskManager.settings);
            this.renderCurrentView();
        });

        // Grid / List View Toggle
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const mode = btn.getAttribute('data-mode');
                this.viewMode = mode;
                const container = document.getElementById('listViewContainer');
                if (mode === 'grid') container.classList.add('grid-mode');
                else container.classList.remove('grid-mode');
            });
        });

        // Search Input
        const searchInput = document.getElementById('searchInput');
        const clearSearchBtn = document.getElementById('clearSearchBtn');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                if (this.searchQuery) clearSearchBtn.classList.remove('hidden');
                else clearSearchBtn.classList.add('hidden');
                this.renderCurrentView();
            });
        }
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                this.searchQuery = '';
                clearSearchBtn.classList.add('hidden');
                this.renderCurrentView();
            });
        }

        // Global Task Delegated Event Handler (Check, Edit, Delete)
        document.getElementById('contentBody')?.addEventListener('click', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (!taskItem) return;

            const taskId = taskItem.getAttribute('data-task-id');

            // Toggle Complete Checkbox
            if (e.target.closest('.task-check-btn')) {
                const updated = this.taskManager.toggleTaskComplete(taskId);
                if (updated && updated.completed) {
                    this.showToast('Task Completed! 🎉', 'success');
                    this.ui.triggerConfetti();
                }
                this.renderCurrentView();
                return;
            }

            // Edit Task
            if (e.target.closest('.edit-btn')) {
                this.openTaskModal(taskId);
                return;
            }

            // Delete Task
            if (e.target.closest('.delete-btn')) {
                if (confirm('Are you sure you want to delete this task?')) {
                    this.taskManager.deleteTask(taskId);
                    this.showToast('Task deleted');
                    this.renderCurrentView();
                }
                return;
            }
        });

        // Task Form Modal Submit
        document.getElementById('taskForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const taskId = document.getElementById('modalTaskId').value;
            const title = document.getElementById('modalTaskTitle').value.trim();
            const description = document.getElementById('modalTaskDesc').value.trim();
            const priority = document.getElementById('modalTaskPriority').value;
            const category = document.getElementById('modalTaskCategory').value;
            const dueDate = document.getElementById('modalTaskDueDate').value;
            const recurrence = document.getElementById('modalTaskRecurrence').value;

            // Collect Subtasks from modal
            const subtaskRows = document.querySelectorAll('#modalSubtasksList .subtask-row');
            const subtasks = Array.from(subtaskRows).map(row => ({
                id: row.getAttribute('data-subtask-id') || 'sub-' + Date.now() + Math.random(),
                title: row.querySelector('.subtask-title-input').value.trim(),
                completed: row.querySelector('.subtask-check').checked
            })).filter(s => s.title);

            if (taskId) {
                this.taskManager.updateTask(taskId, {
                    title, description, priority, category, dueDate, recurrence, subtasks
                });
                this.showToast('Task updated successfully!', 'success');
            } else {
                this.taskManager.addTask({
                    title, description, priority, category, dueDate, recurrence, subtasks
                });
                this.showToast('Task created successfully!', 'success');
            }

            this.closeTaskModal();
            this.renderCurrentView();
        });

        // Modal Subtask Adders
        document.getElementById('addSubtaskBtn')?.addEventListener('click', () => {
            const input = document.getElementById('newSubtaskInput');
            const val = input.value.trim();
            if (!val) return;

            const container = document.getElementById('modalSubtasksList');
            const row = document.createElement('div');
            row.className = 'subtask-row';
            row.setAttribute('data-subtask-id', 'sub-' + Date.now());
            row.innerHTML = `
                <input type="checkbox" class="subtask-check">
                <input type="text" class="subtask-title-input" value="${val}">
                <button type="button" class="icon-btn-sm remove-subtask-btn"><i class="fa-solid fa-xmark"></i></button>
            `;
            container.appendChild(row);
            input.value = '';
        });

        document.getElementById('modalSubtasksList')?.addEventListener('click', (e) => {
            if (e.target.closest('.remove-subtask-btn')) {
                e.target.closest('.subtask-row').remove();
            }
        });

        // Close Modals
        document.getElementById('closeTaskModalBtn')?.addEventListener('click', () => this.closeTaskModal());
        document.getElementById('cancelTaskModalBtn')?.addEventListener('click', () => this.closeTaskModal());
        document.getElementById('stopVoiceBtn')?.addEventListener('click', () => this.closeVoiceModal());

        // Voice Button
        document.getElementById('voiceInputBtn')?.addEventListener('click', () => this.openVoiceModal());

        // Command Palette Button
        document.getElementById('cmdPaletteBtn')?.addEventListener('click', () => this.cmdPalette.open());

        // Theme Dropdown Toggle
        const themeBtn = document.getElementById('themeMenuBtn');
        const themeDropdown = document.getElementById('themeDropdown');

        themeBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            themeDropdown.classList.toggle('show');
        });

        themeDropdown?.addEventListener('click', (e) => {
            const item = e.target.closest('.dropdown-item');
            if (item) {
                const theme = item.getAttribute('data-theme');
                if (theme) this.setTheme(theme);
                themeDropdown.classList.remove('show');
            }
        });

        // Settings Dropdown
        const settingsBtn = document.getElementById('settingsDropdownBtn');
        const settingsDropdown = document.getElementById('settingsDropdown');

        settingsBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsDropdown.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            themeDropdown?.classList.remove('show');
            settingsDropdown?.classList.remove('show');
        });

        // Data Management Settings Actions
        document.getElementById('exportDataBtn')?.addEventListener('click', () => StorageManager.exportData());
        
        document.getElementById('importDataBtn')?.addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });

        document.getElementById('importFileInput')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                const success = StorageManager.importData(evt.target.result);
                if (success) {
                    this.showToast('Data imported successfully!', 'success');
                    location.reload();
                } else {
                    this.showToast('Failed to import invalid file', 'error');
                }
            };
            reader.readAsText(file);
        });

        document.getElementById('loadDemoDataBtn')?.addEventListener('click', () => this.loadDemoData());

        document.getElementById('clearAllDataBtn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete ALL tasks and reset data?')) {
                StorageManager.clearAll();
                this.taskManager = new TaskManager();
                this.showToast('All tasks cleared', 'warning');
                this.renderCurrentView();
            }
        });

        // Sound Toggle
        document.getElementById('soundToggleBtn')?.addEventListener('click', () => {
            this.taskManager.settings.soundEnabled = !this.taskManager.settings.soundEnabled;
            StorageManager.saveSettings(this.taskManager.settings);
            const icon = document.getElementById('soundIcon');
            if (this.taskManager.settings.soundEnabled) {
                icon.className = 'fa-solid fa-volume-high';
                this.showToast('Sound effects enabled');
            } else {
                icon.className = 'fa-solid fa-volume-xmark';
                this.showToast('Sound effects muted');
            }
        });

        // Pomodoro Timer Controls
        document.getElementById('pomoStartBtn')?.addEventListener('click', () => {
            this.timer.start();
            document.getElementById('pomoStartBtn').classList.add('hidden');
            document.getElementById('pomoPauseBtn').classList.remove('hidden');
        });
        document.getElementById('pomoPauseBtn')?.addEventListener('click', () => {
            this.timer.pause();
            document.getElementById('pomoPauseBtn').classList.add('hidden');
            document.getElementById('pomoStartBtn').classList.remove('hidden');
        });
        document.getElementById('pomoResetBtn')?.addEventListener('click', () => {
            this.timer.reset();
            document.getElementById('pomoPauseBtn').classList.add('hidden');
            document.getElementById('pomoStartBtn').classList.remove('hidden');
        });

        // Pomodoro Mode Selector
        document.querySelectorAll('.pomo-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.pomo-mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const mode = btn.getAttribute('data-pomo-mode');
                this.timer.setMode(mode);
                document.getElementById('pomoPauseBtn').classList.add('hidden');
                document.getElementById('pomoStartBtn').classList.remove('hidden');
            });
        });

        // Pomodoro Linked Task Select
        document.getElementById('pomoTaskSelect')?.addEventListener('change', (e) => {
            const taskId = e.target.value;
            this.timer.linkTask(taskId);
            const task = this.taskManager.tasks.find(t => t.id === taskId);
            const nameEl = document.getElementById('pomoActiveTaskName');
            if (nameEl) nameEl.textContent = task ? `Task: ${task.title}` : 'Select a task to link focus';
        });

        // Category Modal Create
        document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
            document.getElementById('categoryModalBackdrop').classList.remove('hidden');
        });

        document.getElementById('closeCategoryModalBtn')?.addEventListener('click', () => {
            document.getElementById('categoryModalBackdrop').classList.add('hidden');
        });

        document.getElementById('cancelCategoryModalBtn')?.addEventListener('click', () => {
            document.getElementById('categoryModalBackdrop').classList.add('hidden');
        });

        // Category Color Dot Selector
        document.querySelectorAll('#catColorGrid .color-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                document.querySelectorAll('#catColorGrid .color-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
            });
        });

        document.getElementById('categoryForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('catNameInput').value.trim();
            const activeColorDot = document.querySelector('#catColorGrid .color-dot.active');
            const color = activeColorDot ? activeColorDot.getAttribute('data-color') : '#6366f1';

            if (name) {
                this.taskManager.addCategory(name, color);
                document.getElementById('categoryModalBackdrop').classList.add('hidden');
                document.getElementById('catNameInput').value = '';
                this.showToast(`Category "${name}" created!`, 'success');
                this.ui.renderCategoryNav();
            }
        });

        // Shortcuts Modal
        document.getElementById('closeShortcutsModalBtn')?.addEventListener('click', () => {
            document.getElementById('shortcutsModalBackdrop').classList.add('hidden');
        });

        // Global Keyboard Shortcuts (N, /, Ctrl+K, D, ?, ESC)
        document.addEventListener('keydown', (e) => {
            const activeElem = document.activeElement;
            const isInput = activeElem.tagName === 'INPUT' || activeElem.tagName === 'TEXTAREA' || activeElem.tagName === 'SELECT';

            // Ctrl + K or Cmd + K -> Command Palette
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                this.cmdPalette.open();
                return;
            }

            // ESC -> Close all active modals
            if (e.key === 'Escape') {
                this.closeTaskModal();
                this.closeVoiceModal();
                this.cmdPalette.close();
                document.getElementById('shortcutsModalBackdrop')?.classList.add('hidden');
                document.getElementById('categoryModalBackdrop')?.classList.add('hidden');
                return;
            }

            if (isInput) return; // Skip single key shortcuts when typing in inputs

            if (e.key.toLowerCase() === 'n') {
                e.preventDefault();
                this.openTaskModal();
            } else if (e.key === '/') {
                e.preventDefault();
                document.getElementById('searchInput')?.focus();
            } else if (e.key.toLowerCase() === 'd') {
                e.preventDefault();
                const currentTheme = document.documentElement.getAttribute('data-theme');
                this.setTheme(currentTheme === 'dark' ? 'light' : 'dark');
            } else if (e.key === '?') {
                e.preventDefault();
                document.getElementById('shortcutsModalBackdrop')?.classList.remove('hidden');
            }
        });
    }
}

// Bootstrap Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TaskFlowApp();
});
