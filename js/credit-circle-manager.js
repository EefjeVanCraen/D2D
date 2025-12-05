// Credit Circle Manager - Handles credit circle updates and operations
class CreditCircleManager {
    constructor() {
        this.currentUpdateId = null;
        this.init();
    }

    init() {
        setTimeout(() => {
            this.setupEventListeners();
            this.renderUpdates();
        }, 100);
    }

    setupEventListeners() {
        const addBtn = document.getElementById('add-credit-circle-update-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openUpdateModal());
        }

        const form = document.getElementById('credit-circle-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveUpdate();
            });
        }

        const closeBtn = document.getElementById('credit-circle-modal-close');
        const cancelBtn = document.getElementById('credit-circle-cancel-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeUpdateModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeUpdateModal());

        // Task creation from outcomes
        const createTaskBtns = document.querySelectorAll('.create-task-from-outcome-btn');
        createTaskBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const outcomeId = e.target.getAttribute('data-outcome-id');
                const updateId = e.target.getAttribute('data-update-id');
                this.createTaskFromOutcome(updateId, outcomeId);
            });
        });
    }

    openUpdateModal(updateId = null) {
        this.currentUpdateId = updateId;
        const modal = document.getElementById('credit-circle-modal');
        if (!modal) return;

        const title = document.getElementById('credit-circle-modal-title');
        if (title) {
            title.textContent = updateId ? 'Edit Credit Circle Update' : 'Add Credit Circle Update';
        }

        // Populate members checkboxes
        this.populateMembersCheckboxes();

        if (updateId) {
            const update = dataManager.getCreditCircleUpdates().find(u => u.id === updateId);
            if (update) {
                document.getElementById('credit-circle-subject').value = update.subject || '';
                document.getElementById('credit-circle-date').value = update.date || '';
                document.getElementById('credit-circle-summary').value = update.summary || '';
                document.getElementById('credit-circle-outcome').value = update.outcome || '';
                document.getElementById('credit-circle-follow-up').value = update.followUp || '';

                // Set selected members (checkboxes)
                if (update.members) {
                    update.members.forEach(memberId => {
                        const checkbox = document.getElementById(`member-checkbox-${memberId}`);
                        if (checkbox) {
                            checkbox.checked = true;
                        }
                    });
                }
            }
        } else {
            // Reset form
            document.getElementById('credit-circle-form').reset();
            document.getElementById('credit-circle-date').value = new Date().toISOString().split('T')[0];
            // Uncheck all member checkboxes
            const checkboxes = document.querySelectorAll('#credit-circle-members-container input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = false);
        }

        modal.classList.add('active');
    }

    closeUpdateModal() {
        const modal = document.getElementById('credit-circle-modal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.currentUpdateId = null;
        document.getElementById('credit-circle-form').reset();
        // Uncheck all member checkboxes
        const checkboxes = document.querySelectorAll('#credit-circle-members-container input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
    }

    populateMembersCheckboxes() {
        const membersContainer = document.getElementById('credit-circle-members-container');
        if (!membersContainer) return;

        const members = dataManager.getCreditCircleMembers();
        membersContainer.innerHTML = '';

        if (members.length === 0) {
            membersContainer.innerHTML = '<p style="color: var(--text-secondary); font-style: italic; margin: 0; padding: 10px;">No members added. Add members in Settings.</p>';
        } else {
            members.forEach(member => {
                const label = document.createElement('label');
                label.style.cssText = 'display: flex; align-items: center; padding: 8px; margin-bottom: 4px; cursor: pointer; border-radius: 4px; transition: background 0.2s;';
                label.onmouseover = function() { this.style.background = 'rgba(74, 144, 226, 0.1)'; };
                label.onmouseout = function() { this.style.background = 'transparent'; };
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `member-checkbox-${member.id}`;
                checkbox.value = member.id;
                checkbox.style.cssText = 'margin-right: 10px; cursor: pointer; width: 18px; height: 18px;';
                
                const nameSpan = document.createElement('span');
                nameSpan.textContent = member.name;
                nameSpan.style.cssText = 'flex: 1; user-select: none;';
                
                label.appendChild(checkbox);
                label.appendChild(nameSpan);
                membersContainer.appendChild(label);
            });
        }
    }

    saveUpdate() {
        const subject = document.getElementById('credit-circle-subject').value.trim();
        const date = document.getElementById('credit-circle-date').value;
        const summary = document.getElementById('credit-circle-summary').value.trim();
        const outcome = document.getElementById('credit-circle-outcome').value.trim();
        const followUp = document.getElementById('credit-circle-follow-up').value.trim();

        // Get selected members from checkboxes
        const memberCheckboxes = document.querySelectorAll('#credit-circle-members-container input[type="checkbox"]:checked');
        const selectedMembers = Array.from(memberCheckboxes).map(cb => cb.value);

        if (!subject) {
            alert('Please enter a subject.');
            return;
        }

        if (!date) {
            alert('Please select a date.');
            return;
        }

        const updateData = {
            subject,
            date,
            members: selectedMembers,
            summary,
            outcome,
            followUp,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.currentUpdateId) {
            dataManager.updateCreditCircleUpdate(this.currentUpdateId, updateData);
        } else {
            updateData.id = this.generateId();
            dataManager.addCreditCircleUpdate(updateData);
        }

        this.renderUpdates();
        this.closeUpdateModal();
    }

    renderUpdates() {
        const container = document.getElementById('credit-circle-container');
        if (!container) return;

        const updates = dataManager.getCreditCircleUpdates();
        
        // Sort by date (newest first)
        updates.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (updates.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⭕</div>
                    <p>No credit circle updates yet. Add your first update!</p>
                </div>
            `;
            return;
        }

        const members = dataManager.getCreditCircleMembers();
        const membersMap = new Map(members.map(m => [m.id, m.name]));

        container.innerHTML = updates.map(update => this.createUpdateCard(update, membersMap)).join('');

        // Re-attach event listeners
        this.attachUpdateEventListeners();
    }

    createUpdateCard(update, membersMap) {
        const memberNames = (update.members || [])
            .map(id => membersMap.get(id) || 'Unknown')
            .join(', ') || 'No members selected';

        const dateFormatted = update.date ? new Date(update.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) : 'No date';

        // Split outcomes by newline for display
        const outcomes = (update.outcome || '').split('\n').filter(o => o.trim());
        const followUps = (update.followUp || '').split('\n').filter(f => f.trim());

        return `
            <div class="credit-circle-update-card" data-update-id="${update.id}">
                <div class="update-card-header">
                    <div>
                        <h3>${this.escapeHtml(update.subject)}</h3>
                        <div class="update-meta">
                            <span class="update-date">📅 ${dateFormatted}</span>
                            <span class="update-members">👥 ${this.escapeHtml(memberNames)}</span>
                        </div>
                    </div>
                    <div class="update-actions">
                        <button class="btn-icon edit-update-btn" data-update-id="${update.id}" title="Edit">✏️</button>
                        <button class="btn-icon delete-update-btn" data-update-id="${update.id}" title="Delete">🗑️</button>
                    </div>
                </div>
                <div class="update-card-body">
                    ${update.summary ? `
                        <div class="update-section">
                            <h4>Summary</h4>
                            <p>${this.escapeHtml(update.summary).replace(/\n/g, '<br>')}</p>
                        </div>
                    ` : ''}
                    ${outcomes.length > 0 ? `
                        <div class="update-section">
                            <h4>Outcomes</h4>
                            <ul class="outcomes-list">
                                ${outcomes.map((outcome, idx) => `
                                    <li>
                                        <span>${this.escapeHtml(outcome.trim())}</span>
                                        <button class="btn-small create-task-from-outcome-btn" 
                                                data-update-id="${update.id}" 
                                                data-outcome-id="${idx}"
                                                title="Create Task from this Outcome">+ Task</button>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${followUps.length > 0 ? `
                        <div class="update-section">
                            <h4>Follow Up</h4>
                            <ul class="follow-ups-list">
                                ${followUps.map(followUp => `
                                    <li>${this.escapeHtml(followUp.trim())}</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    attachUpdateEventListeners() {
        // Edit buttons
        document.querySelectorAll('.edit-update-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const updateId = e.target.getAttribute('data-update-id');
                this.openUpdateModal(updateId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-update-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const updateId = e.target.getAttribute('data-update-id');
                this.deleteUpdate(updateId);
            });
        });

        // Create task from outcome buttons
        document.querySelectorAll('.create-task-from-outcome-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const updateId = e.target.getAttribute('data-update-id');
                const outcomeId = e.target.getAttribute('data-outcome-id');
                this.createTaskFromOutcome(updateId, outcomeId);
            });
        });
    }

    deleteUpdate(updateId) {
        if (confirm('Are you sure you want to delete this credit circle update?')) {
            dataManager.deleteCreditCircleUpdate(updateId);
            this.renderUpdates();
        }
    }

    createTaskFromOutcome(updateId, outcomeId) {
        const update = dataManager.getCreditCircleUpdates().find(u => u.id === updateId);
        if (!update) return;

        const outcomes = (update.outcome || '').split('\n').filter(o => o.trim());
        const selectedOutcome = outcomes[parseInt(outcomeId)];

        if (!selectedOutcome) return;

        // Pre-fill task data
        const taskData = {
            headline: selectedOutcome.trim(),
            description: `Created from Credit Circle Update: "${update.subject}"\n\nDate: ${update.date}\n\nOriginal outcome: ${selectedOutcome.trim()}`,
            dueDate: '', // User can set this
            priority: 'medium',
            departments: [],
            people: []
        };

        // Open task modal with pre-filled data
        if (window.taskManager && typeof window.taskManager.openTaskModal === 'function') {
            window.taskManager.openTaskModal(null, taskData);
        } else if (taskManager && typeof taskManager.openTaskModal === 'function') {
            taskManager.openTaskModal(null, taskData);
        } else {
            alert('Task manager not available. Please add the task manually.');
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize credit circle manager
const creditCircleManager = new CreditCircleManager();

