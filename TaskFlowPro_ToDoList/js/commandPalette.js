/**
 * TaskFlow Pro - Command Palette (Ctrl + K)
 * Fast command launcher and global search modal.
 */

class CommandPalette {
    constructor(app) {
        this.app = app;
        this.backdrop = document.getElementById('cmdPaletteBackdrop');
        this.input = document.getElementById('cmdPaletteInput');
        this.resultsContainer = document.getElementById('cmdPaletteResults');
        this.selectedIndex = 0;
        this.currentItems = [];

        this.setupEventListeners();
    }

    setupEventListeners() {
        if (!this.input) return;

        this.input.addEventListener('input', () => this.filterAndRender());

        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigate(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigate(-1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.executeSelection();
            } else if (e.key === 'Escape') {
                this.close();
            }
        });

        if (this.backdrop) {
            this.backdrop.addEventListener('click', (e) => {
                if (e.target === this.backdrop) this.close();
            });
        }
    }

    open() {
        if (!this.backdrop) return;
        this.backdrop.classList.remove('hidden');
        this.input.value = '';
        this.selectedIndex = 0;
        this.filterAndRender();
        setTimeout(() => this.input.focus(), 50);
    }

    close() {
        if (!this.backdrop) return;
        this.backdrop.classList.add('hidden');
    }

    getCommands() {
        const commands = [
            { icon: 'fa-plus', label: 'Create New Task', action: () => this.app.openTaskModal() },
            { icon: 'fa-inbox', label: 'Go to All Tasks', action: () => this.app.switchView('all') },
            { icon: 'fa-star text-warning', label: 'Go to Today Tasks', action: () => this.app.switchView('today') },
            { icon: 'fa-calendar-days text-info', label: 'Go to Upcoming Tasks', action: () => this.app.switchView('upcoming') },
            { icon: 'fa-grip-vertical', label: 'Open Kanban Board', action: () => this.app.switchView('kanban') },
            { icon: 'fa-table-cells-large', label: 'Open Eisenhower Matrix', action: () => this.app.switchView('matrix') },
            { icon: 'fa-calendar-month', label: 'Open Calendar View', action: () => this.app.switchView('calendar') },
            { icon: 'fa-stopwatch text-danger', label: 'Open Focus Pomodoro Timer', action: () => this.app.switchView('pomodoro') },
            { icon: 'fa-chart-pie text-success', label: 'Open Analytics Dashboard', action: () => this.app.switchView('analytics') },
            { icon: 'fa-moon', label: 'Switch Theme: Dark Neon', action: () => this.app.setTheme('dark') },
            { icon: 'fa-sun', label: 'Switch Theme: Light Clean', action: () => this.app.setTheme('light') },
            { icon: 'fa-bolt text-warning', label: 'Switch Theme: Cyberpunk', action: () => this.app.setTheme('cyberpunk') },
            { icon: 'fa-tree text-success', label: 'Switch Theme: Emerald Forest', action: () => this.app.setTheme('forest') },
            { icon: 'fa-file-export', label: 'Export Data Backup (JSON)', action: () => StorageManager.exportData() },
            { icon: 'fa-wand-magic-sparkles text-accent', label: 'Load Demo Tasks', action: () => this.app.loadDemoData() }
        ];

        // Also include matching task search items
        const taskMatches = this.app.taskManager.tasks.map(t => ({
            icon: t.completed ? 'fa-circle-check text-success' : 'fa-circle-notch',
            label: `Task: ${t.title}`,
            action: () => this.app.openTaskModal(t.id)
        }));

        return [...commands, ...taskMatches];
    }

    filterAndRender() {
        const query = this.input.value.toLowerCase().trim();
        const allCommands = this.getCommands();

        if (query === '') {
            this.currentItems = allCommands.slice(0, 10);
        } else {
            this.currentItems = allCommands.filter(c => c.label.toLowerCase().includes(query)).slice(0, 10);
        }

        this.selectedIndex = 0;
        this.render();
    }

    render() {
        if (!this.resultsContainer) return;
        if (this.currentItems.length === 0) {
            this.resultsContainer.innerHTML = `<div class="p-3 text-center text-muted">No commands or tasks found</div>`;
            return;
        }

        this.resultsContainer.innerHTML = this.currentItems.map((item, index) => `
            <div class="cmd-item ${index === this.selectedIndex ? 'selected' : ''}" data-index="${index}">
                <div class="cmd-item-left">
                    <i class="fa-solid ${item.icon}"></i>
                    <span>${item.label}</span>
                </div>
                <i class="fa-solid fa-angle-right text-muted"></i>
            </div>
        `).join('');

        this.resultsContainer.querySelectorAll('.cmd-item').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.getAttribute('data-index'));
                this.selectedIndex = idx;
                this.executeSelection();
            });
        });
    }

    navigate(direction) {
        if (this.currentItems.length === 0) return;
        this.selectedIndex = (this.selectedIndex + direction + this.currentItems.length) % this.currentItems.length;
        this.render();
    }

    executeSelection() {
        const item = this.currentItems[this.selectedIndex];
        if (item && item.action) {
            this.close();
            item.action();
        }
    }
}
