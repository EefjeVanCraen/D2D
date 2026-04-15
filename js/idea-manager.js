// Idea Manager - Handles idea operations
class IdeaManager {
    constructor() {
        this.currentIdeaId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderIdeas();
    }

    setupEventListeners() {
        const addBtn = document.getElementById('add-idea-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openIdeaModal());
        }

        const form = document.getElementById('idea-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveIdea();
            });
        }

        const closeBtn = document.getElementById('idea-modal-close');
        const cancelBtn = document.getElementById('idea-cancel-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeIdeaModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeIdeaModal());

        // Filter listeners
        const searchInput = document.getElementById('idea-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.renderIdeas());
        }

        const filters = ['idea-filter-department', 'idea-filter-tag'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.renderIdeas());
            }
        });
    }

    openIdeaModal(ideaId = null) {
        this.currentIdeaId = ideaId;
        const modal = document.getElementById('idea-modal');
        const title = document.getElementById('idea-modal-title');
        
        if (ideaId) {
            title.textContent = 'Edit Idea';
            const idea = dataManager.getIdeas().find(i => i.id === ideaId);
            if (idea) {
                document.getElementById('idea-headline').value = idea.headline || '';
                document.getElementById('idea-description').value = idea.description || '';
                document.getElementById('idea-tag').value = idea.tag || '';
            }
        } else {
            title.textContent = 'Add Idea';
            document.getElementById('idea-form').reset();
        }

        this.populateSelects(ideaId);
        
        modal.classList.add('active');
    }

    populateSelects(ideaId = null) {
        const idea = ideaId ? dataManager.getIdeas().find(i => i.id === ideaId) : null;
        
        // Convert old single values to arrays for backward compatibility
        const ideaDepartments = idea ? (Array.isArray(idea.departments) ? idea.departments : 
            (idea.department ? [idea.department] : [])) : [];
        const ideaPeople = idea ? (Array.isArray(idea.people) ? idea.people : 
            (idea.person ? [idea.person] : ['Eefje'])) : [];
        
        // Populate departments checkboxes (including sub-departments)
        const deptContainer = document.getElementById('idea-departments');
        const departments = dataManager.getDepartments();
        deptContainer.innerHTML = '';
        departments.forEach(dept => {
            // Check if department is selected (by name or id)
            const isChecked = ideaDepartments.includes(dept.name) || ideaDepartments.includes(dept.id) ||
                (!ideaId && dept.name === 'C&G Product Strategy');
            const checkbox = document.createElement('label');
            checkbox.className = 'checkbox-item';
            checkbox.innerHTML = `
                <input type="checkbox" value="${dept.id}" data-name="${dept.name}" ${isChecked ? 'checked' : ''} onchange="ideaManager.updatePeopleFromDepartments()">
                <span>${dept.name}</span>
            `;
            deptContainer.appendChild(checkbox);
            
            // Add sub-departments
            if (dept.subDepartments && dept.subDepartments.length > 0) {
                dept.subDepartments.forEach(subDept => {
                    const subChecked = ideaDepartments.includes(subDept.id) ||
                        (!ideaId && dept.name === 'C&G Product Strategy');
                    const subCheckbox = document.createElement('label');
                    subCheckbox.className = 'checkbox-item';
                    subCheckbox.style.marginLeft = '20px';
                    subCheckbox.innerHTML = `
                        <input type="checkbox" value="${subDept.id}" data-name="${subDept.name}" data-parent="${dept.id}" ${subChecked ? 'checked' : ''} onchange="ideaManager.updatePeopleFromDepartments()">
                        <span>${dept.name} > ${subDept.name}</span>
                    `;
                    deptContainer.appendChild(subCheckbox);
                });
            }
        });

        // Populate people based on selected departments
        this.updatePeopleFromDepartments(ideaId);
    }

    updatePeopleFromDepartments(ideaId = null) {
        const peopleContainer = document.getElementById('idea-people');
        if (!peopleContainer) return;

        // Get selected departments/sub-departments
        const selectedDepts = Array.from(document.querySelectorAll('#idea-departments input[type="checkbox"]:checked'))
            .map(cb => cb.value);

        const idea = ideaId ? dataManager.getIdeas().find(i => i.id === ideaId) : null;
        const ideaPeople = idea ? (Array.isArray(idea.people) ? idea.people : 
            (idea.person ? [idea.person] : [])) : [];

        peopleContainer.innerHTML = '';

        if (selectedDepts.length === 0) {
            // Show all people if no department selected
            const people = dataManager.getPeople();
            people.forEach(person => {
                const isChecked = ideaPeople.includes(person.name) || 
                    (!ideaId && person.name === 'Eefje');
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
            const isChecked = ideaPeople.includes(personName) || 
                (!ideaId && personName === 'Eefje');
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

        // Populate tags (called from populateSelects flow)
        const tagSelect = document.getElementById('idea-tag');
        if (tagSelect) {
            const tags = dataManager.getTags();
            tagSelect.innerHTML = '<option value="">None</option>';
            tags.forEach(tag => {
                tagSelect.innerHTML += `<option value="${tag.name}">${tag.name}</option>`;
            });
        }
    }

    saveIdea() {
        const headline = document.getElementById('idea-headline').value.trim();
        if (!headline) {
            alert('Headline is required');
            return;
        }

        // Get selected departments (use IDs, but store names for backward compatibility)
        const deptCheckboxes = document.querySelectorAll('#idea-departments input[type="checkbox"]:checked');
        const deptIds = Array.from(deptCheckboxes).map(cb => cb.value);
        
        // Ensure default department if none selected
        let departments = deptIds.length > 0 ? deptIds : [];
        if (departments.length === 0) {
            const defaultDept = dataManager.getDepartments().find(d => d.name === 'C&G Product Strategy');
            if (defaultDept) {
                departments.push(defaultDept.id);
            }
        }

        // Get selected people
        const peopleCheckboxes = document.querySelectorAll('#idea-people input[type="checkbox"]:checked');
        const people = Array.from(peopleCheckboxes).map(cb => cb.value);
        // Ensure default person if none selected
        if (people.length === 0) {
            people.push('Eefje');
        }

        const idea = {
            headline,
            description: document.getElementById('idea-description').value.trim(),
            departments: departments,
            people: people,
            tag: document.getElementById('idea-tag').value
        };

        if (this.currentIdeaId) {
            dataManager.updateIdea(this.currentIdeaId, idea);
        } else {
            dataManager.addIdea(idea);
        }

        this.closeIdeaModal();
        this.renderIdeas();
    }

    closeIdeaModal() {
        document.getElementById('idea-modal').classList.remove('active');
        this.currentIdeaId = null;
        document.getElementById('idea-form').reset();
    }

    openIdea(ideaId) {
        this.openIdeaModal(ideaId);
    }

    createTaskFromIdea(ideaId) {
        const idea = dataManager.getIdeas().find(i => i.id === ideaId);
        if (!idea) return;

        // Pre-fill task data from idea
        const prefillData = {
            headline: idea.headline,
            description: idea.description || '',
            departments: Array.isArray(idea.departments) ? idea.departments : 
                (idea.department ? [idea.department] : []),
            people: Array.isArray(idea.people) ? idea.people : 
                (idea.person ? [idea.person] : [])
        };

        // Open task modal with pre-filled data
        taskManager.openTaskModal(null, prefillData);
    }

    deleteIdea(ideaId, permanent = false) {
        if (confirm(permanent ? 'Permanently delete this idea?' : 'Move idea to recycle bin?')) {
            dataManager.deleteIdea(ideaId, permanent);
            this.renderIdeas();
        }
    }

    renderIdeas() {
        const container = document.getElementById('ideas-list');
        if (!container) return;

        let ideas = dataManager.getIdeas();

        // Apply filters
        const search = document.getElementById('idea-search')?.value.toLowerCase() || '';
        const deptFilter = document.getElementById('idea-filter-department')?.value || window.currentDeptFilter || '';
        const tagFilter = document.getElementById('idea-filter-tag')?.value || '';

        ideas = ideas.filter(idea => {
            if (search && !idea.headline.toLowerCase().includes(search) && 
                !(idea.description || '').toLowerCase().includes(search)) {
                return false;
            }
            // Handle both old (single) and new (array) department format
            if (deptFilter) {
                const ideaDepts = Array.isArray(idea.departments) ? idea.departments : 
                    (idea.department ? [idea.department] : []);
                // Check if filter matches by ID or name
                const matches = ideaDepts.includes(deptFilter) || 
                    ideaDepts.some(d => {
                        const dept = dataManager.getDepartments().find(dep => dep.id === d || dep.name === d);
                        return dept && (dept.id === deptFilter || dept.name === deptFilter);
                    });
                if (!matches) return false;
            }
            if (tagFilter && idea.tag !== tagFilter) return false;
            return true;
        });

        // Sort by creation date (newest first)
        ideas.sort((a, b) => new Date(b.created) - new Date(a.created));

        container.innerHTML = '';

        if (ideas.length === 0) {
            container.innerHTML = '<p>No ideas found.</p>';
            return;
        }

        ideas.forEach(idea => {
            const card = document.createElement('div');
            card.className = 'idea-card';
            
            const createdDate = new Date(idea.created).toLocaleDateString();
            
            card.innerHTML = `
                <div class="card-header">
                    <div>
                        <div class="card-title">${idea.headline}</div>
                        ${idea.description ? `<p>${idea.description}</p>` : ''}
                    </div>
                    <div class="card-actions">
                        <button class="card-btn" onclick="ideaManager.createTaskFromIdea('${idea.id}')" title="Create Task">✓</button>
                        <button class="card-btn" onclick="ideaManager.openIdea('${idea.id}')" title="Edit">✏️</button>
                        <button class="card-btn" onclick="ideaManager.deleteIdea('${idea.id}')" title="Delete">🗑️</button>
                    </div>
                </div>
                <div class="card-meta">
                    <span>Created: ${createdDate}</span>
                    ${(() => {
                        const depts = Array.isArray(idea.departments) ? idea.departments : 
                            (idea.department ? [idea.department] : []);
                        return depts.length > 0 ? depts.map(d => `<span class="badge badge-info">Dept: ${d}</span>`).join(' ') : '';
                    })()}
                    ${(() => {
                        const people = Array.isArray(idea.people) ? idea.people : 
                            (idea.person ? [idea.person] : []);
                        return people.length > 0 ? people.map(p => `<span class="badge badge-secondary">${p}</span>`).join(' ') : '';
                    })()}
                    ${idea.tag ? `<span class="badge badge-primary">${idea.tag}</span>` : ''}
                </div>
            `;

            container.appendChild(card);
        });
    }
}

const ideaManager = new IdeaManager();

