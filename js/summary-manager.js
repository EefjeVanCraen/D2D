// Summary Manager - Handles weekly summaries
class SummaryManager {
    constructor() {
        this.init();
    }

    init() {
        this.checkAndCreateSummary();
        this.renderSummaries();
        // Check every hour if it's Friday 5 PM CET
        setInterval(() => this.checkAndCreateSummary(), 3600000);
    }

    checkAndCreateSummary() {
        const now = new Date();
        const cetTime = this.getCETTime(now);
        
        // Check if it's Friday (5) and time is 5 PM (17:00)
        if (cetTime.getDay() === 5 && cetTime.getHours() === 17) {
            // Check if summary was already created today
            const today = cetTime.toISOString().split('T')[0];
            const existing = dataManager.getSummaries().find(s => {
                const summaryDate = new Date(s.created).toISOString().split('T')[0];
                return summaryDate === today;
            });

            if (!existing) {
                this.createWeeklySummary();
            }
        }
    }

    getCETTime(date) {
        // CET is UTC+1 (or UTC+2 during DST)
        // Simple approximation - in production, use a proper timezone library
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        const cet = utc + (3600000 * 1); // UTC+1
        return new Date(cet);
    }

    createWeeklySummary() {
        const tasks = dataManager.getTasks();
        const ideas = dataManager.getIdeas();
        
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        // Get completed tasks this week
        const completedTasks = tasks.filter(task => {
            if (task.status !== 'completed') return false;
            if (!task.updated) return false;
            const completedDate = new Date(task.updated);
            return completedDate >= weekStart && completedDate <= weekEnd;
        });

        // Get active tasks
        const activeTasks = tasks.filter(task => task.status === 'active');

        // Build summary content
        let content = '## Weekly Summary\n\n';
        
        content += '### Completed Tasks\n';
        if (completedTasks.length === 0) {
            content += '- No tasks completed this week\n';
        } else {
            completedTasks.forEach(task => {
                content += `- ${task.headline}`;
                if (task.tag) content += ` [${task.tag}]`;
                content += '\n';
            });
        }

        content += '\n### Active Tasks\n';
        if (activeTasks.length === 0) {
            content += '- No active tasks\n';
        } else {
            activeTasks.forEach(task => {
                content += `- ${task.headline}`;
                if (task.dueDate) content += ` (Due: ${new Date(task.dueDate).toLocaleDateString()})`;
                if (task.tag) content += ` [${task.tag}]`;
                content += '\n';
            });
        }

        content += '\n### Ideas\n';
        if (ideas.length === 0) {
            content += '- No ideas recorded\n';
        } else {
            ideas.forEach(idea => {
                content += `- ${idea.headline}`;
                if (idea.tag) content += ` [${idea.tag}]`;
                content += '\n';
            });
        }

        const summary = {
            headline: `Weekly Summary - ${weekStart.toLocaleDateString()} to ${weekEnd.toLocaleDateString()}`,
            content: content,
            weekStart: weekStart.toISOString(),
            weekEnd: weekEnd.toISOString()
        };

        dataManager.addSummary(summary);
        this.renderSummaries();
        widgetManager.refreshWidgets();
    }

    openSummary(summaryId) {
        const summary = dataManager.getSummaries().find(s => s.id === summaryId);
        if (!summary) return;

        const content = summary.content.replace(/\n/g, '<br>').replace(/##/g, '<h2>').replace(/###/g, '<h3>');
        
        alert(`Summary:\n\n${summary.content}`);
        // In a full implementation, this would open a modal with formatted content
    }

    renderSummaries() {
        const container = document.getElementById('summaries-list');
        if (!container) return;

        const summaries = dataManager.getSummaries();
        
        // Sort chronologically (newest first)
        const sorted = summaries.sort((a, b) => new Date(b.created) - new Date(a.created));

        container.innerHTML = '';

        if (sorted.length === 0) {
            container.innerHTML = '<p>No summaries yet. Summaries are automatically created every Friday at 5 PM CET.</p>';
            return;
        }

        sorted.forEach(summary => {
            const card = document.createElement('div');
            card.className = 'summary-card';
            
            const createdDate = new Date(summary.created).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            card.innerHTML = `
                <div class="card-header">
                    <div>
                        <div class="card-title">${summary.headline}</div>
                        <div class="card-meta">
                            <span>Created: ${createdDate}</span>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="card-btn" onclick="summaryManager.openSummary('${summary.id}')" title="View">👁️</button>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });
    }
}

const summaryManager = new SummaryManager();









