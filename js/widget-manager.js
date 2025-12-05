// Widget Manager - Handles draggable and resizable widgets
class WidgetManager {
    constructor() {
        this.widgets = [];
        this.draggedWidget = null;
        this.dragOffset = { x: 0, y: 0 };
        this.resizingWidget = null;
        this.init();
    }

    init() {
        this.loadWidgets();
        this.setupEventListeners();
    }

    loadWidgets() {
        const widgets = dataManager.getWidgets();
        this.widgets = widgets;
        this.renderWidgets();
    }

    renderWidgets() {
        const workspace = document.getElementById('dashboard-workspace');
        if (!workspace) return;

        workspace.innerHTML = '';
        
        this.widgets.forEach(widget => {
            const widgetElement = this.createWidgetElement(widget);
            workspace.appendChild(widgetElement);
        });
        
        // Update workspace height after rendering
        setTimeout(() => this.updateWorkspaceHeight(), 100);
    }

    createWidgetElement(widget) {
        const div = document.createElement('div');
        div.className = 'widget';
        div.id = `widget-${widget.id}`;
        div.style.left = widget.x + 'px';
        div.style.top = widget.y + 'px';
        div.style.width = widget.width + 'px';
        div.style.height = widget.height + 'px';

        const content = this.getWidgetContent(widget);
        div.innerHTML = `
            <div class="widget-header">
                <div class="widget-title">${widget.title || this.getWidgetTitle(widget.type)}</div>
                <div class="widget-actions">
                    <button class="widget-btn" onclick="widgetManager.openWidgetSettings('${widget.id}')" title="Settings">⚙️</button>
                    <button class="widget-btn" onclick="widgetManager.deleteWidget('${widget.id}')" title="Delete">×</button>
                </div>
            </div>
            <div class="widget-content">
                ${content}
            </div>
            <div class="widget-resize"></div>
        `;

        this.attachWidgetEvents(div, widget);
        return div;
    }

    getWidgetTitle(type) {
        const titles = {
            'calendar': 'Calendar',
            'tasks-today': 'Tasks Due Today',
            'tasks-week': 'Tasks This Week',
            'tasks-all': 'All Tasks',
            'tasks-active': 'Active Tasks',
            'tasks-completed': 'Completed Tasks',
            'tasks-overdue': 'Overdue Tasks',
            'ideas': 'Ideas',
            'ideas-recent': 'Recent Ideas',
            'meetings': 'Meetings',
            'org-charts': 'Org Charts',
            'summaries': 'Weekly Summaries',
            'birthdays': 'Birthdays',
            'asana': 'Asana'
        };
        return titles[type] || 'Widget';
    }

    getWidgetContent(widget) {
        switch (widget.type) {
            case 'calendar':
                return this.getCalendarContent();
            case 'tasks-today':
                return this.getTasksTodayContent();
            case 'tasks-week':
                return this.getTasksWeekContent();
            case 'tasks-all':
                return this.getTasksAllContent();
            case 'tasks-active':
                return this.getTasksActiveContent();
            case 'tasks-completed':
                return this.getTasksCompletedContent();
            case 'tasks-overdue':
                return this.getTasksOverdueContent();
            case 'ideas':
                return this.getIdeasContent();
            case 'ideas-recent':
                return this.getIdeasRecentContent();
            case 'meetings':
                return this.getMeetingsContent();
            case 'org-charts':
                return this.getOrgChartsContent();
            case 'summaries':
                return this.getSummariesContent();
            case 'birthdays':
                return this.getBirthdaysContent();
            case 'asana':
                return this.getAsanaContent();
            default:
                return '<p>Widget content</p>';
        }
    }

