// Data Manager - Handles all data storage and retrieval
class DataManager {
    constructor() {
        this.storageKey = 'day2day-data';
        this.backupKey = 'day2day-backups';
        this.dataPath = window.location.pathname.replace(/[^/]*$/, '') + 'data/';
        this.init();
    }

    init() {
        // Create data directory structure in localStorage
        if (!localStorage.getItem(this.storageKey)) {
            this.initializeData();
        }
        this.loadData();
        // Ensure default department and person exist
        this.ensureDefaults();
        this.setupAutoBackup();
        this.setupDailyBackup();
        this.setupPageUnloadSave();
        this.setupPeriodicSave();
    }
    
    setupPageUnloadSave() {
        // Save data before page unloads (browser close, refresh, navigation)
        window.addEventListener('beforeunload', (e) => {
            try {
                this.saveData();
            } catch (error) {
                console.error('Error saving on page unload:', error);
            }
        });
        
        // Also save on visibility change (tab switch, minimize)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                try {
                    this.saveData();
                } catch (error) {
                    console.error('Error saving on visibility change:', error);
                }
            }
        });
    }
    
    setupPeriodicSave() {
        // Save every 2 minutes as a safety measure (reduced from 30s)
        setInterval(() => {
            try {
                this.saveData();
            } catch (error) {
                console.error('Error in periodic save:', error);
            }
        }, 120000); // 2 minutes
    }
    
    ensureDefaults() {
        // Ensure default department exists
        const depts = this.getDepartments();
        if (!depts.find(d => d.name === 'C&G Product Strategy')) {
            this.addDepartment('C&G Product Strategy');
        }
        
        // Ensure default person exists
        const people = this.getPeople();
        if (!people.find(p => p.name === 'Eefje')) {
            this.addPerson('Eefje');
        }
    }

    initializeData() {
        const initialData = {
            tasks: [],
            ideas: [],
            birthdays: [
                {
                    id: this.generateId(),
                    name: 'Eefje Van Craen',
                    date: new Date().getFullYear() + '-03-13', // March 13
                    created: new Date().toISOString()
                }
            ],
            summaries: [],
            meetings: [],
            meetingTypes: [
                { id: 'partnership', name: 'Partnership' },
                { id: 'sales', name: 'Sales' },
                { id: 'marketing', name: 'Marketing' },
                { id: 'credit-circle', name: 'Credit Circle' }
            ],
            orgCharts: [],
            squads: [],
            creditCircleUpdates: [],
            creditCircleMembers: [],
            recycleBin: [],
            departments: [
                { 
                    id: 'default-dept', 
                    name: 'C&G Product Strategy',
                    subDepartments: [],
                    people: [
                        { id: 'default-person', name: 'Eefje' }
                    ]
                }
            ],
            tags: [],
            people: [
                { id: 'default-person', name: 'Eefje' }
            ],
            settings: {
                timezone: 'CET',
                autoBackup: true,
                lastBackup: null,
                sidebarColors: {
                    bgTop: '#ffffff',
                    bgBottom: '#f9fafb',
                    greetingColor1: '#4a90e2',
                    greetingColor2: '#7b68ee',
                    navActiveColor: '#4a90e2',
                    navHoverColor: '#4a90e2',
                    birthdayBgTop: '#fce4ec',
                    birthdayBgBottom: '#f8bbd0',
                    birthdayTextColor: '#c2185b'
                }
            },
            widgets: [
                {
                    id: 'calendar',
                    type: 'calendar',
                    x: 0,
                    y: 0,
                    width: 600,
                    height: 400
                },
                {
                    id: 'tasks-today',
                    type: 'tasks-today',
                    x: 620,
                    y: 0,
                    width: 400,
                    height: 300
                },
                {
                    id: 'tasks-week',
                    type: 'tasks-week',
                    x: 0,
                    y: 420,
                    width: 500,
                    height: 300
                },
                {
                    id: 'summaries',
                    type: 'summaries',
                    x: 520,
                    y: 420,
                    width: 500,
                    height: 300
                }
            ]
        };
        this.saveData(initialData);
    }

    loadData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                this.data = JSON.parse(data);
            } else {
                this.initializeData();
                this.loadData();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.initializeData();
            this.loadData();
        }
    }

    saveData(data = null) {
        if (!data) {
            data = this.data;
        }
        try {
            // Create a backup copy before saving (safety measure)
            const backupKey = this.storageKey + '-backup';
            try {
                const currentData = localStorage.getItem(this.storageKey);
                if (currentData) {
                    localStorage.setItem(backupKey, currentData);
                }
            } catch (backupError) {
                console.warn('Could not create backup before save:', backupError);
            }
            
            // Save the data
            const dataString = JSON.stringify(data);
            localStorage.setItem(this.storageKey, dataString);
            this.data = data;
            
            // Update last save timestamp
            localStorage.setItem('day2day-last-save', new Date().toISOString());
            
            // Note: Daily backups are handled by setupDailyBackup()
            // This ensures backups happen once per day, not on every save
        } catch (error) {
            console.error('Error saving data:', error);
            
            // Try to restore from backup if save failed
            try {
                const backupKey = this.storageKey + '-backup';
                const backupData = localStorage.getItem(backupKey);
                if (backupData) {
                    console.warn('Save failed, but backup exists. Data may be safe.');
                }
            } catch (restoreError) {
                console.error('Could not check backup:', restoreError);
            }
            
            // Re-throw error so caller knows save failed
            throw error;
        }
    }

    getData() {
        return this.data || {};
    }

    updateData(updates) {
        this.data = { ...this.data, ...updates };
        this.saveData();
    }

    // Tasks
    getTasks() {
        return this.data.tasks || [];
    }

    addTask(task) {
        if (!this.data.tasks) this.data.tasks = [];
        
        // Validate required fields before creating task
        if (!task.headline || task.headline.trim().length === 0) {
            throw new Error('Task headline is required');
        }
        
        // Create task object with all required fields
        const newTask = {
            id: this.generateId(),
            created: new Date().toISOString(),
            status: task.status || 'active',
            headline: task.headline.trim(),
            description: task.description || '',
            dueDate: task.dueDate || '',
            priority: task.priority || 'medium',
            tag: task.tag || '',
            specialTag: task.specialTag || null,
            departments: task.departments || [],
            people: task.people || []
        };
        
        // Ensure required fields
        if (!newTask.departments || newTask.departments.length === 0) {
            const defaultDept = this.getDepartments().find(d => d.name === 'C&G Product Strategy');
            if (defaultDept) {
                newTask.departments = [defaultDept.id];
            } else {
                // If no default department exists, create one
                const newDept = this.addDepartment('C&G Product Strategy');
                newTask.departments = [newDept.id];
            }
        }
        if (!newTask.people || newTask.people.length === 0) {
            newTask.people = ['Eefje'];
        }
        
        // Add to array
        this.data.tasks.push(newTask);
        
        // Save immediately - use try-catch to ensure we save
        let saveSuccess = false;
        try {
            this.saveData();
            saveSuccess = true;
            
            // Double-check it was saved
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const savedData = JSON.parse(saved);
                const found = savedData.tasks?.find(t => t.id === newTask.id);
                if (!found) {
                    // Task not found - retry save
                    console.warn('Task not found after save, retrying...');
                    this.saveData();
                }
            }
        } catch (error) {
            console.error('Failed to save task:', error);
            // Remove task from array if save failed
            const index = this.data.tasks.findIndex(t => t.id === newTask.id);
            if (index > -1) {
                this.data.tasks.splice(index, 1);
            }
            throw new Error('Failed to save task: ' + error.message);
        }
        
        return newTask;
    }

    updateTask(id, updates) {
        const task = this.data.tasks.find(t => t.id === id);
        if (task) {
            Object.assign(task, updates);
            task.updated = new Date().toISOString();
            
            // Save immediately and ensure it's saved
            try {
                this.saveData();
                console.log('Task updated and saved:', task.headline);
            } catch (error) {
                console.error('Failed to save task update:', error);
                // Try one more time
                setTimeout(() => {
                    try {
                        this.saveData();
                        console.log('Task update saved on retry');
                    } catch (retryError) {
                        console.error('Failed to save task update on retry:', retryError);
                    }
                }, 100);
            }
            
            return task;
        }
        return null;
    }

    deleteTask(id, permanent = false) {
        const taskIndex = this.data.tasks.findIndex(t => t.id === id);
        if (taskIndex !== -1) {
            const task = this.data.tasks[taskIndex];
            this.data.tasks.splice(taskIndex, 1);
            
            if (permanent) {
                // Also remove from recycle bin if it exists there
                if (this.data.recycleBin) {
                    const recycleIndex = this.data.recycleBin.findIndex(item => item.id === id && item.type === 'task');
                    if (recycleIndex !== -1) {
                        this.data.recycleBin.splice(recycleIndex, 1);
                    }
                }
            } else {
                // Move to recycle bin
                if (!this.data.recycleBin) this.data.recycleBin = [];
                // Remove from recycle bin if already there
                const existingIndex = this.data.recycleBin.findIndex(item => item.id === id);
                if (existingIndex !== -1) {
                    this.data.recycleBin.splice(existingIndex, 1);
                }
                task.deletedAt = new Date().toISOString();
                task.type = 'task';
                this.data.recycleBin.push(task);
            }
            
            // Save immediately
            this.saveData();
            return true;
        }
        return false;
    }

    restoreFromRecycleBin(id) {
        const item = this.data.recycleBin.find(i => i.id === id);
        if (item) {
            const index = this.data.recycleBin.findIndex(i => i.id === id);
            this.data.recycleBin.splice(index, 1);
            
            if (item.type === 'task') {
                if (!this.data.tasks) this.data.tasks = [];
                delete item.deletedAt;
                delete item.type;
                // Ensure required fields exist
                if (!item.status) item.status = 'active';
                if (!item.departments && !item.department) {
                    // Ensure default department if none exists
                    const defaultDept = this.getDepartments().find(d => d.name === 'C&G Product Strategy');
                    if (defaultDept) {
                        item.departments = [defaultDept.id];
                    }
                }
                if (!item.people && !item.person) {
                    item.people = ['Eefje'];
                }
                this.data.tasks.push(item);
            } else if (item.type === 'idea') {
                if (!this.data.ideas) this.data.ideas = [];
                delete item.deletedAt;
                delete item.type;
                this.data.ideas.push(item);
            } else if (item.type === 'meeting') {
                if (!this.data.meetings) this.data.meetings = [];
                delete item.deletedAt;
                delete item.type;
                this.data.meetings.push(item);
            }
            this.saveData();
            return true;
        }
        return false;
    }

    restoreMostRecentTask() {
        if (!this.data.recycleBin || this.data.recycleBin.length === 0) {
            return null;
        }
        
        // Find the most recently deleted task
        const tasks = this.data.recycleBin
            .filter(item => item.type === 'task')
            .sort((a, b) => {
                const dateA = a.deletedAt ? new Date(a.deletedAt) : new Date(0);
                const dateB = b.deletedAt ? new Date(b.deletedAt) : new Date(0);
                return dateB - dateA; // Most recent first
            });
        
        if (tasks.length > 0) {
            return this.restoreFromRecycleBin(tasks[0].id);
        }
        
        return false;
    }

    // Ideas
    getIdeas() {
        return this.data.ideas || [];
    }

    addIdea(idea) {
        if (!this.data.ideas) this.data.ideas = [];
        idea.id = this.generateId();
        idea.created = new Date().toISOString();
        this.data.ideas.push(idea);
        this.saveData();
        return idea;
    }

    updateIdea(id, updates) {
        const idea = this.data.ideas.find(i => i.id === id);
        if (idea) {
            Object.assign(idea, updates);
            idea.updated = new Date().toISOString();
            this.saveData();
            return idea;
        }
        return null;
    }

    deleteIdea(id, permanent = false) {
        const ideaIndex = this.data.ideas.findIndex(i => i.id === id);
        if (ideaIndex !== -1) {
            const idea = this.data.ideas[ideaIndex];
            if (permanent) {
                this.data.ideas.splice(ideaIndex, 1);
            } else {
                this.data.ideas.splice(ideaIndex, 1);
                if (!this.data.recycleBin) this.data.recycleBin = [];
                idea.deletedAt = new Date().toISOString();
                idea.type = 'idea';
                this.data.recycleBin.push(idea);
            }
            this.saveData();
            return true;
        }
        return false;
    }

    // Birthdays
    getBirthdays() {
        return this.data.birthdays || [];
    }

    addBirthday(birthday) {
        if (!this.data.birthdays) this.data.birthdays = [];
        birthday.id = this.generateId();
        birthday.created = new Date().toISOString();
        this.data.birthdays.push(birthday);
        this.saveData();
        return birthday;
    }

    updateBirthday(id, updates) {
        const birthday = this.data.birthdays.find(b => b.id === id);
        if (birthday) {
            Object.assign(birthday, updates);
            birthday.updated = new Date().toISOString();
            this.saveData();
            return birthday;
        }
        return null;
    }

    deleteBirthday(id) {
        const index = this.data.birthdays.findIndex(b => b.id === id);
        if (index !== -1) {
            this.data.birthdays.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    // Summaries
    getSummaries() {
        return this.data.summaries || [];
    }

    addSummary(summary) {
        if (!this.data.summaries) this.data.summaries = [];
        summary.id = this.generateId();
        summary.created = new Date().toISOString();
        this.data.summaries.push(summary);
        this.saveData();
        return summary;
    }

    // Org Charts
    getOrgCharts() {
        return this.data.orgCharts || [];
    }

    getOrgChart(chartId) {
        return this.data.orgCharts?.find(c => c.id === chartId) || null;
    }

    addOrgChart(chart) {
        if (!this.data.orgCharts) this.data.orgCharts = [];
        chart.id = this.generateId();
        chart.created = new Date().toISOString();
        chart.updated = new Date().toISOString();
        if (!chart.positions) chart.positions = [];
        this.data.orgCharts.push(chart);
        this.saveData();
        return chart;
    }

    updateOrgChart(chartId, updates) {
        const chart = this.data.orgCharts?.find(c => c.id === chartId);
        if (chart) {
            Object.assign(chart, updates);
            chart.updated = new Date().toISOString();
            this.saveData();
            return chart;
        }
        return null;
    }

    deleteOrgChart(chartId) {
        const index = this.data.orgCharts?.findIndex(c => c.id === chartId);
        if (index !== undefined && index !== -1) {
            this.data.orgCharts.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    addOrgChartPosition(chartId, position) {
        const chart = this.data.orgCharts?.find(c => c.id === chartId);
        if (chart) {
            if (!chart.positions) chart.positions = [];
            position.id = this.generateId();
            position.created = new Date().toISOString();
            chart.positions.push(position);
            chart.updated = new Date().toISOString();
            this.saveData();
            return position;
        }
        return null;
    }

    updateOrgChartPosition(chartId, positionId, updates) {
        const chart = this.data.orgCharts?.find(c => c.id === chartId);
        if (chart) {
            const position = chart.positions?.find(p => p.id === positionId);
            if (position) {
                Object.assign(position, updates);
                position.updated = new Date().toISOString();
                chart.updated = new Date().toISOString();
                this.saveData();
                return position;
            }
        }
        return null;
    }

    deleteOrgChartPosition(chartId, positionId) {
        const chart = this.data.orgCharts?.find(c => c.id === chartId);
        if (chart && chart.positions) {
            const index = chart.positions.findIndex(p => p.id === positionId);
            if (index !== -1) {
                chart.positions.splice(index, 1);
                chart.updated = new Date().toISOString();
                this.saveData();
                return true;
            }
        }
        return false;
    }

    // Departments
    getDepartments() {
        return this.data.departments || [];
    }

    addDepartment(name, parentId = null) {
        if (!this.data.departments) this.data.departments = [];
        
        if (parentId) {
            // Add as sub-department
            const parent = this.data.departments.find(d => d.id === parentId);
            if (parent) {
                if (!parent.subDepartments) parent.subDepartments = [];
                const subDept = { 
                    id: this.generateId(), 
                    name: name.trim(),
                    people: []
                };
                parent.subDepartments.push(subDept);
                this.saveData();
                return subDept;
            }
        } else {
            // Add as main department
            const dept = { 
                id: this.generateId(), 
                name: name.trim(),
                subDepartments: [],
                people: []
            };
            this.data.departments.push(dept);
            this.saveData();
            return dept;
        }
        return null;
    }

    deleteDepartment(id, isSubDepartment = false, parentId = null) {
        if (isSubDepartment && parentId) {
            const parent = this.data.departments.find(d => d.id === parentId);
            if (parent && parent.subDepartments) {
                const index = parent.subDepartments.findIndex(sd => sd.id === id);
                if (index !== -1) {
                    parent.subDepartments.splice(index, 1);
                    this.saveData();
                    return true;
                }
            }
        } else {
            const index = this.data.departments.findIndex(d => d.id === id);
            if (index !== -1) {
                this.data.departments.splice(index, 1);
                this.saveData();
                return true;
            }
        }
        return false;
    }

    updateDepartment(id, updates, isSubDepartment = false, parentId = null) {
        if (isSubDepartment && parentId) {
            const parent = this.data.departments.find(d => d.id === parentId);
            if (parent && parent.subDepartments) {
                const subDept = parent.subDepartments.find(sd => sd.id === id);
                if (subDept) {
                    Object.assign(subDept, updates);
                    this.saveData();
                    return subDept;
                }
            }
        } else {
            const dept = this.data.departments.find(d => d.id === id);
            if (dept) {
                Object.assign(dept, updates);
                this.saveData();
                return dept;
            }
        }
        return null;
    }

    addPersonToDepartment(personName, deptId, isSubDepartment = false, parentId = null) {
        let targetDept = null;
        
        if (isSubDepartment && parentId) {
            const parent = this.data.departments.find(d => d.id === parentId);
            if (parent && parent.subDepartments) {
                targetDept = parent.subDepartments.find(sd => sd.id === deptId);
            }
        } else {
            targetDept = this.data.departments.find(d => d.id === deptId);
        }

        if (targetDept) {
            if (!targetDept.people) targetDept.people = [];
            if (!targetDept.people.find(p => p.name === personName)) {
                targetDept.people.push({ id: this.generateId(), name: personName });
                this.saveData();
                return true;
            }
        }
        return false;
    }

    // Meetings
    getMeetings() {
        return this.data.meetings || [];
    }

    addMeeting(meeting) {
        if (!this.data.meetings) this.data.meetings = [];
        meeting.id = this.generateId();
        meeting.created = new Date().toISOString();
        this.data.meetings.push(meeting);
        this.saveData();
        return meeting;
    }

    updateMeeting(id, updates) {
        const meeting = this.data.meetings?.find(m => m.id === id);
        if (meeting) {
            Object.assign(meeting, updates);
            meeting.updated = new Date().toISOString();
            this.saveData();
            return meeting;
        }
        return null;
    }

    deleteMeeting(id) {
        const index = this.data.meetings?.findIndex(m => m.id === id);
        if (index !== undefined && index !== -1) {
            this.data.meetings.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    // Meeting Types
    getMeetingTypes() {
        return this.data.meetingTypes || [];
    }

    addMeetingType(name) {
        if (!this.data.meetingTypes) this.data.meetingTypes = [];
        const type = { id: this.generateId(), name: name.trim() };
        this.data.meetingTypes.push(type);
        this.saveData();
        return type;
    }

    updateMeetingType(id, updates) {
        const type = this.data.meetingTypes?.find(t => t.id === id);
        if (type) {
            Object.assign(type, updates);
            this.saveData();
            return type;
        }
        return null;
    }

    deleteMeetingType(id) {
        const index = this.data.meetingTypes?.findIndex(t => t.id === id);
        if (index !== undefined && index !== -1) {
            this.data.meetingTypes.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    // Squads
    getSquads() {
        return this.data.squads || [];
    }

    addSquad(squad) {
        if (!this.data.squads) this.data.squads = [];
        this.data.squads.push(squad);
        this.saveData();
        return squad;
    }

    updateSquad(id, updates) {
        const squad = this.data.squads?.find(s => s.id === id);
        if (squad) {
            Object.assign(squad, updates);
            this.saveData();
            return squad;
        }
        return null;
    }

    deleteSquad(id) {
        const index = this.data.squads?.findIndex(s => s.id === id);
        if (index !== undefined && index !== -1) {
            this.data.squads.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    // Credit Circle Updates
    getCreditCircleUpdates() {
        return this.data.creditCircleUpdates || [];
    }

    addCreditCircleUpdate(update) {
        if (!this.data.creditCircleUpdates) this.data.creditCircleUpdates = [];
        this.data.creditCircleUpdates.push(update);
        this.saveData();
        return update;
    }

    updateCreditCircleUpdate(id, updates) {
        const update = this.data.creditCircleUpdates?.find(u => u.id === id);
        if (update) {
            Object.assign(update, updates);
            update.updatedAt = new Date().toISOString();
            this.saveData();
            return update;
        }
        return null;
    }

    deleteCreditCircleUpdate(id) {
        const index = this.data.creditCircleUpdates?.findIndex(u => u.id === id);
        if (index !== undefined && index !== -1) {
            this.data.creditCircleUpdates.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    // Credit Circle Members
    getCreditCircleMembers() {
        return this.data.creditCircleMembers || [];
    }

    addCreditCircleMember(member) {
        if (!this.data.creditCircleMembers) this.data.creditCircleMembers = [];
        this.data.creditCircleMembers.push(member);
        this.saveData();
        return member;
    }

    updateCreditCircleMember(id, updates) {
        const member = this.data.creditCircleMembers?.find(m => m.id === id);
        if (member) {
            Object.assign(member, updates);
            this.saveData();
            return member;
        }
        return null;
    }

    deleteCreditCircleMember(id) {
        const index = this.data.creditCircleMembers?.findIndex(m => m.id === id);
        if (index !== undefined && index !== -1) {
            this.data.creditCircleMembers.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    // People
    getPeople() {
        return this.data.people || [];
    }

    addPerson(name) {
        if (!this.data.people) this.data.people = [];
        const person = { id: this.generateId(), name: name.trim() };
        this.data.people.push(person);
        this.saveData();
        return person;
    }

    deletePerson(id) {
        const index = this.data.people.findIndex(p => p.id === id);
        if (index !== -1) {
            this.data.people.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    // Tags
    getTags() {
        return this.data.tags || [];
    }

    addTag(name) {
        if (!this.data.tags) this.data.tags = [];
        const tag = { id: this.generateId(), name: name.trim() };
        this.data.tags.push(tag);
        this.saveData();
        return tag;
    }

    deleteTag(id) {
        const index = this.data.tags.findIndex(t => t.id === id);
        if (index !== -1) {
            this.data.tags.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    // Widgets
    getWidgets() {
        return this.data.widgets || [];
    }

    updateWidget(id, updates) {
        const widget = this.data.widgets.find(w => w.id === id);
        if (widget) {
            Object.assign(widget, updates);
            this.saveData();
            return widget;
        }
        return null;
    }

    addWidget(widget) {
        if (!this.data.widgets) this.data.widgets = [];
        widget.id = this.generateId();
        this.data.widgets.push(widget);
        this.saveData();
        return widget;
    }

    deleteWidget(id) {
        const index = this.data.widgets.findIndex(w => w.id === id);
        if (index !== -1) {
            this.data.widgets.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    // File Export/Import
    async exportToFile(silent = false) {
        try {
            const dataStr = JSON.stringify(this.data, null, 2);
            const today = new Date().toISOString().split('T')[0];
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const fileName = `day2day-backup-${timestamp}.json`;
            
            // For manual backups, try to use File System Access API to save directly to OneDrive
            if (!silent && 'showSaveFilePicker' in window) {
                try {
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: fileName,
                        types: [{
                            description: 'JSON Backup File',
                            accept: { 'application/json': ['.json'] }
                        }],
                        startIn: 'documents' // Suggest documents folder, user can navigate to OneDrive
                    });
                    
                    const writable = await fileHandle.createWritable();
                    await writable.write(dataStr);
                    await writable.close();
                    
                    console.log('Backup saved directly to:', fileHandle.name);
                    alert('Backup saved successfully!');
                    return true;
                } catch (fsError) {
                    // User cancelled or API not fully supported, fall back to download
                    if (fsError.name !== 'AbortError') {
                        console.log('File System API not available, using download method');
                    } else {
                        // User cancelled
                        return false;
                    }
                }
            }
            
            // Download method (for automatic backups or if File System API not available)
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            
            // Always trigger download
            link.click();
            
            // Cleanup after a delay
            setTimeout(() => {
                if (document.body.contains(link)) {
                    document.body.removeChild(link);
                }
                URL.revokeObjectURL(url);
            }, 100);
            
            // For automatic backups, show info about moving to OneDrive
            if (silent) {
                console.log('Daily backup downloaded. Run move-backups-to-onedrive.bat to move to OneDrive folder.');
            } else {
                setTimeout(() => {
                    console.log('Backup downloaded. Run move-backups-to-onedrive.bat to move to OneDrive, or move manually to backups folder.');
                }, 500);
            }
            
            return true;
        } catch (error) {
            console.error('Error exporting to file:', error);
            return false;
        }
    }
    
    // Daily automatic backup — saves to localStorage rolling backups (no file downloads)
    setupDailyBackup() {
        const today = new Date().toISOString().split('T')[0];
        const lastBackupDate = localStorage.getItem('day2day-last-backup-date');

        if (lastBackupDate !== today) {
            // Wait for page to fully load, then create a silent in-memory backup
            setTimeout(() => {
                this.createDailyBackupToStorage();
                localStorage.setItem('day2day-last-backup-date', today);
                console.log('Daily backup saved to localStorage:', today);
            }, 3000);
        }

        // Check once every 4 hours (instead of every hour)
        setInterval(() => {
            const currentDate = new Date().toISOString().split('T')[0];
            const lastBackup = localStorage.getItem('day2day-last-backup-date');

            if (lastBackup !== currentDate) {
                this.createDailyBackupToStorage();
                localStorage.setItem('day2day-last-backup-date', currentDate);
                console.log('Daily backup saved to localStorage:', currentDate);
            }
        }, 14400000); // Every 4 hours
    }

    // Save daily backup to localStorage rolling window (keeps last 7 days)
    createDailyBackupToStorage() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const backupKey = 'day2day-daily-backups';
            let dailyBackups = {};

            try {
                const existing = localStorage.getItem(backupKey);
                if (existing) dailyBackups = JSON.parse(existing);
            } catch (e) { /* start fresh */ }

            // Save today's snapshot
            dailyBackups[today] = JSON.stringify(this.data);

            // Keep only last 7 days
            const dates = Object.keys(dailyBackups).sort().reverse();
            if (dates.length > 7) {
                dates.slice(7).forEach(d => delete dailyBackups[d]);
            }

            localStorage.setItem(backupKey, JSON.stringify(dailyBackups));
        } catch (error) {
            console.warn('Daily backup to storage failed (likely quota):', error.message);
        }
    }
    
    // Restore from backup file
    restoreFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const backupData = JSON.parse(e.target.result);
                    
                    // Validate backup data structure
                    if (backupData && (backupData.tasks !== undefined || backupData.data)) {
                        const dataToRestore = backupData.data || backupData;
                        
                        // Confirm before restoring
                        if (confirm('This will replace all current data. Are you sure?')) {
                            this.data = dataToRestore;
                            this.saveData();
                            resolve(true);
                            alert('Data restored successfully!');
                            // Reload the page to reflect changes
                            window.location.reload();
                        } else {
                            resolve(false);
                        }
                    } else {
                        reject(new Error('Invalid backup file format'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    createBackup() {
        const backup = {
            timestamp: new Date().toISOString(),
            data: JSON.parse(JSON.stringify(this.data))
        };
        
        let backups = [];
        try {
            const backupsStr = localStorage.getItem(this.backupKey);
            if (backupsStr) {
                backups = JSON.parse(backupsStr);
            }
        } catch (error) {
            console.error('Error loading backups:', error);
        }

        backups.push(backup);
        
        // Keep only last 12 backups (12 months)
        if (backups.length > 12) {
            backups = backups.slice(-12);
        }

        localStorage.setItem(this.backupKey, JSON.stringify(backups));
        this.data.settings.lastBackup = backup.timestamp;
        this.saveData();
        
        return backup;
    }

    setupAutoBackup() {
        // Check if it's time for monthly backup (first of month)
        const now = new Date();
        const lastBackup = this.data.settings?.lastBackup;
        
        if (this.data.settings?.autoBackup) {
            if (!lastBackup || this.shouldCreateBackup(lastBackup, now)) {
                this.createBackup();
            }
        }
    }

    shouldCreateBackup(lastBackupStr, now) {
        const lastBackup = new Date(lastBackupStr);
        const monthsDiff = (now.getFullYear() - lastBackup.getFullYear()) * 12 + 
                          (now.getMonth() - lastBackup.getMonth());
        return monthsDiff >= 1;
    }

    // Data Safety & Recovery
    verifyDataIntegrity() {
        try {
            const data = this.data;
            if (!data) {
                console.warn('Data is null or undefined');
                return false;
            }
            
            // Verify tasks array exists and is valid
            if (data.tasks && !Array.isArray(data.tasks)) {
                console.error('Tasks is not an array');
                return false;
            }
            
            // Check if backup exists
            const backupKey = this.storageKey + '-backup';
            const backupExists = localStorage.getItem(backupKey) !== null;
            
            console.log('Data integrity check:', {
                tasksCount: data.tasks?.length || 0,
                backupExists: backupExists,
                lastSave: localStorage.getItem('day2day-last-save')
            });
            
            return true;
        } catch (error) {
            console.error('Data integrity check failed:', error);
            return false;
        }
    }
    
    restoreFromBackup() {
        try {
            const backupKey = this.storageKey + '-backup';
            const backupData = localStorage.getItem(backupKey);
            
            if (backupData) {
                const parsed = JSON.parse(backupData);
                this.data = parsed;
                this.saveData();
                console.log('Data restored from backup');
                return true;
            } else {
                console.warn('No backup found to restore from');
                return false;
            }
        } catch (error) {
            console.error('Failed to restore from backup:', error);
            return false;
        }
    }
    
    // Utility
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Export singleton instance
const dataManager = new DataManager();

