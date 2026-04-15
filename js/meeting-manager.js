// Meeting Manager - Handles meeting operations
class MeetingManager {
    constructor() {
        this.currentMeetingId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderMeetings();
    }

    setupEventListeners() {
        const addBtn = document.getElementById('add-meeting-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openMeetingModal());
        }

        const form = document.getElementById('meeting-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveMeeting();
            });
        }

        const closeBtn = document.getElementById('meeting-modal-close');
        const cancelBtn = document.getElementById('meeting-cancel-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeMeetingModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeMeetingModal());

        // Filter listeners
        const searchInput = document.getElementById('meeting-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.renderMeetings());
        }

        const filters = ['meeting-filter-department'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.renderMeetings());
            }
        });

        // Department change listener to update people tags
        const deptSelect = document.getElementById('meeting-department');
        if (deptSelect) {
            deptSelect.addEventListener('change', () => this.updatePeopleTags());
        }
    }

    openMeetingModal(meetingId = null) {
        this.currentMeetingId = meetingId;
        const modal = document.getElementById('meeting-modal');
        const title = document.getElementById('meeting-modal-title');
        
        if (meetingId) {
            title.textContent = 'Edit Meeting';
            const meeting = dataManager.getMeetings().find(m => m.id === meetingId);
            if (meeting) {
                document.getElementById('meeting-title').value = meeting.title || '';
                document.getElementById('meeting-date').value = meeting.date || '';
                document.getElementById('meeting-internal-external').value = meeting.internalExternal || 'Internal';
                document.getElementById('meeting-department').value = meeting.department || '';
                document.getElementById('meeting-description').value = meeting.description || '';
            }
        } else {
            title.textContent = 'Add Meeting';
            document.getElementById('meeting-form').reset();
            document.getElementById('meeting-internal-external').value = 'Internal';
        }

        this.populateSelects(meetingId);
        
        modal.classList.add('active');
    }

    populateSelects(meetingId = null) {
        // Populate departments (including sub-departments)
        const deptSelect = document.getElementById('meeting-department');
        const departments = dataManager.getDepartments();
        deptSelect.innerHTML = '<option value="">None</option>';
        departments.forEach(dept => {
            deptSelect.innerHTML += `<option value="${dept.id}">${dept.name}</option>`;
            // Add sub-departments
            if (dept.subDepartments && dept.subDepartments.length > 0) {
                dept.subDepartments.forEach(subDept => {
                    deptSelect.innerHTML += `<option value="${subDept.id}">${dept.name} > ${subDept.name}</option>`;
                });
            }
        });

        // Populate people tags based on selected department
        this.updatePeopleTags(meetingId);
    }

    updatePeopleTags(meetingId = null) {
        const deptSelect = document.getElementById('meeting-department');
        const peopleContainer = document.getElementById('meeting-people');
        if (!deptSelect || !peopleContainer) return;

        const selectedDeptId = deptSelect.value;
        const meeting = meetingId ? dataManager.getMeetings().find(m => m.id === meetingId) : null;
        const meetingPeople = meeting ? (Array.isArray(meeting.people) ? meeting.people : []) : [];

        peopleContainer.innerHTML = '';

        if (!selectedDeptId) {
            peopleContainer.innerHTML = '<small style="color: var(--text-secondary);">Select a department to see people</small>';
            return;
        }

        // Find department or sub-department
        const departments = dataManager.getDepartments();
        let selectedDept = departments.find(d => d.id === selectedDeptId);
        let selectedSubDept = null;

        if (!selectedDept) {
            // Check if it's a sub-department
            for (const dept of departments) {
                if (dept.subDepartments) {
                    selectedSubDept = dept.subDepartments.find(sd => sd.id === selectedDeptId);
                    if (selectedSubDept) {
                        selectedDept = dept;
                        break;
                    }
                }
            }
        }

        const people = selectedSubDept ? (selectedSubDept.people || []) : (selectedDept ? (selectedDept.people || []) : []);

        if (people.length === 0) {
            peopleContainer.innerHTML = '<small style="color: var(--text-secondary);">No people in this department/sub-department</small>';
            return;
        }

        people.forEach(person => {
            const isChecked = meetingPeople.includes(person.name);
            const checkbox = document.createElement('label');
            checkbox.className = 'checkbox-item';
            checkbox.innerHTML = `
                <input type="checkbox" value="${person.name}" ${isChecked ? 'checked' : ''}>
                <span>${person.name}</span>
            `;
            peopleContainer.appendChild(checkbox);
        });
    }

    saveMeeting() {
        const title = document.getElementById('meeting-title').value.trim();
        if (!title) {
            alert('Meeting title is required');
            return;
        }

        // Get selected people
        const peopleCheckboxes = document.querySelectorAll('#meeting-people input[type="checkbox"]:checked');
        const people = Array.from(peopleCheckboxes).map(cb => cb.value);

        const meeting = {
            title,
            date: document.getElementById('meeting-date').value,
            internalExternal: document.getElementById('meeting-internal-external').value || 'Internal',
            department: document.getElementById('meeting-department').value,
            description: document.getElementById('meeting-description').value.trim(),
            people: people
        };

        if (this.currentMeetingId) {
            dataManager.updateMeeting(this.currentMeetingId, meeting);
        } else {
            dataManager.addMeeting(meeting);
        }

        this.closeMeetingModal();
        this.renderMeetings();
    }

    closeMeetingModal() {
        document.getElementById('meeting-modal').classList.remove('active');
        this.currentMeetingId = null;
        document.getElementById('meeting-form').reset();
    }

    deleteMeeting(meetingId) {
        if (confirm('Delete this meeting?')) {
            dataManager.deleteMeeting(meetingId);
            this.renderMeetings();
        }
    }

    renderMeetings() {
        const container = document.getElementById('meetings-list');
        if (!container) return;

        let meetings = dataManager.getMeetings();

        // Populate filters if needed
        this.populateFilters();

        // Apply filters
        const search = document.getElementById('meeting-search')?.value.toLowerCase() || '';
        const deptFilter = document.getElementById('meeting-filter-department')?.value || '';

        meetings = meetings.filter(meeting => {
            if (search && !meeting.title.toLowerCase().includes(search) && 
                !(meeting.description || '').toLowerCase().includes(search)) {
                return false;
            }
            if (deptFilter && meeting.department !== deptFilter) return false;
            return true;
        });

        // Sort by date (newest first)
        meetings.sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(b.date) - new Date(a.date);
        });

        container.innerHTML = '';

        if (meetings.length === 0) {
            container.innerHTML = '<p>No meetings found.</p>';
            return;
        }

        meetings.forEach(meeting => {
            const card = document.createElement('div');
            card.className = 'meeting-card';
            
            const date = meeting.date ? new Date(meeting.date).toLocaleDateString() : 'No date';
            const internalExternal = meeting.internalExternal || 'Internal';
            const dept = meeting.department ? this.getDepartmentName(meeting.department) : '';
            
            card.innerHTML = `
                <div class="card-header">
                    <div>
                        <div class="card-title">${meeting.title}</div>
                        ${meeting.description ? `<p style="max-height: 100px; overflow-y: auto; margin-top: 8px;">${meeting.description}</p>` : ''}
                    </div>
                    <div class="card-actions">
                        <button class="card-btn" onclick="meetingManager.createTaskFromMeeting('${meeting.id}')" title="Create Task">✓</button>
                        <button class="card-btn" onclick="meetingManager.openMeeting('${meeting.id}')" title="Edit">✏️</button>
                        <button class="card-btn" onclick="meetingManager.deleteMeeting('${meeting.id}')" title="Delete">🗑️</button>
                    </div>
                </div>
                <div class="card-meta">
                    <span>Date: ${date}</span>
                    <span class="badge ${internalExternal === 'Internal' ? 'badge-success' : 'badge-warning'}">${internalExternal}</span>
                    ${dept ? `<span class="badge badge-info">${dept}</span>` : ''}
                    ${(() => {
                        const people = Array.isArray(meeting.people) ? meeting.people : [];
                        return people.length > 0 ? people.map(p => `<span class="badge badge-secondary">${p}</span>`).join(' ') : '';
                    })()}
                </div>
            `;

            container.appendChild(card);
        });
    }

    getDepartmentName(deptId) {
        const departments = dataManager.getDepartments();
        for (const dept of departments) {
            if (dept.id === deptId) {
                return dept.name;
            }
            if (dept.subDepartments) {
                const subDept = dept.subDepartments.find(sd => sd.id === deptId);
                if (subDept) {
                    return `${dept.name} > ${subDept.name}`;
                }
            }
        }
        return '';
    }

    openMeeting(meetingId) {
        this.openMeetingModal(meetingId);
    }

    createTaskFromMeeting(meetingId) {
        const meeting = dataManager.getMeetings().find(m => m.id === meetingId);
        if (!meeting) return;

        // Pre-fill task data from meeting
        const prefillData = {
            headline: `Follow up: ${meeting.title}`,
            description: meeting.description || '',
            dueDate: meeting.date || '',
            departments: meeting.department ? [meeting.department] : [],
            people: Array.isArray(meeting.people) ? meeting.people : []
        };

        // Open task modal with pre-filled data
        taskManager.openTaskModal(null, prefillData);
    }

    populateFilters() {
        // Populate department filter
        const deptFilter = document.getElementById('meeting-filter-department');
        if (deptFilter && deptFilter.children.length <= 1) {
            const departments = dataManager.getDepartments();
            const currentValue = deptFilter.value;
            deptFilter.innerHTML = '<option value="">All Departments</option>';
            departments.forEach(dept => {
                deptFilter.innerHTML += `<option value="${dept.id}">${dept.name}</option>`;
                if (dept.subDepartments && dept.subDepartments.length > 0) {
                    dept.subDepartments.forEach(subDept => {
                        deptFilter.innerHTML += `<option value="${subDept.id}">${dept.name} > ${subDept.name}</option>`;
                    });
                }
            });
            deptFilter.value = currentValue;
        }
    }
}

const meetingManager = new MeetingManager();