    getCalendarContent() {
        const allTasks = dataManager.getTasks();
        const tasks = this.getActiveTasks(allTasks);
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        let calendarHTML = `
            <div class="calendar-header">
                <button class="calendar-nav-btn" onclick="widgetManager.prevMonth()">‹</button>
                <span id="calendar-month-year">${today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                <button class="calendar-nav-btn" onclick="widgetManager.nextMonth()">›</button>
            </div>
            <div class="calendar-grid">
        `;

        // Day headers
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            calendarHTML += `<div class="calendar-day-header">${day}</div>`;
        });

        // Empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            calendarHTML += '<div class="calendar-day"></div>';
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTasks = tasks.filter(t => t.dueDate === dateStr && t.status !== 'completed');
            const isToday = day === today.getDate() && currentMonth === today.getMonth();
            
            calendarHTML += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${dayTasks.length > 0 ? 'has-tasks' : ''}" 
                     data-date="${dateStr}">
                    ${day}
                </div>
            `;
        }

        calendarHTML += '</div>';

        // Task counters
        const activeTasks = tasks.filter(t => t.status === 'active').length;
        const weekTasks = this.getTasksDueThisWeek(tasks).length;
        const overdueTasks = this.getOverdueTasks(tasks).length;

        calendarHTML += `
            <div class="task-counters">
                <div class="counter-item">
                    <div class="counter-label">Active</div>
                    <div class="counter-value">${activeTasks}</div>
                </div>
                <div class="counter-item">
                    <div class="counter-label">Due This Week</div>
                    <div class="counter-value">${weekTasks}</div>
                </div>
                <div class="counter-item">
                    <div class="counter-label">Overdue</div>
                    <div class="counter-value">${overdueTasks}</div>
                </div>
            </div>
        `;

        return calendarHTML;
    }

    getTasksTodayContent() {
        const allTasks = dataManager.getTasks();
        const tasks = this.getActiveTasks(allTasks);
        const today = new Date().toISOString().split('T')[0];
        let todayTasks = tasks.filter(t => t.dueDate === today && t.status !== 'completed');
        
        // Apply department filter if set
        if (window.currentDeptFilter) {
            todayTasks = todayTasks.filter(t => {
                const depts = Array.isArray(t.departments) ? t.departments : 
                    (t.department ? [t.department] : []);
                return depts.includes(window.currentDeptFilter) || 
                    depts.some(d => {
                        const dept = dataManager.getDepartments().find(dep => dep.id === d || dep.name === d);
                        return dept && (dept.id === window.currentDeptFilter || dept.name === window.currentDeptFilter);
                    });
            });
        }

        if (todayTasks.length === 0) {
            return '<p>No tasks due today.</p>';
        }

        let html = '';
        todayTasks.forEach(task => {
            html += `
                <div class="task-item" data-task-id="${task.id}" style="cursor: pointer;">
                    <div class="task-headline">${task.headline || 'Untitled Task'}</div>
                    ${this.renderAllTags(task)}
                </div>
            `;
        });

        return html;
    }

    getTasksWeekContent() {
        // Get fresh tasks from data manager
        const allTasks = dataManager.getTasks();
        
        // Filter out deleted tasks using helper function
        const tasks = this.getActiveTasks(allTasks);
        
        let weekTasks = this.getTasksDueThisWeek(tasks);
        
        // Apply department filter if set
        if (window.currentDeptFilter) {
            weekTasks = weekTasks.filter(t => {
                const depts = Array.isArray(t.departments) ? t.departments : 
                    (t.department ? [t.department] : []);
                return depts.includes(window.currentDeptFilter) || 
                    depts.some(d => {
                        const dept = dataManager.getDepartments().find(dep => dep.id === d || dep.name === d);
                        return dept && (dept.id === window.currentDeptFilter || dept.name === window.currentDeptFilter);
                    });
            });
        }

        if (weekTasks.length === 0) {
            return '<p>No tasks due this week.</p>';
        }

        let html = '';
        weekTasks.forEach(task => {
            html += `
                <div class="task-item" data-task-id="${task.id}" style="cursor: pointer;">
                    <div class="task-headline">${task.headline || 'Untitled Task'}</div>
                    <div class="task-meta">Due: ${new Date(task.dueDate).toLocaleDateString()}</div>
                    ${this.renderAllTags(task)}
                </div>
            `;
        });

        return html;
    }

    getSummariesContent() {
        const summaries = dataManager.getSummaries();
        const sorted = summaries.sort((a, b) => new Date(b.created) - new Date(a.created));

        if (sorted.length === 0) {
            return '<p>No summaries yet.</p>';
        }

        let html = '';
        sorted.slice(0, 5).forEach(summary => {
            const date = new Date(summary.created).toLocaleDateString();
            html += `
                <div class="summary-item" onclick="summaryManager.openSummary('${summary.id}')">
                    <div class="summary-headline">${summary.headline || 'Weekly Summary'}</div>
                    <div class="summary-date">${date}</div>
                </div>
            `;
        });

        return html;
    }

    getTasksAllContent() {
        const allTasks = dataManager.getTasks();
        const tasks = this.getActiveTasks(allTasks);
        const filtered = window.currentDeptFilter ? 
            tasks.filter(t => {
                const depts = Array.isArray(t.departments) ? t.departments : 
                    (t.department ? [t.department] : []);
                // Check if filter matches by ID or name
                return depts.includes(window.currentDeptFilter) || 
                    depts.some(d => {
                        const dept = dataManager.getDepartments().find(dep => dep.id === d || dep.name === d);
                        return dept && (dept.id === window.currentDeptFilter || dept.name === window.currentDeptFilter);
                    });
            }) : 
            tasks;

        if (filtered.length === 0) {
            return '<p>No tasks found.</p>';
        }

        let html = '';
        filtered.slice(0, 10).forEach(task => {
            const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
            html += `
                <div class="task-item" data-task-id="${task.id}" style="cursor: pointer;">
                    <div class="task-headline">${task.headline || 'Untitled Task'}</div>
                    <div class="task-meta">Due: ${dueDate} | ${task.status || 'active'}</div>
                    ${this.renderAllTags(task)}
                </div>
            `;
        });

        return html;
    }

    getTasksActiveContent() {
        const allTasks = dataManager.getTasks();
        const activeTasks = this.getActiveTasks(allTasks).filter(t => t.status === 'active');
        const filtered = window.currentDeptFilter ? 
            activeTasks.filter(t => {
                const depts = Array.isArray(t.departments) ? t.departments : 
                    (t.department ? [t.department] : []);
                return depts.includes(window.currentDeptFilter) || 
                    depts.some(d => {
                        const dept = dataManager.getDepartments().find(dep => dep.id === d || dep.name === d);
                        return dept && (dept.id === window.currentDeptFilter || dept.name === window.currentDeptFilter);
                    });
            }) : 
            activeTasks;

        if (filtered.length === 0) {
            return '<p>No active tasks.</p>';
        }

        let html = '';
        filtered.slice(0, 10).forEach(task => {
            const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
            html += `
                <div class="task-item" data-task-id="${task.id}" style="cursor: pointer;">
                    <div class="task-headline">${task.headline || 'Untitled Task'}</div>
                    <div class="task-meta">Due: ${dueDate}</div>
                    ${this.renderAllTags(task)}
                </div>
            `;
        });

        return html;
    }

    getTasksCompletedContent() {
        const allTasks = dataManager.getTasks();
        const completedTasks = this.getActiveTasks(allTasks).filter(t => t.status === 'completed');
        const filtered = window.currentDeptFilter ? 
            completedTasks.filter(t => {
                const depts = Array.isArray(t.departments) ? t.departments : 
                    (t.department ? [t.department] : []);
                return depts.includes(window.currentDeptFilter) || 
                    depts.some(d => {
                        const dept = dataManager.getDepartments().find(dep => dep.id === d || dep.name === d);
                        return dept && (dept.id === window.currentDeptFilter || dept.name === window.currentDeptFilter);
                    });
            }) : 
            completedTasks;

        if (filtered.length === 0) {
            return '<p>No completed tasks.</p>';
        }

        let html = '';
        filtered.slice(0, 10).forEach(task => {
            const completedDate = task.updated ? new Date(task.updated).toLocaleDateString() : '';
            html += `
                <div class="task-item" data-task-id="${task.id}" style="cursor: pointer;">
                    <div class="task-headline" style="text-decoration: line-through; opacity: 0.7;">${task.headline || 'Untitled Task'}</div>
                    <div class="task-meta">Completed: ${completedDate}</div>
                    ${this.renderAllTags(task)}
                </div>
            `;
        });

        return html;
    }

    getTasksOverdueContent() {
        const allTasks = dataManager.getTasks();
        const tasks = this.getActiveTasks(allTasks);
        const overdueTasks = tasks.filter(task => {
            if (!task.dueDate || task.status === 'completed') return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate < today;
        });

        const filtered = window.currentDeptFilter ? 
            overdueTasks.filter(t => {
                const depts = Array.isArray(t.departments) ? t.departments : 
                    (t.department ? [t.department] : []);
                return depts.includes(window.currentDeptFilter) || 
                    depts.some(d => {
                        const dept = dataManager.getDepartments().find(dep => dep.id === d || dep.name === d);
                        return dept && (dept.id === window.currentDeptFilter || dept.name === window.currentDeptFilter);
                    });
            }) : 
            overdueTasks;

        if (filtered.length === 0) {
            return '<p>No overdue tasks. Great job!</p>';
        }

        // Sort by how overdue (most overdue first)
        filtered.sort((a, b) => {
            const dateA = new Date(a.dueDate);
            const dateB = new Date(b.dueDate);
            return dateA - dateB;
        });

        let html = '';
        filtered.slice(0, 10).forEach(task => {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);
            const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
            
            html += `
                <div class="task-item overdue" data-task-id="${task.id}" style="cursor: pointer;">
                    <div class="task-headline">
                        ${task.headline || 'Untitled Task'}
                        <span class="badge badge-danger" style="margin-left: 8px; font-size: 10px;">${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue</span>
                    </div>
                    <div class="task-meta">Due: ${new Date(task.dueDate).toLocaleDateString()}</div>
                    ${this.renderAllTags(task)}
                </div>
            `;
        });

        return html;
    }

    getIdeasContent() {
        const ideas = dataManager.getIdeas();
        const filtered = window.currentDeptFilter ? 
            ideas.filter(i => {
                const depts = Array.isArray(i.departments) ? i.departments : 
                    (i.department ? [i.department] : []);
                return depts.includes(window.currentDeptFilter) || 
                    depts.some(d => {
                        const dept = dataManager.getDepartments().find(dep => dep.id === d || dep.name === d);
                        return dept && (dept.id === window.currentDeptFilter || dept.name === window.currentDeptFilter);
                    });
            }) : 
            ideas;

        if (filtered.length === 0) {
            return '<p>No ideas found.</p>';
        }

        let html = '';
        filtered.slice(0, 10).forEach(idea => {
            const createdDate = new Date(idea.created).toLocaleDateString();
            html += `
                <div class="idea-item" onclick="ideaManager.openIdea('${idea.id}')">
                    <div class="idea-headline">${idea.headline}</div>
                    <div class="idea-meta">Created: ${createdDate}</div>
                    ${this.renderAllTags(idea)}
                </div>
            `;
        });

        return html;
    }

    getIdeasRecentContent() {
        const ideas = dataManager.getIdeas();
        const sorted = ideas.sort((a, b) => new Date(b.created) - new Date(a.created));
        const filtered = window.currentDeptFilter ? 
            sorted.filter(i => {
                const depts = Array.isArray(i.departments) ? i.departments : 
                    (i.department ? [i.department] : []);
                return depts.includes(window.currentDeptFilter) || 
                    depts.some(d => {
                        const dept = dataManager.getDepartments().find(dep => dep.id === d || dep.name === d);
                        return dept && (dept.id === window.currentDeptFilter || dept.name === window.currentDeptFilter);
                    });
            }) : 
            sorted;

        if (filtered.length === 0) {
            return '<p>No recent ideas.</p>';
        }

        let html = '';
        filtered.slice(0, 5).forEach(idea => {
            const createdDate = new Date(idea.created).toLocaleDateString();
            html += `
                <div class="idea-item" onclick="ideaManager.openIdea('${idea.id}')">
                    <div class="idea-headline">${idea.headline}</div>
                    <div class="idea-meta">Created: ${createdDate}</div>
                    ${this.renderAllTags(idea)}
                </div>
            `;
        });

        return html;
    }

    getBirthdaysContent() {
        const birthdays = dataManager.getBirthdays();
        
        if (birthdays.length === 0) {
            return '<p>No birthdays recorded.</p>';
        }

        // Sort by next occurrence
        const today = new Date();
        const sorted = birthdays.sort((a, b) => {
            const dateA = this.getNextBirthdayDate(a.date);
            const dateB = this.getNextBirthdayDate(b.date);
            return dateA - dateB;
        });

        let html = '';
        sorted.slice(0, 10).forEach(birthday => {
            const nextDate = this.getNextBirthdayDate(birthday.date);
            const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
            html += `
                <div class="birthday-item">
                    <div class="birthday-name">${birthday.name}</div>
                    <div class="birthday-meta">${daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}</div>
                </div>
            `;
        });

        return html;
    }

    getNextBirthdayDate(dateStr) {
        const today = new Date();
        const [year, month, day] = dateStr.split('-').map(Number);
        const thisYear = new Date(today.getFullYear(), month - 1, day);
        const nextYear = new Date(today.getFullYear() + 1, month - 1, day);
        
        if (thisYear >= today) {
            return thisYear;
        } else {
            return nextYear;
        }
    }

    getMeetingsContent() {
        const meetings = dataManager.getMeetings();
        const filtered = window.currentDeptFilter ? 
            meetings.filter(m => {
                if (!m.department) return false;
                return m.department === window.currentDeptFilter;
            }) : 
            meetings;

        if (filtered.length === 0) {
            return '<p>No meetings found.</p>';
        }

        // Sort by date (upcoming first)
        const sorted = filtered.sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            return dateA - dateB;
        });

        let html = '';
        sorted.slice(0, 10).forEach(meeting => {
            const date = meeting.date ? new Date(meeting.date).toLocaleDateString() : 'No date';
            const internalExternal = meeting.internalExternal || 'Internal';
            const dept = meeting.department ? this.getDepartmentName(meeting.department) : '';
            
            html += `
                <div class="meeting-card" style="margin-bottom: 10px; padding: 10px; background: #f9fafb; border-radius: 6px; cursor: pointer;" onclick="meetingManager.openMeeting('${meeting.id}')">
                    <div style="font-weight: 600; margin-bottom: 4px;">${meeting.title}</div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">
                        <span>${date}</span>
                        <span class="badge ${internalExternal === 'Internal' ? 'badge-success' : 'badge-warning'}" style="margin-left: 8px; padding: 2px 6px; font-size: 10px;">${internalExternal}</span>
                    </div>
                    ${this.renderAllTags(meeting)}
                </div>
            `;
        });

        return html;
    }

    getOrgChartsContent() {
        const orgCharts = dataManager.getOrgCharts();
        
        if (orgCharts.length === 0) {
            return '<p>No org charts found.</p>';
        }

        let html = '';
        orgCharts.slice(0, 10).forEach(chart => {
            const positionCount = chart.positions ? chart.positions.length : 0;
            html += `
                <div class="org-chart-card" style="margin-bottom: 10px; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; cursor: pointer; color: white;" onclick="app.showSection('org-charts'); setTimeout(() => orgChartManager.viewOrgChart('${chart.id}'), 100);">
                    <div style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">${chart.name}</div>
                    <div style="font-size: 11px; opacity: 0.9;">
                        ${positionCount} position${positionCount !== 1 ? 's' : ''}
                        ${chart.description ? ` • ${chart.description.substring(0, 50)}${chart.description.length > 50 ? '...' : ''}` : ''}
                    </div>
                </div>
            `;
        });

        return html;
    }

    getDepartmentName(deptId) {
        const departments = dataManager.getDepartments();
        for (const dept of departments) {
            if (dept.id === deptId) return dept.name;
            if (dept.subDepartments) {
                const subDept = dept.subDepartments.find(sd => sd.id === deptId);
                if (subDept) return `${dept.name} > ${subDept.name}`;
            }
        }
        return '';
    }

    renderAllTags(item) {
        // item can be task, idea, or meeting
        let tagsHtml = '';
        
        // Render departments/sub-departments
        const depts = Array.isArray(item.departments) ? item.departments : 
            (item.department ? [item.department] : []);
        
        depts.forEach(deptId => {
            const deptName = this.getDepartmentName(deptId);
            if (deptName) {
                tagsHtml += `<span class="badge badge-info" style="margin-right: 4px; margin-top: 4px; display: inline-block; font-size: 10px; padding: 2px 6px;">${deptName}</span>`;
            }
        });
        
        // Render people
        const people = Array.isArray(item.people) ? item.people : [];
        people.forEach(person => {
            if (person) {
                tagsHtml += `<span class="badge badge-secondary" style="margin-right: 4px; margin-top: 4px; display: inline-block; font-size: 10px; padding: 2px 6px;">${person}</span>`;
            }
        });
        
        // Render custom tag
        if (item.tag) {
            tagsHtml += `<span class="task-tag" style="margin-right: 4px; margin-top: 4px; display: inline-block;">${item.tag}</span>`;
        }
        
        return tagsHtml ? `<div style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px;">${tagsHtml}</div>` : '';
    }

    getAsanaContent() {
        const specialTagLabels = {
            'concerning-me': 'The one thing concerning me',
            'need-to-know': 'The thing I really need you to know',
            'want-to-know': 'The thing I really want to know',
            'celebrate': 'The one thing I want to celebrate',
            'random': 'The one random thing'
        };

        // Get all items with special tags
        const tasks = dataManager.getTasks().filter(t => t.specialTag);
        const meetings = dataManager.getMeetings().filter(m => m.specialTag);
        const ideas = dataManager.getIdeas().filter(i => i.specialTag);

        // Combine all items with their type
        const allItems = [
            ...tasks.map(t => ({ ...t, itemType: 'task' })),
            ...meetings.map(m => ({ ...m, itemType: 'meeting' })),
            ...ideas.map(i => ({ ...i, itemType: 'idea' }))
        ];

        // Group by week (Monday-Friday)
        const weeksMap = new Map();

        allItems.forEach(item => {
            // Get date from item (dueDate for tasks, date for meetings, created for ideas)
            let itemDate;
            if (item.itemType === 'task' && item.dueDate) {
                itemDate = new Date(item.dueDate);
            } else if (item.itemType === 'meeting' && item.date) {
                itemDate = new Date(item.date);
            } else if (item.itemType === 'idea' && item.created) {
                itemDate = new Date(item.created);
            } else {
                return; // Skip items without dates
            }

            // Get Monday of the week (week starts on Monday)
            const monday = new Date(itemDate);
            const dayOfWeek = itemDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
            monday.setDate(itemDate.getDate() + diff);
            monday.setHours(0, 0, 0, 0);

            // Get Friday of the week
            const friday = new Date(monday);
            friday.setDate(monday.getDate() + 4); // Friday is 4 days after Monday

            const weekKey = monday.toISOString().split('T')[0];

            if (!weeksMap.has(weekKey)) {
                weeksMap.set(weekKey, {
                    monday,
                    friday,
                    items: {}
                });
            }

            const week = weeksMap.get(weekKey);
            if (!week.items[item.specialTag]) {
                week.items[item.specialTag] = [];
            }
            week.items[item.specialTag].push(item);
        });

        // Sort weeks by date (newest first)
        const sortedWeeks = Array.from(weeksMap.entries())
            .sort((a, b) => new Date(b[0]) - new Date(a[0]))
            .slice(0, 4); // Show last 4 weeks

        if (sortedWeeks.length === 0) {
            return '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No items with special tags found.</p>';
        }

        let html = '';
        sortedWeeks.forEach(([weekKey, week]) => {
            const weekLabel = `${week.monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${week.friday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            
            html += `<div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid var(--border-color-light);">`;
            html += `<h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: var(--primary-color);">Week: ${weekLabel}</h4>`;

            // Sort special tags in order
            const tagOrder = ['concerning-me', 'need-to-know', 'want-to-know', 'celebrate', 'random'];
            
            tagOrder.forEach(tagKey => {
                if (week.items[tagKey] && week.items[tagKey].length > 0) {
                    const tagLabel = specialTagLabels[tagKey];
                    html += `<div style="margin-bottom: 12px;">`;
                    html += `<div style="font-weight: 600; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px;">${tagLabel}</div>`;
                    
                    week.items[tagKey].forEach(item => {
                        const title = item.headline || item.title || 'Untitled';
                        const typeLabel = item.itemType === 'task' ? 'Task' : item.itemType === 'meeting' ? 'Meeting' : 'Idea';
                        const typeColor = item.itemType === 'task' ? '#4a90e2' : item.itemType === 'meeting' ? '#9b59b6' : '#f39c12';
                        
                        html += `<div style="padding: 8px; margin-bottom: 6px; background: var(--card-bg); border-left: 3px solid ${typeColor}; border-radius: 4px; font-size: 12px;">`;
                        html += `<div style="font-weight: 600; margin-bottom: 4px;">${title}</div>`;
                        html += `<div style="font-size: 10px; color: var(--text-secondary);">${typeLabel}</div>`;
                        if (item.description && item.description.length > 0) {
                            const shortDesc = item.description.length > 100 ? item.description.substring(0, 100) + '...' : item.description;
                            html += `<div style="margin-top: 4px; font-size: 11px; color: var(--text-secondary);">${shortDesc}</div>`;
                        }
                        html += `</div>`;
                    });
                    
                    html += `</div>`;
                }
            });

            html += `</div>`;
        });

        return html;
    }

    getActiveTasks(tasks) {
        // Force reload data to get latest
        dataManager.loadData();
        
        // Filter out tasks that are in recycle bin
        const recycleBin = dataManager.getData().recycleBin || [];
        const recycleBinIds = new Set(recycleBin.filter(item => item.type === 'task').map(item => item.id));
        
        return tasks.filter(task => {
            if (!task || !task.id) return false;
            
            // Filter out tasks in recycle bin - THIS IS CRITICAL
            if (recycleBinIds.has(task.id)) {
                return false;
            }
            
            // Only filter out tasks without headline - be lenient with other fields
            if (!task.headline || task.headline.trim().length === 0) return false;
            
            return true;
        });
    }

    getTasksDueThisWeek(tasks) {
        // First filter out deleted tasks
        const activeTasks = this.getActiveTasks(tasks);
        
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        return activeTasks.filter(task => {
            if (!task.dueDate || task.status === 'completed') return false;
            const dueDate = new Date(task.dueDate);
            return dueDate >= weekStart && dueDate <= weekEnd;
        });
    }

    getOverdueTasks(tasks) {
        const today = new Date().toISOString().split('T')[0];
        return tasks.filter(task => 
            task.dueDate && 
            task.dueDate < today && 
            task.status !== 'completed'
        );
    }

    attachWidgetEvents(element, widget) {
        // Drag functionality
        const header = element.querySelector('.widget-header');
        header.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('widget-btn')) return;
            this.startDrag(e, widget.id);
        });

        // Resize functionality
        const resizeHandle = element.querySelector('.widget-resize');
        resizeHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.startResize(e, widget.id);
        });

        // Event delegation for task-item clicks (more reliable than inline onclick)
        const content = element.querySelector('.widget-content');
        if (content) {
            content.addEventListener('click', (e) => {
                const taskItem = e.target.closest('.task-item');
                if (taskItem) {
                    const taskId = taskItem.getAttribute('data-task-id');
                    if (taskId && taskManager) {
                        e.preventDefault();
                        e.stopPropagation();
                        taskManager.openTask(taskId);
                    }
                }
            });
        }
    }

    startDrag(e, widgetId) {
        this.draggedWidget = widgetId;
        const widget = document.getElementById(`widget-${widgetId}`);
        const rect = widget.getBoundingClientRect();
        this.dragOffset.x = e.clientX - rect.left;
        this.dragOffset.y = e.clientY - rect.top;
        
        document.addEventListener('mousemove', this.handleDrag);
        document.addEventListener('mouseup', this.stopDrag);
    }

    handleDrag = (e) => {
        if (!this.draggedWidget) return;
        
        const widget = document.getElementById(`widget-${this.draggedWidget}`);
        const workspace = document.getElementById('dashboard-workspace');
        const workspaceRect = workspace.getBoundingClientRect();
        
        let x = e.clientX - workspaceRect.left - this.dragOffset.x;
        let y = e.clientY - workspaceRect.top - this.dragOffset.y;
        
        // Constrain horizontally to workspace width
        x = Math.max(0, Math.min(x, workspaceRect.width - widget.offsetWidth));
        // Allow vertical movement beyond visible area - no upper limit, but keep minimum at 0
        y = Math.max(0, y);
        
        widget.style.left = x + 'px';
        widget.style.top = y + 'px';
        
        // Update workspace height to accommodate the widget
        this.updateWorkspaceHeight();
    }

    stopDrag = () => {
        if (this.draggedWidget) {
            const widget = document.getElementById(`widget-${this.draggedWidget}`);
            const widgetData = this.widgets.find(w => w.id === this.draggedWidget);
            if (widgetData) {
                widgetData.x = parseInt(widget.style.left);
                widgetData.y = parseInt(widget.style.top);
                dataManager.updateWidget(this.draggedWidget, { x: widgetData.x, y: widgetData.y });
            }
            this.draggedWidget = null;
            // Update workspace height after drag ends
            this.updateWorkspaceHeight();
        }
        document.removeEventListener('mousemove', this.handleDrag);
        document.removeEventListener('mouseup', this.stopDrag);
    }
    
    updateWorkspaceHeight() {
        const workspace = document.getElementById('dashboard-workspace');
        if (!workspace) return;
        
        // Find the lowest widget position
        let maxBottom = 0;
        const widgets = workspace.querySelectorAll('.widget');
        
        widgets.forEach(widget => {
            const top = parseInt(widget.style.top) || 0;
            const height = widget.offsetHeight;
            const bottom = top + height;
            if (bottom > maxBottom) {
                maxBottom = bottom;
            }
        });
        
        // Set workspace height to accommodate all widgets with some padding
        // Minimum height is viewport height minus header/sidebar, or the lowest widget + padding
        const viewportHeight = window.innerHeight;
        const minViewportHeight = viewportHeight - 200; // Account for header and padding
        const requiredHeight = maxBottom + 100; // Add 100px padding below lowest widget
        const finalHeight = Math.max(minViewportHeight, requiredHeight);
        
        workspace.style.minHeight = finalHeight + 'px';
    }

    startResize(e, widgetId) {
        this.resizingWidget = widgetId;
        const widget = document.getElementById(`widget-${widgetId}`);
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = widget.offsetWidth;
        const startHeight = widget.offsetHeight;

        const handleResize = (e) => {
            const width = startWidth + (e.clientX - startX);
            const height = startHeight + (e.clientY - startY);
            
            widget.style.width = Math.max(300, width) + 'px';
            widget.style.height = Math.max(200, height) + 'px';
            
            // Update workspace height during resize
            this.updateWorkspaceHeight();
        };

        const stopResize = () => {
            const widgetData = this.widgets.find(w => w.id === widgetId);
            if (widgetData) {
                widgetData.width = widget.offsetWidth;
                widgetData.height = widget.offsetHeight;
                dataManager.updateWidget(widgetId, { width: widgetData.width, height: widgetData.height });
            }
            this.resizingWidget = null;
            // Update workspace height after resize ends
            this.updateWorkspaceHeight();
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', stopResize);
        };

        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
    }

    openWidgetSettings(widgetId) {
        const widget = this.widgets.find(w => w.id === widgetId);
        if (!widget) return;

        const modal = document.getElementById('widget-settings-modal');
        const content = document.getElementById('widget-settings-content');
        
        content.innerHTML = `
            <h3>Widget Settings</h3>
            <div class="form-group">
                <label>Widget Type:</label>
                <select id="widget-type-select">
                    <option value="asana" ${widget.type === 'asana' ? 'selected' : ''}>Asana</option>
                    <option value="tasks-all" ${widget.type === 'tasks-all' ? 'selected' : ''}>All Tasks</option>
                    <option value="tasks-active" ${widget.type === 'tasks-active' ? 'selected' : ''}>Active Tasks</option>
                    <option value="birthdays" ${widget.type === 'birthdays' ? 'selected' : ''}>Birthdays</option>
                    <option value="calendar" ${widget.type === 'calendar' ? 'selected' : ''}>Calendar</option>
                    <option value="tasks-completed" ${widget.type === 'tasks-completed' ? 'selected' : ''}>Completed Tasks</option>
                    <option value="ideas" ${widget.type === 'ideas' ? 'selected' : ''}>Ideas</option>
                    <option value="meetings" ${widget.type === 'meetings' ? 'selected' : ''}>Meetings</option>
                    <option value="org-charts" ${widget.type === 'org-charts' ? 'selected' : ''}>Org Charts</option>
                    <option value="tasks-overdue" ${widget.type === 'tasks-overdue' ? 'selected' : ''}>Overdue Tasks</option>
                    <option value="ideas-recent" ${widget.type === 'ideas-recent' ? 'selected' : ''}>Recent Ideas</option>
                    <option value="tasks-today" ${widget.type === 'tasks-today' ? 'selected' : ''}>Tasks Due Today</option>
                    <option value="tasks-week" ${widget.type === 'tasks-week' ? 'selected' : ''}>Tasks This Week</option>
                    <option value="summaries" ${widget.type === 'summaries' ? 'selected' : ''}>Weekly Summaries</option>
                </select>
            </div>
            <div class="form-group">
                <label>Title:</label>
                <input type="text" id="widget-title-input" value="${widget.title || ''}">
            </div>
            <div class="form-actions">
                <button class="btn-primary" onclick="widgetManager.saveWidgetSettings('${widgetId}')">Save</button>
                <button class="btn-secondary" onclick="widgetManager.closeWidgetSettings()">Cancel</button>
            </div>
        `;

        modal.classList.add('active');
    }

    saveWidgetSettings(widgetId) {
        const type = document.getElementById('widget-type-select').value;
        const title = document.getElementById('widget-title-input').value;
        
        dataManager.updateWidget(widgetId, { type, title });
        this.loadWidgets();
        this.closeWidgetSettings();
    }

    closeWidgetSettings() {
        document.getElementById('widget-settings-modal').classList.remove('active');
    }

    deleteWidget(widgetId) {
        if (confirm('Are you sure you want to delete this widget?')) {
            dataManager.deleteWidget(widgetId);
            this.loadWidgets();
        }
    }

    setupEventListeners() {
        const addWidgetBtn = document.getElementById('add-widget-btn');
        if (addWidgetBtn) {
            addWidgetBtn.addEventListener('click', () => {
                this.openAddWidgetModal();
            });
        }

        // Add Widget Modal
        const addWidgetModal = document.getElementById('add-widget-modal');
        const addWidgetForm = document.getElementById('add-widget-form');
        const addWidgetClose = document.getElementById('add-widget-close');
        const addWidgetCancel = document.getElementById('add-widget-cancel');

        if (addWidgetForm) {
            addWidgetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createNewWidget();
            });
        }

        if (addWidgetClose) {
            addWidgetClose.addEventListener('click', () => this.closeAddWidgetModal());
        }

        if (addWidgetCancel) {
            addWidgetCancel.addEventListener('click', () => this.closeAddWidgetModal());
        }

        // Widget Settings Modal
        const widgetSettingsClose = document.getElementById('widget-settings-close');
        if (widgetSettingsClose) {
            widgetSettingsClose.addEventListener('click', () => this.closeWidgetSettings());
        }
    }

    openAddWidgetModal() {
        const modal = document.getElementById('add-widget-modal');
        if (modal) {
            modal.classList.add('active');
            // Reset form
            document.getElementById('add-widget-form').reset();
            document.getElementById('new-widget-width').value = 400;
            document.getElementById('new-widget-height').value = 300;
        }
    }

    closeAddWidgetModal() {
        const modal = document.getElementById('add-widget-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    createNewWidget() {
        const type = document.getElementById('new-widget-type').value;
        const title = document.getElementById('new-widget-title').value.trim();
        const width = parseInt(document.getElementById('new-widget-width').value) || 400;
        const height = parseInt(document.getElementById('new-widget-height').value) || 300;

        if (!type) {
            alert('Please select a widget type');
            return;
        }

        // Find the lowest widget to place new widget below it
        let maxY = 0;
        this.widgets.forEach(w => {
            if (w.y + w.height > maxY) {
                maxY = w.y + w.height;
            }
        });

        const widget = {
            type: type,
            title: title || null,
            x: 0,
            y: maxY + 20, // Place 20px below the lowest widget
            width: Math.max(300, Math.min(width, 1200)),
            height: Math.max(200, Math.min(height, 800))
        };

        dataManager.addWidget(widget);
        this.loadWidgets();
        this.closeAddWidgetModal();
    }

    refreshWidgets() {
        // Force a complete re-render of all widgets with fresh data
        this.renderWidgets();
        
        // Also trigger a data refresh to ensure we have latest data
        if (dataManager) {
            dataManager.loadData();
        }
    }

    prevMonth() {
        // Calendar navigation would be implemented here
        this.refreshWidgets();
    }

    nextMonth() {
        // Calendar navigation would be implemented here
        this.refreshWidgets();
    }
}

const widgetManager = new WidgetManager();

