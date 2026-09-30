/**
 * TaskFlow Pro - Analytics & Charting Module
 * Renders interactive Chart.js graphs for productivity stats.
 */

class AnalyticsDashboard {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.activityChart = null;
        this.priorityChart = null;
        this.categoryChart = null;
    }

    renderAll() {
        this.renderStatsSummary();
        this.renderActivityChart();
        this.renderPriorityChart();
        this.renderCategoryChart();
    }

    renderStatsSummary() {
        const tasks = this.taskManager.tasks;
        const totalCreated = this.taskManager.stats.totalCreated || tasks.length;
        const totalCompleted = tasks.filter(t => t.completed).length;
        const rate = tasks.length > 0 ? Math.round((totalCompleted / tasks.length) * 100) : 0;
        const totalFocusHours = (this.taskManager.stats.totalFocusSeconds / 3600).toFixed(1);

        document.getElementById('statTotalCreated').textContent = totalCreated;
        document.getElementById('statTotalCompleted').textContent = totalCompleted;
        document.getElementById('statCompletionRate').textContent = `${rate}%`;
        document.getElementById('statFocusTime').textContent = `${totalFocusHours} hrs`;
    }

    renderActivityChart() {
        const ctx = document.getElementById('activityChart')?.getContext('2d');
        if (!ctx) return;

        // Generate past 7 days labels
        const days = [];
        const completedCounts = [];
        const createdCounts = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            days.push(dayLabel);

            // Count tasks completed on or due on this date
            const completed = this.taskManager.tasks.filter(t => t.completed && t.dueDate === dateStr).length;
            const created = this.taskManager.tasks.filter(t => t.createdAt && t.createdAt.startsWith(dateStr)).length;

            completedCounts.push(completed);
            createdCounts.push(created);
        }

        if (this.activityChart) this.activityChart.destroy();

        this.activityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [
                    {
                        label: 'Tasks Completed',
                        data: completedCounts,
                        backgroundColor: '#10b981',
                        borderRadius: 6
                    },
                    {
                        label: 'Tasks Created',
                        data: createdCounts,
                        backgroundColor: '#6366f1',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: 'rgba(255,255,255,0.7)' } }
                },
                scales: {
                    x: { ticks: { color: 'rgba(255,255,255,0.6)' }, grid: { display: false } },
                    y: { ticks: { color: 'rgba(255,255,255,0.6)', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.08)' } }
                }
            }
        });
    }

    renderPriorityChart() {
        const ctx = document.getElementById('priorityChart')?.getContext('2d');
        if (!ctx) return;

        const tasks = this.taskManager.tasks;
        const counts = {
            urgent: tasks.filter(t => t.priority === 'urgent').length,
            high: tasks.filter(t => t.priority === 'high').length,
            medium: tasks.filter(t => t.priority === 'medium').length,
            low: tasks.filter(t => t.priority === 'low').length
        };

        if (this.priorityChart) this.priorityChart.destroy();

        this.priorityChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Urgent', 'High', 'Medium', 'Low'],
                datasets: [{
                    data: [counts.urgent, counts.high, counts.medium, counts.low],
                    backgroundColor: ['#ef4444', '#f59e0b', '#6366f1', '#10b981'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.7)' } }
                }
            }
        });
    }

    renderCategoryChart() {
        const ctx = document.getElementById('categoryChart')?.getContext('2d');
        if (!ctx) return;

        const categories = this.taskManager.categories;
        const labels = categories.map(c => c.name);
        const colors = categories.map(c => c.color);
        const data = categories.map(c => this.taskManager.tasks.filter(t => t.category === c.id).length);

        if (this.categoryChart) this.categoryChart.destroy();

        this.categoryChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.7)' } }
                }
            }
        });
    }
}
