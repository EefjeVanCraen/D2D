// Task Manager - Handles task operations
class TaskManager {
    constructor() {
        this.currentTaskId = null;
        this.init();
    }

    init() {
        // Setup event listeners and render tasks
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            this.setupEventListeners();
            this.renderTasks();
        }, 0);
    }

    setupEventListeners() {
        // Try both possible button IDs
        const addBtn = document.getElementById('add-task-btn') || document.getElementById('new-task-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openTaskModal());
        }

        const form = document.getElementById('task-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTask();
            });
        }

        const closeBtn = document.getElementById('task-modal-close');
        const cancelBtn = document.getElementById('task-cancel-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeTaskModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeTaskModal());

        // Filter listeners
        const searchInput = document.getElementById('task-search');
        const filters = ['task-filter-department', 'task-filter-tag', 'task-filter-priority', 'task-filter-status'];
        
        if (searchInput) {
            searchInput.addEventListener('input', () => this.renderTasks());
        }

        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.renderTasks());
            }
        });
    }

    openTaskModal(taskId = null, prefillData = null) {
        this.currentTaskId = taskId;
        const modal = document.getElementById('task-modal');
        if (!modal) {
            console.error('Task modal not found');
            return;
        }
        
        const title = document.getElementById('task-modal-title');
        if (!title) {
            console.error('Task modal title not found');
            return;
        }
        
        if (taskId) {
            title.textContent = 'Edit Task';
            const task = dataManager.getTasks().find(t => t.id === taskId);
            if (task) {
                const headlineEl = document.getElementById('task-headline');
                const descEl = document.getElementById('task-description');
                const dueDateEl = document.getElementById('task-due-date');
                const priorityEl = document.getElementById('task-priority');
                const tagEl = document.getElementById('task-tag');
                const specialTagEl = document.getElementById('task-special-tag');
                
                if (headlineEl) headlineEl.value = task.headline || '';
                if (descEl) descEl.value = task.description || '';
                if (dueDateEl) dueDateEl.value = task.dueDate || '';
                if (priorityEl) priorityEl.value = task.priority || 'medium';
                if (tagEl) tagEl.value = task.tag || '';
                if (specialTagEl) specialTagEl.value = task.specialTag || '';
            }
        } else {
            title.textContent = 'Add Task';
            const form = document.getElementById('task-form');
            if (form) form.reset();
            
            // Pre-fill data if provided (from meeting or idea)
            if (prefillData) {
                const headlineEl = document.getElementById('task-headline');
                const descEl = document.getElementById('task-description');
                const dueDateEl = document.getElementById('task-due-date');
                
                if (prefillData.headline && headlineEl) headlineEl.value = prefillData.headline;
                if (prefillData.description && descEl) descEl.value = prefillData.description;
                if (prefillData.dueDate && dueDateEl) dueDateEl.value = prefillData.dueDate;
                
                this.prefillDepartments = prefillData.departments;
                this.prefillPeople = prefillData.people;
            } else {
                this.prefillDepartments = null;
                this.prefillPeople = null;
            }
        }

        this.populateSelects(taskId);
        modal.classList.add('active');
    }

    populateSelects(taskId = null) {
        const task = taskId ? dataManager.getTasks().find(t => t.id === taskId) : null;
        
        // Convert old single values to arrays for backward compatibility
        let taskDepartments = task ? (Array.isArray(task.departments) ? task.departments : 
            (task.department ? [task.department] : [])) : [];
        let taskPeople = task ? (Array.isArray(task.people) ? task.people : 
            (task.person ? [task.person] : ['Eefje'])) : [];
        
        // Use pre-filled data if available (from meeting or idea)
        if (!taskId && this.prefillDepartments) {
            taskDepartments = Array.isArray(this.prefillDepartments) ? this.prefillDepartments : [this.prefillDepartments];
        }
        if (!taskId && this.prefillPeople) {
            taskPeople = Array.isArray(this.prefillPeople) ? this.prefillPeople : [this.prefillPeople];
        }
        
        // Populate departments checkboxes (including sub-departments)
        const deptContainer = document.getElementById('task-departments');
        if (!deptContainer) return;
        
        const departments = dataManager.getDepartments();
        deptContainer.innerHTML = '';
        departments.forEach(dept => {
            // Check if department is selected (by name or id)
            const isChecked = taskDepartments.includes(dept.name) || taskDepartments.includes(dept.id) ||
                (!taskId && !this.prefillDepartments && dept.name === 'C&G Product Strategy');
            const checkbox = document.createElement('label');
            checkbox.className = 'checkbox-item';
            checkbox.innerHTML = `
                <input type="checkbox" value="${dept.id}" data-name="${dept.name}" ${isChecked ? 'checked' : ''} onchange="taskManager.updatePeopleFromDepartments()">
                <span>${dept.name}</span>
            `;
            deptContainer.appendChild(checkbox);
            
            // Add sub-departments
            if (dept.subDepartments && dept.subDepartments.length > 0) {
                dept.subDepartments.forEach(subDept => {
                    const subChecked = taskDepartments.includes(subDept.id) ||
                        (!taskId && !this.prefillDepartments && dept.name === 'C&G Product Strategy');
                    const subCheckbox = document.createElement('label');
                    subCheckbox.className = 'checkbox-item';
                    subCheckbox.style.marginLeft = '20px';
                    subCheckbox.innerHTML = `
                        <input type="checkbox" value="${subDept.id}" data-name="${subDept.name}" data-parent="${dept.id}" ${subChecked ? 'checked' : ''} onchange="taskManager.updatePeopleFromDepartments()">
                        <span>${dept.name} > ${subDept.name}</span>
                    `;
                    deptContainer.appendChild(subCheckbox);
                });
            }
        });

        // Populate people based on selected departments
        this.updatePeopleFromDepartments(taskId);

        // Populate tags
        const tagSelect = document.getElementById('task-tag');
        if (tagSelect) {
            const tags = dataManager.getTags();
            tagSelect.innerHTML = '<option value="">None</option>';
            tags.forEach(tag => {
                tagSelect.innerHTML += `<option value="${tag.name}">${tag.name}</option>`;
            });
        }
    }

    saveTask() {
        const headlineEl = document.getElementById('task-headline');
        if (!headlineEl) {
            alert('Error: Task form not found');
            return;
        }
        
        const headline = headlineEl.value.trim();
        if (!headline) {
            alert('Headline is required');
            return;
        }

        // Get selected departments
        const deptCheckboxes = document.querySelectorAll('#task-departments input[type="checkbox"]:checked');
        const deptIds = Array.from(deptCheckboxes).map(cb => cb.value);
        
        // Ensure default department if none selected
        let departments = deptIds.length > 0 ? deptIds : [];
        if (departments.length === 0) {
            const defaultDept = dataManager.getDepartments().find(d => d.name === 'C&G Product Strategy');
            if (defaultDept) {
                departments.push(defaultDept.id);
            } else {
                alert('Error: Default department not found. Please select a department.');
                return;
            }
        }

        // Get selected people
        const peopleCheckboxes = document.querySelectorAll('#task-people input[type="checkbox"]:checked');
        const people = Array.from(peopleCheckboxes).map(cb => cb.value);
        // Ensure default person if none selected
        if (people.length === 0) {
            people.push('Eefje');
        }

        const task = {
            headline: headline.trim(),
            description: document.getElementById('task-description')?.value.trim() || '',
            dueDate: document.getElementById('task-due-date')?.value || '',
            priority: document.getElementById('task-priority')?.value || 'medium',
            departments: departments,
            people: people,
            tag: document.getElementById('task-tag')?.value || '',
            specialTag: document.getElementById('task-special-tag')?.value || null,
            status: this.currentTaskId ? (dataManager.getTasks().find(t => t.id === this.currentTaskId)?.status || 'active') : 'active'
        };

        let savedTask = null;
        try {
            if (this.currentTaskId) {
                savedTask = dataManager.updateTask(this.currentTaskId, task);
            } else {
                savedTask = dataManager.addTask(task);
            }

            if (!savedTask) {
                alert('Error: Task was not saved. Please try again.');
                return;
            }

            // Force immediate data reload
            dataManager.loadData();
            
            // Verify the task was actually saved
            const verifyTasks = dataManager.getTasks();
            const foundTask = verifyTasks.find(t => t.id === savedTask.id);
            if (!foundTask) {
                alert('Warning: Task may not have been saved correctly. Please check your data.');
                return;
            }
            
            this.closeTaskModal();
            
            // Clear all filters to ensure task is visible
            const taskDeptFilter = document.getElementById('task-filter-department');
            const taskTagFilter = document.getElementById('task-filter-tag');
            const taskPriorityFilter = document.getElementById('task-filter-priority');
            const taskStatusFilter = document.getElementById('task-filter-status');
            const taskSearch = document.getElementById('task-search');
            
            if (taskDeptFilter) taskDeptFilter.value = '';
            if (taskTagFilter) taskTagFilter.value = '';
            if (taskPriorityFilter) taskPriorityFilter.value = '';
            if (taskStatusFilter) taskStatusFilter.value = '';
            if (taskSearch) taskSearch.value = '';
            
            // Clear sidebar filter
            const sidebarFilter = document.getElementById('sidebar-dept-filter');
            if (sidebarFilter) sidebarFilter.value = '';
            window.currentDeptFilter = '';
            
            // Force render tasks immediately
            this.renderTasks();
            
            // Refresh widgets
            setTimeout(() => {
                if (widgetManager) widgetManager.refreshWidgets();
            }, 100);
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Error saving task: ' + error.message);
        }
    }

    closeTaskModal() {
        const modal = document.getElementById('task-modal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.currentTaskId = null;
        const form = document.getElementById('task-form');
        if (form) form.reset();
    }

    openTask(taskId) {
        this.openTaskModal(taskId);
    }

    deleteTask(taskId, permanent = false) {
        if (confirm(permanent ? 'Permanently delete this task?' : 'Move task to recycle bin?')) {
            const success = dataManager.deleteTask(taskId, permanent);
            if (success) {
                dataManager.loadData();
                this.renderTasks();
                if (widgetManager) widgetManager.refreshWidgets();
            }
        }
    }

    toggleTaskComplete(taskId) {
        const task = dataManager.getTasks().find(t => t.id === taskId);
        if (task) {
            const newStatus = task.status === 'completed' ? 'active' : 'completed';
            dataManager.updateTask(taskId, { status: newStatus });
            dataManager.loadData();
            this.renderTasks();
            if (widgetManager) widgetManager.refreshWidgets();
        }
    }

    updatePeopleFromDepartments(taskId = null) {
        const peopleContainer = document.getElementById('task-people');
        if (!peopleContainer) return;

        // Get selected departments/sub-departments
        const selectedDepts = Array.from(document.querySelectorAll('#task-departments input[type="checkbox"]:checked'))
            .map(cb => cb.value);

        const task = taskId ? dataManager.getTasks().find(t => t.id === taskId) : null;
        let taskPeople = task ? (Array.isArray(task.people) ? task.people : 
            (task.person ? [task.person] : [])) : [];
        
        // Use pre-filled people if available
        if (!taskId && this.prefillPeople) {
            taskPeople = Array.isArray(this.prefillPeople) ? this.prefillPeople : [this.prefillPeople];
        }

        peopleContainer.innerHTML = '';

        if (selectedDepts.length === 0) {
            // Show all people if no department selected
            const people = dataManager.getPeople();
            people.forEach(person => {
                const isChecked = taskPeople.includes(person.name) || 
                    (!taskId && !this.prefillPeople && person.name === 'Eefje');
                const checkbox = document.createElement('label');
                checkbox.className = 'checkbox-item';
                checkbox.innerHTML = `
                    <input type="checkbox" value="${person.name}" ${isChecked ? 'checked' : ''}>
                    <span>${person.name}</span>
                `;
                peopleContainer.appendChild(checkbox);
            });
            return;
        }

        // Collect people from selected departments/sub-departments
        const allPeople = new Set();
        const departments = dataManager.getDepartments();

        selectedDepts.forEach(deptId => {
            // Check if it's a main department
            let dept = departments.find(d => d.id === deptId);
            if (dept) {
                (dept.people || []).forEach(p => allPeople.add(p.name));
                return;
            }

            // Check if it's a sub-department
            for (const d of departments) {
                if (d.subDepartments) {
                    const subDept = d.subDepartments.find(sd => sd.id === deptId);
                    if (subDept) {
                        (subDept.people || []).forEach(p => allPeople.add(p.name));
                        break;
                    }
                }
            }
        });

        // Display people
        Array.from(allPeople).sort().forEach(personName => {
            const isChecked = taskPeople.includes(personName) || 
                (!taskId && personName === 'Eefje');
            const checkbox = document.createElement('label');
            checkbox.className = 'checkbox-item';
            checkbox.innerHTML = `
                <input type="checkbox" value="${personName}" ${isChecked ? 'checked' : ''}>
                <span>${personName}</span>
            `;
            peopleContainer.appendChild(checkbox);
        });

        if (allPeople.size === 0) {
            peopleContainer.innerHTML = '<small style="color: var(--text-secondary);">No people in selected departments</small>';
        }
    }

    getDepartmentName(deptId) {
        const departments = dataManager.getDepartments();
        for (const dept of departments) {
            if (dept.id === deptId || dept.name === deptId) {
                return dept.name;
            }
            if (dept.subDepartments) {
                const subDept = dept.subDepartments.find(sd => sd.id === deptId);
                if (subDept) {
                    return `${dept.name} > ${subDept.name}`;
                }
            }
        }
        return deptId;
    }

    isOverdue(task) {
        if (!task.dueDate || task.status === 'completed') return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
    }

    renderTasks() {
        // Try both possible container IDs
        let container = document.getElementById('tasks-list');
        if (!container) {
            container = document.getElementById('tasks-list-container');
        }
        if (!container) {
            return;
        }

        // Force reload data
        dataManager.loadData();
        let tasks = dataManager.getTasks();
        
        // Filter out tasks in recycle bin
        const recycleBin = dataManager.getData().recycleBin || [];
        const recycleBinIds = new Set(recycleBin.filter(item => item.type === 'task').map(item => item.id));
        tasks = tasks.filter(task => !recycleBinIds.has(task.id));
        
        // Only filter out tasks without headline
        tasks = tasks.filter(task => {
            return task.headline && task.headline.trim().length > 0;
        });
        
        // Ensure all tasks have required fields
        tasks = tasks.map(task => {
            if (!task.status) task.status = 'active';
            if (!task.headline || task.headline.trim().length === 0) {
                task.headline = 'Untitled Task';
            }
            // Ensure departments is an array
            if (!task.departments || task.departments.length === 0) {
                if (task.department) {
                    const dept = dataManager.getDepartments().find(d => d.id === task.department || d.name === task.department);
                    task.departments = dept ? [dept.id] : [task.department];
                } else {
                    const defaultDept = dataManager.getDepartments().find(d => d.name === 'C&G Product Strategy');
                    if (defaultDept) {
                        task.departments = [defaultDept.id];
                    }
                }
            }
            // Ensure people is an array
            if (!task.people || task.people.length === 0) {
                if (task.person) {
                    task.people = Array.isArray(task.person) ? task.person : [task.person];
                } else {
                    task.people = ['Eefje'];
                }
            }
            return task;
        });

        // Apply filters - IGNORE SIDEBAR FILTER IN TASKS SECTION
        const search = document.getElementById('task-search')?.value.toLowerCase() || '';
        const taskDeptFilter = document.getElementById('task-filter-department')?.value || '';
        const tagFilter = document.getElementById('task-filter-tag')?.value || '';
        const priorityFilter = document.getElementById('task-filter-priority')?.value || '';
        const statusFilter = document.getElementById('task-filter-status')?.value || '';

        tasks = tasks.filter(task => {
            if (search && !task.headline.toLowerCase().includes(search) && 
                !(task.description || '').toLowerCase().includes(search)) {
                return false;
            }
            
            if (taskDeptFilter) {
                const taskDepts = Array.isArray(task.departments) ? task.departments : 
                    (task.department ? [task.department] : []);
                
                if (taskDepts.length > 0) {
                    const matches = taskDepts.includes(taskDeptFilter) || 
                        taskDepts.some(d => {
                            const dept = dataManager.getDepartments().find(dep => dep.id === d || dep.name === d);
                            return dept && (dept.id === taskDeptFilter || dept.name === taskDeptFilter);
                        });
                    if (!matches) return false;
                }
            }
            
            if (tagFilter && task.tag !== tagFilter) return false;
            if (priorityFilter && task.priority !== priorityFilter) return false;
            if (statusFilter) {
                if (statusFilter === 'overdue') {
                    if (!this.isOverdue(task)) return false;
                } else {
                    const taskStatus = task.status || 'active';
                    if (taskStatus !== statusFilter) return false;
                }
            }
            return true;
        });

        // Sort by due date
        tasks.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

        container.innerHTML = '';

        if (tasks.length === 0) {
            const hasFilters = search || taskDeptFilter || tagFilter || priorityFilter || statusFilter;
            if (hasFilters) {
                container.innerHTML = '<p>No tasks found matching the current filters. <button onclick="taskManager.clearFilters()" style="margin-left: 10px; padding: 4px 12px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">Clear Filters</button></p>';
            } else {
                container.innerHTML = '<p>No tasks found. Create your first task using the "Add Task" button.</p>';
            }
            return;
        }

        tasks.forEach(task => {
            const card = document.createElement('div');
            const isOverdue = this.isOverdue(task);
            card.className = `task-card ${task.status === 'completed' ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`;
            
            const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
            const priorityClass = `badge-${task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'primary'}`;
            const overdueBadge = isOverdue ? '<span class="badge badge-danger" style="margin-left: 8px;">OVERDUE</span>' : '';
            
            card.innerHTML = `
                <div class="card-header">
                    <div>
                        <div class="card-title">${task.headline}${overdueBadge}</div>
                        ${task.description ? `<p>${task.description}</p>` : ''}
                    </div>
                    <div class="card-actions">
                        <button class="card-btn" onclick="taskManager.toggleTaskComplete('${task.id}')" 
                                title="${task.status === 'completed' ? 'Mark as active' : 'Mark as complete'}">
                            ${task.status === 'completed' ? '↩️' : '✓'}
                        </button>
                        <button class="card-btn" onclick="taskManager.openTask('${task.id}')" title="Edit">✏️</button>
                        <button class="card-btn" onclick="taskManager.deleteTask('${task.id}')" title="Delete">🗑️</button>
                    </div>
                </div>
                <div class="card-meta">
                    <span>Due: ${dueDate}</span>
                    ${task.priority ? `<span class="badge ${priorityClass}">${task.priority}</span>` : ''}
                    ${(() => {
                        const depts = Array.isArray(task.departments) ? task.departments : 
                            (task.department ? [task.department] : []);
                        return depts.length > 0 ? depts.map(d => {
                            const deptName = taskManager.getDepartmentName(d);
                            return `<span class="badge badge-info">${deptName}</span>`;
                        }).join(' ') : '';
                    })()}
                    ${(() => {
                        const people = Array.isArray(task.people) ? task.people : 
                            (task.person ? [task.person] : []);
                        return people.length > 0 ? people.map(p => `<span class="badge badge-secondary">${p}</span>`).join(' ') : '';
                    })()}
                    ${task.tag ? `<span class="badge badge-primary">${task.tag}</span>` : ''}
                </div>
            `;

            container.appendChild(card);
        });
    }

    clearFilters() {
        const taskDeptFilter = document.getElementById('task-filter-department');
        const taskTagFilter = document.getElementById('task-filter-tag');
        const taskPriorityFilter = document.getElementById('task-filter-priority');
        const taskStatusFilter = document.getElementById('task-filter-status');
        const taskSearch = document.getElementById('task-search');
        
        if (taskDeptFilter) taskDeptFilter.value = '';
        if (taskTagFilter) taskTagFilter.value = '';
        if (taskPriorityFilter) taskPriorityFilter.value = '';
        if (taskStatusFilter) taskStatusFilter.value = '';
        if (taskSearch) taskSearch.value = '';
        
        // Clear sidebar filter
        const sidebarFilter = document.getElementById('sidebar-dept-filter');
        if (sidebarFilter) sidebarFilter.value = '';
        window.currentDeptFilter = '';
        
        this.renderTasks();
    }
}

// Create taskManager instance immediately and make it globally available
// The instance will initialize itself when the DOM is ready
const taskManager = new TaskManager();
window.taskManager = taskManager;
