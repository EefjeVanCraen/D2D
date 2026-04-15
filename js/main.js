// Main Application Controller
class Day2DayApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.init();
    }

    init() {
        this.setupSidebarOrder();
        this.setupNavigation();
        this.setupDateTime();
        this.setupGreeting();
        this.setupSettings();
        this.setupExport();
        this.setupPrint();
        this.setupRecycleBin();
        this.populateFilterOptions();
        this.setupSidebarFilter();
        this.startDateTimeUpdates();
        // Load sidebar colors on initialization
        setTimeout(() => {
            this.loadSidebarColors();
        }, 500);
    }
    
    setupSidebarFilter() {
        const sidebarFilter = document.getElementById('sidebar-dept-filter');
        if (sidebarFilter) {
            // Populate filter
            this.populateSidebarFilter();
            
            // Add change listener
            sidebarFilter.addEventListener('change', () => {
                this.applySidebarFilter();
            });
        }
    }
    
    populateSidebarFilter() {
        const sidebarFilter = document.getElementById('sidebar-dept-filter');
        if (!sidebarFilter) return;
        
        const departments = dataManager.getDepartments();
        sidebarFilter.innerHTML = '<option value="">All Departments</option>';
        departments.forEach(dept => {
            sidebarFilter.innerHTML += `<option value="${dept.id}">${dept.name}</option>`;
            // Add sub-departments
            if (dept.subDepartments && dept.subDepartments.length > 0) {
                dept.subDepartments.forEach(subDept => {
                    sidebarFilter.innerHTML += `<option value="${subDept.id}">${dept.name} > ${subDept.name}</option>`;
                });
            }
        });
    }
    
    applySidebarFilter() {
        const selectedDept = document.getElementById('sidebar-dept-filter').value;
        
        // Store filter in a way that can be accessed by other managers
        window.currentDeptFilter = selectedDept;
        
        // Refresh current view
        if (this.currentSection === 'tasks') {
            taskManager.renderTasks();
        } else if (this.currentSection === 'ideas') {
            ideaManager.renderIdeas();
        } else if (this.currentSection === 'meetings') {
            meetingManager.renderMeetings();
        } else if (this.currentSection === 'dashboard') {
            widgetManager.refreshWidgets();
        }
    }

    setupSidebarOrder() {
        const navContainer = document.querySelector('.sidebar-nav');
        if (!navContainer) return;

        // Wait for DOM to be ready
        setTimeout(() => {
            // Load saved order or sort alphabetically
            const savedOrder = this.loadSidebarOrder();
            if (savedOrder && savedOrder.length > 0) {
                this.applySidebarOrder(savedOrder);
            } else {
                this.sortSidebarAlphabetically();
            }

            // Setup drag and drop
            this.setupSidebarDragAndDrop();
        }, 100);
    }

    sortSidebarAlphabetically() {
        const navContainer = document.querySelector('.sidebar-nav');
        if (!navContainer) return;

        const buttons = Array.from(navContainer.querySelectorAll('.nav-btn'));
        
        // Sort by text content (excluding icon)
        buttons.sort((a, b) => {
            const textA = a.querySelector('span:last-child')?.textContent.trim() || '';
            const textB = b.querySelector('span:last-child')?.textContent.trim() || '';
            return textA.localeCompare(textB);
        });

        // Re-append in sorted order
        buttons.forEach(btn => navContainer.appendChild(btn));
        
        // Save the sorted order
        this.saveSidebarOrder();
    }

    setupSidebarDragAndDrop() {
        const navContainer = document.querySelector('.sidebar-nav');
        if (!navContainer) return;

        const buttons = navContainer.querySelectorAll('.nav-btn');
        let draggedElement = null;
        let dragOverElement = null;

        buttons.forEach(btn => {
            btn.draggable = true;
            btn.style.cursor = 'move';

            btn.addEventListener('dragstart', (e) => {
                draggedElement = btn;
                btn.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', btn.innerHTML);
            });

            btn.addEventListener('dragend', () => {
                btn.classList.remove('dragging');
                if (dragOverElement) {
                    dragOverElement.classList.remove('drag-over');
                    dragOverElement = null;
                }
                draggedElement = null;
                this.saveSidebarOrder();
            });

            btn.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';

                if (btn === draggedElement) return;

                // Remove drag-over class from previous element
                if (dragOverElement && dragOverElement !== btn) {
                    dragOverElement.classList.remove('drag-over');
                }

                // Add drag-over class to current element
                btn.classList.add('drag-over');
                dragOverElement = btn;

                const afterElement = this.getDragAfterElement(navContainer, e.clientY);
                if (afterElement == null) {
                    navContainer.appendChild(draggedElement);
                } else {
                    navContainer.insertBefore(draggedElement, afterElement);
                }
            });

            btn.addEventListener('dragleave', () => {
                btn.classList.remove('drag-over');
            });

            btn.addEventListener('drop', (e) => {
                e.preventDefault();
                btn.classList.remove('drag-over');
                if (dragOverElement) {
                    dragOverElement.classList.remove('drag-over');
                    dragOverElement = null;
                }
            });
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.nav-btn:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    applySidebarOrder(order) {
        const navContainer = document.querySelector('.sidebar-nav');
        if (!navContainer) return;

        const buttons = Array.from(navContainer.querySelectorAll('.nav-btn'));
        const buttonMap = new Map();
        buttons.forEach(btn => {
            const section = btn.getAttribute('data-section') || btn.id;
            buttonMap.set(section, btn);
        });

        // Clear container
        navContainer.innerHTML = '';

        // Re-add in saved order
        order.forEach(section => {
            const btn = buttonMap.get(section);
            if (btn) {
                navContainer.appendChild(btn);
            }
        });

        // Add any buttons not in the saved order (for new sections)
        buttons.forEach(btn => {
            const section = btn.getAttribute('data-section') || btn.id;
            if (!order.includes(section)) {
                navContainer.appendChild(btn);
            }
        });
    }

    saveSidebarOrder() {
        const navContainer = document.querySelector('.sidebar-nav');
        if (!navContainer) return;

        const buttons = Array.from(navContainer.querySelectorAll('.nav-btn'));
        const order = buttons.map(btn => btn.getAttribute('data-section') || btn.id);

        const settings = dataManager.getData().settings || {};
        settings.sidebarOrder = order;
        dataManager.updateData({ settings });
    }

    loadSidebarOrder() {
        const settings = dataManager.getData().settings || {};
        return settings.sidebarOrder || null;
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn[data-section]');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.getAttribute('data-section');
                this.showSection(section);
            });
        });

        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettings());
        }
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected section
        const section = document.getElementById(`${sectionName}-section`);
        if (section) {
            section.classList.add('active');
        }

        // Activate corresponding nav button
        const navBtn = document.querySelector(`.nav-btn[data-section="${sectionName}"]`);
        if (navBtn) {
            navBtn.classList.add('active');
        }

        this.currentSection = sectionName;

        // Refresh content if needed
        if (sectionName === 'tasks') {
            taskManager.renderTasks();
        } else if (sectionName === 'ideas') {
            ideaManager.renderIdeas();
        } else if (sectionName === 'summaries') {
            summaryManager.renderSummaries();
        } else if (sectionName === 'squads') {
            if (squadManager) {
                squadManager.renderSquads();
            }
        } else if (sectionName === 'credit-circle') {
            if (creditCircleManager) {
                creditCircleManager.renderUpdates();
            }
        } else if (sectionName === 'meetings') {
            meetingManager.renderMeetings();
        } else if (sectionName === 'birthdays') {
            birthdayManager.renderBirthdays();
        } else if (sectionName === 'org-charts') {
            orgChartManager.renderOrgCharts();
        } else if (sectionName === 'recycle-bin') {
            this.renderRecycleBin();
        } else if (sectionName === 'dashboard') {
            widgetManager.refreshWidgets();
        }
    }

    setupDateTime() {
        this.updateDateTime();
    }

    updateDateTime() {
        const now = new Date();
        const cetTime = this.getCETTime(now);
        
        // Format date
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateStr = cetTime.toLocaleDateString('en-US', dateOptions);
        
        // Format time (12-hour format)
        let hours = cetTime.getHours();
        const minutes = String(cetTime.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        const timeStr = `${hours}:${minutes} ${ampm} CET`;

        const dateEl = document.getElementById('current-date');
        const timeEl = document.getElementById('current-time');
        
        if (dateEl) dateEl.textContent = dateStr;
        if (timeEl) timeEl.textContent = timeStr;
    }

    getCETTime(date) {
        // Proper CET/CEST calculation using Intl API
        try {
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Europe/Brussels',
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false
            });
            const parts = formatter.formatToParts(date);
            const get = (type) => parts.find(p => p.type === type)?.value || '0';
            return new Date(
                parseInt(get('year')),
                parseInt(get('month')) - 1,
                parseInt(get('day')),
                parseInt(get('hour')),
                parseInt(get('minute')),
                parseInt(get('second'))
            );
        } catch (e) {
            // Fallback: UTC+1 (CET) or UTC+2 (CEST)
            const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
            const month = date.getMonth();
            const isSummer = month >= 2 && month <= 9; // rough DST approximation
            const offset = isSummer ? 2 : 1;
            return new Date(utc + (3600000 * offset));
        }
    }

    setupGreeting() {
        this.updateGreeting();
    }

    updateGreeting() {
        const now = new Date();
        const hour = now.getHours();
        let greeting = 'Good evening';
        
        if (hour >= 5 && hour < 12) {
            greeting = 'Good morning';
        } else if (hour >= 12 && hour < 18) {
            greeting = 'Good afternoon';
        }

        const greetingEl = document.getElementById('greeting-text');
        if (greetingEl) {
            greetingEl.textContent = greeting;
        }
    }

    startDateTimeUpdates() {
        setInterval(() => {
            this.updateDateTime();
            this.updateGreeting();
        }, 1000);
    }

    setupSettings() {
        const settingsBtn = document.getElementById('settings-btn');
        const settingsClose = document.getElementById('settings-close');
        const modal = document.getElementById('settings-modal');

        if (settingsClose) {
            settingsClose.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                this.switchSettingsTab(tab);
            });
        });

        // Department management
        const addDeptBtn = document.getElementById('add-department-btn');
        if (addDeptBtn) {
            addDeptBtn.addEventListener('click', () => {
                const input = document.getElementById('new-department');
                const name = input.value.trim();
                if (name) {
                    dataManager.addDepartment(name);
                    input.value = '';
                    this.renderDepartments();
                    this.populateFilterOptions();
                    this.populateSidebarFilter();
                }
            });
        }

        // Tag management
        const addTagBtn = document.getElementById('add-tag-btn');
        if (addTagBtn) {
            addTagBtn.addEventListener('click', () => {
                const input = document.getElementById('new-tag');
                const name = input.value.trim();
                if (name) {
                    dataManager.addTag(name);
                    input.value = '';
                    this.renderTags();
                    this.populateFilterOptions();
                }
            });
        }

        // Credit Circle Members management
        const addCreditCircleMemberBtn = document.getElementById('add-credit-circle-member-btn');
        if (addCreditCircleMemberBtn) {
            addCreditCircleMemberBtn.addEventListener('click', () => {
                const input = document.getElementById('new-credit-circle-member');
                if (!input) {
                    console.error('Credit Circle member input not found');
                    return;
                }
                const name = input.value.trim();
                if (name) {
                    dataManager.addCreditCircleMember({
                        id: dataManager.generateId(),
                        name: name,
                        createdAt: new Date().toISOString()
                    });
                    input.value = '';
                    this.renderCreditCircleMembers();
                    // Refresh credit circle manager if it exists
                    if (typeof creditCircleManager !== 'undefined' && creditCircleManager) {
                        creditCircleManager.populateMembersCheckboxes();
                    }
                } else {
                    alert('Please enter a member name.');
                }
            });
        }

        // Backup
        const manualBackupBtn = document.getElementById('manual-backup-btn');
        if (manualBackupBtn) {
            manualBackupBtn.addEventListener('click', () => {
                const backup = dataManager.createBackup();
                const statusEl = document.getElementById('backup-status');
                if (statusEl) {
                    statusEl.innerHTML = `<p style="color: green;">Backup created: ${new Date(backup.timestamp).toLocaleString()}</p>`;
                }
            });
        }

        const restoreBackupBtn = document.getElementById('restore-backup-btn');
        const restoreFileInput = document.getElementById('restore-file-input');
        
        if (restoreBackupBtn && restoreFileInput) {
            restoreBackupBtn.addEventListener('click', () => {
                const file = restoreFileInput.files[0];
                if (file) {
                    dataManager.restoreFromFile(file)
                        .then(() => {
                            const statusEl = document.getElementById('backup-status');
                            if (statusEl) {
                                statusEl.innerHTML = '<p style="color: green;">Backup restored successfully! Page will reload.</p>';
                            }
                        })
                        .catch(error => {
                            alert('Error restoring backup: ' + error.message);
                            console.error('Restore error:', error);
                        });
                } else {
                    alert('Please select a backup file first.');
                }
            });
        }

        const exportJsonBtn = document.getElementById('export-json-btn');
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => {
                this.exportToJSON();
            });
        }

        // Meeting type management
        const addMeetingTypeBtn = document.getElementById('add-meeting-type-btn');
        if (addMeetingTypeBtn) {
            addMeetingTypeBtn.addEventListener('click', () => {
                const input = document.getElementById('new-meeting-type');
                const name = input.value.trim();
                if (name) {
                    dataManager.addMeetingType(name);
                    input.value = '';
                    this.renderMeetingTypes();
                }
            });
        }

        // Initial render
        this.renderDepartments();
        this.renderTags();
        this.renderCreditCircleMembers();
        this.renderMeetingTypes();
        this.setupColorCustomization();
        this.loadSidebarColors();
        this.updateDeptTagSelector();
    }
    
    setupColorCustomization() {
        // Sync color pickers with hex inputs
        const colorInputs = [
            { color: 'sidebar-bg-top', hex: 'sidebar-bg-top-hex' },
            { color: 'sidebar-bg-bottom', hex: 'sidebar-bg-bottom-hex' },
            { color: 'greeting-color-1', hex: 'greeting-color-1-hex' },
            { color: 'greeting-color-2', hex: 'greeting-color-2-hex' },
            { color: 'nav-active-color', hex: 'nav-active-color-hex' },
            { color: 'nav-hover-color', hex: 'nav-hover-color-hex' },
            { color: 'birthday-bg-top', hex: 'birthday-bg-top-hex' },
            { color: 'birthday-bg-bottom', hex: 'birthday-bg-bottom-hex' },
            { color: 'birthday-text-color', hex: 'birthday-text-color-hex' }
        ];
        
        colorInputs.forEach(({ color, hex }) => {
            const colorPicker = document.getElementById(color);
            const hexInput = document.getElementById(hex);
            
            if (colorPicker && hexInput) {
                colorPicker.addEventListener('input', (e) => {
                    hexInput.value = e.target.value.toUpperCase();
                });
                
                hexInput.addEventListener('input', (e) => {
                    const value = e.target.value;
                    if (/^#[0-9A-F]{6}$/i.test(value)) {
                        colorPicker.value = value;
                    }
                });
            }
        });
        
        // Save colors button
        const saveColorsBtn = document.getElementById('save-colors-btn');
        if (saveColorsBtn) {
            saveColorsBtn.addEventListener('click', () => {
                this.saveSidebarColors();
            });
        }
        
        // Reset colors button
        const resetColorsBtn = document.getElementById('reset-colors-btn');
        if (resetColorsBtn) {
            resetColorsBtn.addEventListener('click', () => {
                this.resetSidebarColors();
            });
        }
    }
    
    loadSidebarColors() {
        const colors = dataManager.getData().settings?.sidebarColors || {};
        
        // Set color picker values
        if (colors.bgTop) {
            const picker = document.getElementById('sidebar-bg-top');
            const hex = document.getElementById('sidebar-bg-top-hex');
            if (picker) picker.value = colors.bgTop;
            if (hex) hex.value = colors.bgTop.toUpperCase();
        }
        
        if (colors.bgBottom) {
            const picker = document.getElementById('sidebar-bg-bottom');
            const hex = document.getElementById('sidebar-bg-bottom-hex');
            if (picker) picker.value = colors.bgBottom;
            if (hex) hex.value = colors.bgBottom.toUpperCase();
        }
        
        if (colors.greetingColor1) {
            const picker = document.getElementById('greeting-color-1');
            const hex = document.getElementById('greeting-color-1-hex');
            if (picker) picker.value = colors.greetingColor1;
            if (hex) hex.value = colors.greetingColor1.toUpperCase();
        }
        
        if (colors.greetingColor2) {
            const picker = document.getElementById('greeting-color-2');
            const hex = document.getElementById('greeting-color-2-hex');
            if (picker) picker.value = colors.greetingColor2;
            if (hex) hex.value = colors.greetingColor2.toUpperCase();
        }
        
        if (colors.navActiveColor) {
            const picker = document.getElementById('nav-active-color');
            const hex = document.getElementById('nav-active-color-hex');
            if (picker) picker.value = colors.navActiveColor;
            if (hex) hex.value = colors.navActiveColor.toUpperCase();
        }
        
        if (colors.navHoverColor) {
            const picker = document.getElementById('nav-hover-color');
            const hex = document.getElementById('nav-hover-color-hex');
            if (picker) picker.value = colors.navHoverColor;
            if (hex) hex.value = colors.navHoverColor.toUpperCase();
        }
        
        // Birthday countdown colors
        if (colors.birthdayBgTop) {
            const picker = document.getElementById('birthday-bg-top');
            const hex = document.getElementById('birthday-bg-top-hex');
            if (picker) picker.value = colors.birthdayBgTop;
            if (hex) hex.value = colors.birthdayBgTop.toUpperCase();
        }
        
        if (colors.birthdayBgBottom) {
            const picker = document.getElementById('birthday-bg-bottom');
            const hex = document.getElementById('birthday-bg-bottom-hex');
            if (picker) picker.value = colors.birthdayBgBottom;
            if (hex) hex.value = colors.birthdayBgBottom.toUpperCase();
        }
        
        if (colors.birthdayTextColor) {
            const picker = document.getElementById('birthday-text-color');
            const hex = document.getElementById('birthday-text-color-hex');
            if (picker) picker.value = colors.birthdayTextColor;
            if (hex) hex.value = colors.birthdayTextColor.toUpperCase();
        }
        
        // Apply colors to sidebar
        this.applySidebarColors(colors);
    }
    
    saveSidebarColors() {
        const colors = {
            bgTop: document.getElementById('sidebar-bg-top').value,
            bgBottom: document.getElementById('sidebar-bg-bottom').value,
            greetingColor1: document.getElementById('greeting-color-1').value,
            greetingColor2: document.getElementById('greeting-color-2').value,
            navActiveColor: document.getElementById('nav-active-color').value,
            navHoverColor: document.getElementById('nav-hover-color').value,
            birthdayBgTop: document.getElementById('birthday-bg-top').value,
            birthdayBgBottom: document.getElementById('birthday-bg-bottom').value,
            birthdayTextColor: document.getElementById('birthday-text-color').value
        };
        
        const settings = dataManager.getData().settings || {};
        settings.sidebarColors = colors;
        dataManager.updateData({ settings });
        
        this.applySidebarColors(colors);
        alert('Colors saved successfully!');
    }
    
    resetSidebarColors() {
        const defaultColors = {
            bgTop: '#ffffff',
            bgBottom: '#f9fafb',
            greetingColor1: '#4a90e2',
            greetingColor2: '#7b68ee',
            navActiveColor: '#4a90e2',
            navHoverColor: '#4a90e2',
            birthdayBgTop: '#fce4ec',
            birthdayBgBottom: '#f8bbd0',
            birthdayTextColor: '#c2185b'
        };
        
        // Reset color pickers
        document.getElementById('sidebar-bg-top').value = defaultColors.bgTop;
        document.getElementById('sidebar-bg-top-hex').value = defaultColors.bgTop.toUpperCase();
        document.getElementById('sidebar-bg-bottom').value = defaultColors.bgBottom;
        document.getElementById('sidebar-bg-bottom-hex').value = defaultColors.bgBottom.toUpperCase();
        document.getElementById('greeting-color-1').value = defaultColors.greetingColor1;
        document.getElementById('greeting-color-1-hex').value = defaultColors.greetingColor1.toUpperCase();
        document.getElementById('greeting-color-2').value = defaultColors.greetingColor2;
        document.getElementById('greeting-color-2-hex').value = defaultColors.greetingColor2.toUpperCase();
        document.getElementById('nav-active-color').value = defaultColors.navActiveColor;
        document.getElementById('nav-active-color-hex').value = defaultColors.navActiveColor.toUpperCase();
        document.getElementById('nav-hover-color').value = defaultColors.navHoverColor;
        document.getElementById('nav-hover-color-hex').value = defaultColors.navHoverColor.toUpperCase();
        document.getElementById('birthday-bg-top').value = defaultColors.birthdayBgTop;
        document.getElementById('birthday-bg-top-hex').value = defaultColors.birthdayBgTop.toUpperCase();
        document.getElementById('birthday-bg-bottom').value = defaultColors.birthdayBgBottom;
        document.getElementById('birthday-bg-bottom-hex').value = defaultColors.birthdayBgBottom.toUpperCase();
        document.getElementById('birthday-text-color').value = defaultColors.birthdayTextColor;
        document.getElementById('birthday-text-color-hex').value = defaultColors.birthdayTextColor.toUpperCase();
        
        // Save and apply
        const settings = dataManager.getData().settings || {};
        settings.sidebarColors = defaultColors;
        dataManager.updateData({ settings });
        
        this.applySidebarColors(defaultColors);
        alert('Colors reset to default!');
    }
    
    applySidebarColors(colors) {
        const sidebar = document.querySelector('.sidebar');
        const greeting = document.querySelector('.greeting');
        const birthdayCountdown = document.querySelector('.birthday-countdown');
        
        if (sidebar) {
            sidebar.style.background = `linear-gradient(180deg, ${colors.bgTop || '#ffffff'} 0%, ${colors.bgBottom || '#f9fafb'} 100%)`;
        }
        
        if (greeting) {
            greeting.style.background = `linear-gradient(135deg, ${colors.greetingColor1 || '#4a90e2'} 0%, ${colors.greetingColor2 || '#7b68ee'} 100%)`;
        }
        
        if (birthdayCountdown) {
            birthdayCountdown.style.background = `linear-gradient(135deg, ${colors.birthdayBgTop || '#fce4ec'} 0%, ${colors.birthdayBgBottom || '#f8bbd0'} 100%)`;
        }
        
        // Apply to active nav buttons and birthday countdown text
        const style = document.createElement('style');
        style.id = 'custom-sidebar-colors';
        style.textContent = `
            .nav-btn.active {
                background: linear-gradient(135deg, ${colors.navActiveColor || '#4a90e2'} 0%, ${colors.navActiveColor || '#4a90e2'} 100%) !important;
            }
            .nav-btn:hover {
                background: linear-gradient(90deg, ${this.hexToRgba(colors.navHoverColor || '#4a90e2', 0.1)} 0%, ${this.hexToRgba(colors.navHoverColor || '#4a90e2', 0.05)} 100%) !important;
                color: ${colors.navHoverColor || '#4a90e2'} !important;
            }
            .countdown-item span {
                color: ${colors.birthdayTextColor || '#c2185b'} !important;
            }
        `;
        
        // Remove old style if exists
        const oldStyle = document.getElementById('custom-sidebar-colors');
        if (oldStyle) {
            oldStyle.remove();
        }
        
        document.head.appendChild(style);
    }
    
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    openSettings() {
        const modal = document.getElementById('settings-modal');
        const modalContent = document.getElementById('settings-modal-content');
        modal.classList.add('active');
        this.switchSettingsTab('general');

        // Load saved modal size
        this.loadModalSize();

        // Setup resize only once
        if (!this._modalResizeInitialized) {
            this.setupModalResize();
            this._modalResizeInitialized = true;
        }
    }
    
    setupModalResize() {
        const modalContent = document.getElementById('settings-modal-content');
        const resizeHandle = document.getElementById('settings-resize-handle');
        
        if (!modalContent || !resizeHandle) return;
        
        let isResizing = false;
        let startX, startY, startWidth, startHeight;
        
        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(document.defaultView.getComputedStyle(modalContent).width, 10);
            startHeight = parseInt(document.defaultView.getComputedStyle(modalContent).height, 10);
            e.preventDefault();
            e.stopPropagation();
        });
        
        const handleMouseMove = (e) => {
            if (!isResizing) return;
            
            const width = startWidth + (e.clientX - startX);
            const height = startHeight + (e.clientY - startY);
            
            // Minimum and maximum size constraints
            const minWidth = 500;
            const minHeight = 400;
            const maxWidth = window.innerWidth * 0.95;
            const maxHeight = window.innerHeight * 0.95;
            
            const newWidth = Math.max(minWidth, Math.min(width, maxWidth));
            const newHeight = Math.max(minHeight, Math.min(height, maxHeight));
            
            modalContent.style.width = newWidth + 'px';
            modalContent.style.height = newHeight + 'px';
            modalContent.style.maxWidth = 'none'; // Remove max-width constraint
        };
        
        const handleMouseUp = () => {
            if (isResizing) {
                isResizing = false;
                this.saveModalSize();
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            }
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
    
    saveModalSize() {
        const modalContent = document.getElementById('settings-modal-content');
        if (modalContent) {
            const size = {
                width: modalContent.style.width || modalContent.offsetWidth + 'px',
                height: modalContent.style.height || modalContent.offsetHeight + 'px'
            };
            localStorage.setItem('day2day-settings-modal-size', JSON.stringify(size));
        }
    }
    
    loadModalSize() {
        const modalContent = document.getElementById('settings-modal-content');
        if (modalContent) {
            const savedSize = localStorage.getItem('day2day-settings-modal-size');
            if (savedSize) {
                try {
                    const size = JSON.parse(savedSize);
                    if (size.width) {
                        modalContent.style.width = size.width;
                        modalContent.style.maxWidth = 'none'; // Remove max-width constraint
                    }
                    if (size.height) {
                        modalContent.style.height = size.height;
                    }
                } catch (e) {
                    console.error('Error loading modal size:', e);
                }
            } else {
                // Set default size and remove max-width constraint
                modalContent.style.maxWidth = 'none';
            }
        }
    }

    switchSettingsTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
        const tabContent = document.getElementById(`${tabName}-tab`);
        
        if (tabBtn) tabBtn.classList.add('active');
        if (tabContent) tabContent.classList.add('active');
        
        // Load colors when appearance tab is opened
        if (tabName === 'appearance') {
            this.loadSidebarColors();
        }
        
        // Re-attach event listeners when credit circle members tab is opened
        if (tabName === 'credit-circle-members') {
            this.setupCreditCircleMembersListener();
        }
        
    }
    
    setupCreditCircleMembersListener() {
        // Remove existing listener if any
        const existingBtn = document.getElementById('add-credit-circle-member-btn');
        if (existingBtn) {
            const newBtn = existingBtn.cloneNode(true);
            existingBtn.parentNode.replaceChild(newBtn, existingBtn);
        }
        
        // Add new listener
        const addCreditCircleMemberBtn = document.getElementById('add-credit-circle-member-btn');
        if (addCreditCircleMemberBtn) {
            addCreditCircleMemberBtn.addEventListener('click', () => {
                const input = document.getElementById('new-credit-circle-member');
                if (!input) {
                    console.error('Credit Circle member input not found');
                    return;
                }
                const name = input.value.trim();
                if (name) {
                    dataManager.addCreditCircleMember({
                        id: dataManager.generateId(),
                        name: name,
                        createdAt: new Date().toISOString()
                    });
                    input.value = '';
                    this.renderCreditCircleMembers();
                    // Refresh credit circle manager if it exists
                    if (typeof creditCircleManager !== 'undefined' && creditCircleManager) {
                        creditCircleManager.populateMembersCheckboxes();
                    }
                } else {
                    alert('Please enter a member name.');
                }
            });
        }
    }
    
    renderDepartments() {
        const container = document.getElementById('departments-list');
        if (!container) return;

        const departments = dataManager.getDepartments();
        container.innerHTML = '';

        departments.forEach(dept => {
            const deptCard = document.createElement('div');
            deptCard.className = 'department-card';
            deptCard.style.cssText = 'padding: 15px; margin-bottom: 15px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-bg);';
            
            const peopleCount = (dept.people || []).length;
            const subDeptCount = (dept.subDepartments || []).length;
            
            deptCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div>
                        <strong style="font-size: 16px;">${dept.name}</strong>
                        <span style="font-size: 12px; color: var(--text-secondary); margin-left: 10px;">
                            ${peopleCount} person${peopleCount !== 1 ? 's' : ''}, ${subDeptCount} sub-department${subDeptCount !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-small" onclick="app.addSubDepartment('${dept.id}')" title="Add Sub-Department">+ Sub-Dept</button>
                        <button class="btn-small" onclick="app.addPersonToDept('${dept.id}', false)" title="Add Person">+ Person</button>
                        <button class="btn-small" onclick="app.editDepartment('${dept.id}')" title="Edit">✏️</button>
                        <button class="btn-small" onclick="app.deleteDepartment('${dept.id}')" title="Delete">🗑️</button>
                    </div>
                </div>
                ${dept.people && dept.people.length > 0 ? `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color-light);">
                        <strong style="font-size: 12px; color: var(--text-secondary);">People:</strong>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">
                            ${dept.people.map(p => `
                                <span class="badge badge-secondary" style="font-size: 11px;">
                                    ${p.name}
                                    <button onclick="app.removePersonFromDept('${dept.id}', '${p.id}', false)" style="background: none; border: none; color: white; cursor: pointer; margin-left: 4px;">×</button>
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                ${dept.subDepartments && dept.subDepartments.length > 0 ? `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color-light);">
                        <strong style="font-size: 12px; color: var(--text-secondary);">Sub-Departments:</strong>
                        ${dept.subDepartments.map(subDept => {
                            const subPeopleCount = (subDept.people || []).length;
                            return `
                                <div style="margin-top: 8px; padding: 10px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid var(--primary-color);">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <strong style="font-size: 14px;">${subDept.name}</strong>
                                            <span style="font-size: 11px; color: var(--text-secondary); margin-left: 8px;">
                                                ${subPeopleCount} person${subPeopleCount !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div style="display: flex; gap: 6px;">
                                            <button class="btn-small" onclick="app.addPersonToDept('${subDept.id}', true, '${dept.id}')" title="Add Person" style="font-size: 11px;">+ Person</button>
                                            <button class="btn-small" onclick="app.editSubDepartment('${subDept.id}', '${dept.id}')" title="Edit" style="font-size: 11px;">✏️</button>
                                            <button class="btn-small" onclick="app.deleteSubDepartment('${subDept.id}', '${dept.id}')" title="Delete" style="font-size: 11px;">🗑️</button>
                                        </div>
                                    </div>
                                    ${subDept.people && subDept.people.length > 0 ? `
                                        <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px;">
                                            ${subDept.people.map(p => `
                                                <span class="badge badge-secondary" style="font-size: 11px;">
                                                    ${p.name}
                                                    <button onclick="app.removePersonFromDept('${subDept.id}', '${p.id}', true, '${dept.id}')" style="background: none; border: none; color: white; cursor: pointer; margin-left: 4px;">×</button>
                                                </span>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
            `;
            container.appendChild(deptCard);
        });
        
        // Update department tag selector
        this.updateDeptTagSelector();
    }
    
    updateDeptTagSelector() {
        const deptSelect = document.getElementById('dept-tag-select');
        if (!deptSelect) return;
        
        const departments = dataManager.getDepartments();
        deptSelect.innerHTML = '<option value="">Select Department</option>';
        departments.forEach(dept => {
            deptSelect.innerHTML += `<option value="${dept.id}">${dept.name}</option>`;
        });
        
        // Add change listener if not already added
        if (!deptSelect.hasAttribute('data-listener-added')) {
            deptSelect.setAttribute('data-listener-added', 'true');
            deptSelect.addEventListener('change', () => {
                this.showDeptTags(deptSelect.value);
            });
        }
    }
    
    showDeptTags(deptId) {
        const container = document.getElementById('dept-tags-container');
        if (!container) return;
        
        if (!deptId) {
            container.innerHTML = '<span style="color: var(--text-secondary); font-size: 12px;">Select a department first</span>';
            return;
        }
        
        const dept = dataManager.getDepartments().find(d => d.id === deptId);
        if (!dept) return;
        
        const tags = dataManager.getTags();
        const deptTags = dept.tags || [];
        
        container.innerHTML = '';
        
        tags.forEach(tag => {
            const isSelected = deptTags.includes(tag.name);
            const checkbox = document.createElement('label');
            checkbox.style.cssText = 'display: flex; align-items: center; gap: 5px; cursor: pointer; padding: 4px 8px; background: ' + (isSelected ? 'var(--primary-color)' : '#f0f0f0') + '; border-radius: 4px; color: ' + (isSelected ? 'white' : 'var(--text-primary)') + ';';
            checkbox.innerHTML = `
                <input type="checkbox" ${isSelected ? 'checked' : ''} data-tag="${tag.name}" onchange="app.toggleDeptTag('${deptId}', '${tag.name}')">
                <span>${tag.name}</span>
            `;
            container.appendChild(checkbox);
        });
        
        if (tags.length === 0) {
            container.innerHTML = '<span style="color: var(--text-secondary); font-size: 12px;">No tags available. Add tags first.</span>';
        }
    }
    
    toggleDeptTag(deptId, tagName) {
        const dept = dataManager.getDepartments().find(d => d.id === deptId);
        if (!dept) return;
        
        if (!dept.tags) dept.tags = [];
        
        const index = dept.tags.indexOf(tagName);
        if (index > -1) {
            dept.tags.splice(index, 1);
        } else {
            dept.tags.push(tagName);
        }
        
        dataManager.updateDepartment(deptId, { tags: dept.tags });
        this.showDeptTags(deptId);
        this.renderDepartments();
    }

    renderTags() {
        const container = document.getElementById('tags-list');
        if (!container) return;

        const tags = dataManager.getTags();
        container.innerHTML = '';

        tags.forEach(tag => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${tag.name}</span>
                <button onclick="app.deleteTag('${tag.id}')">Delete</button>
            `;
            container.appendChild(li);
        });
    }

    renderCreditCircleMembers() {
        const container = document.getElementById('credit-circle-members-list');
        if (!container) return;

        const members = dataManager.getCreditCircleMembers();
        container.innerHTML = '';

        if (members.length === 0) {
            container.innerHTML = '<li style="color: var(--text-secondary); font-style: italic;">No members added yet.</li>';
            return;
        }

        members.forEach(member => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${member.name}</span>
                <button onclick="app.deleteCreditCircleMember('${member.id}')">Delete</button>
            `;
            container.appendChild(li);
        });
    }

    deleteCreditCircleMember(memberId) {
        if (confirm('Are you sure you want to delete this Credit Circle member?')) {
            dataManager.deleteCreditCircleMember(memberId);
            this.renderCreditCircleMembers();
            // Refresh credit circle manager if it exists
            if (creditCircleManager) {
                creditCircleManager.populateMembersCheckboxes();
            }
        }
    }

    deleteDepartment(id) {
        if (confirm('Delete this department? This will also delete all sub-departments and people.')) {
            dataManager.deleteDepartment(id);
            this.renderDepartments();
            this.populateFilterOptions();
            this.populateSidebarFilter();
        }
    }

    addSubDepartment(parentId) {
        const name = prompt('Enter sub-department name:');
        if (name && name.trim()) {
            dataManager.addDepartment(name.trim(), parentId);
            this.renderDepartments();
            this.populateFilterOptions();
            this.populateSidebarFilter();
        }
    }

    deleteSubDepartment(subDeptId, parentId) {
        if (confirm('Delete this sub-department?')) {
            dataManager.deleteDepartment(subDeptId, true, parentId);
            this.renderDepartments();
            this.populateFilterOptions();
            this.populateSidebarFilter();
        }
    }

    editDepartment(deptId) {
        const dept = dataManager.getDepartments().find(d => d.id === deptId);
        if (!dept) return;
        
        const newName = prompt('Enter new department name:', dept.name);
        if (newName && newName.trim() && newName !== dept.name) {
            dataManager.updateDepartment(deptId, { name: newName.trim() });
            this.renderDepartments();
            this.populateFilterOptions();
            this.populateSidebarFilter();
        }
    }

    editSubDepartment(subDeptId, parentId) {
        const parent = dataManager.getDepartments().find(d => d.id === parentId);
        if (!parent || !parent.subDepartments) return;
        
        const subDept = parent.subDepartments.find(sd => sd.id === subDeptId);
        if (!subDept) return;
        
        const newName = prompt('Enter new sub-department name:', subDept.name);
        if (newName && newName.trim() && newName !== subDept.name) {
            dataManager.updateDepartment(subDeptId, { name: newName.trim() }, true, parentId);
            this.renderDepartments();
            this.populateFilterOptions();
            this.populateSidebarFilter();
        }
    }

    addPersonToDept(deptId, isSubDepartment = false, parentId = null) {
        const personName = prompt('Enter person name:');
        if (personName && personName.trim()) {
            dataManager.addPersonToDepartment(personName.trim(), deptId, isSubDepartment, parentId);
            this.renderDepartments();
            this.populateFilterOptions();
        }
    }

    removePersonFromDept(deptId, personId, isSubDepartment = false, parentId = null) {
        if (confirm('Remove this person from the department?')) {
            let targetDept = null;
            
            if (isSubDepartment && parentId) {
                const parent = dataManager.getDepartments().find(d => d.id === parentId);
                if (parent && parent.subDepartments) {
                    targetDept = parent.subDepartments.find(sd => sd.id === deptId);
                }
            } else {
                targetDept = dataManager.getDepartments().find(d => d.id === deptId);
            }

            if (targetDept && targetDept.people) {
                const index = targetDept.people.findIndex(p => p.id === personId);
                if (index !== -1) {
                    targetDept.people.splice(index, 1);
                    if (isSubDepartment && parentId) {
                        dataManager.updateDepartment(deptId, { people: targetDept.people }, true, parentId);
                    } else {
                        dataManager.updateDepartment(deptId, { people: targetDept.people });
                    }
                    this.renderDepartments();
                    this.populateFilterOptions();
                }
            }
        }
    }

    renderMeetingTypes() {
        const container = document.getElementById('meeting-types-list');
        if (!container) return;

        const types = dataManager.getMeetingTypes();
        container.innerHTML = '';

        if (types.length === 0) {
            container.innerHTML = '<li style="color: var(--text-secondary);">No meeting types yet.</li>';
            return;
        }

        types.forEach(type => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${type.name}</span>
                <div style="display: flex; gap: 8px;">
                    <button onclick="app.editMeetingType('${type.id}')" title="Edit">✏️</button>
                    <button onclick="app.deleteMeetingType('${type.id}')" title="Delete">🗑️</button>
                </div>
            `;
            container.appendChild(li);
        });
    }

    editMeetingType(typeId) {
        const type = dataManager.getMeetingTypes().find(t => t.id === typeId);
        if (!type) return;
        
        const newName = prompt('Enter new meeting type name:', type.name);
        if (newName && newName.trim() && newName !== type.name) {
            dataManager.updateMeetingType(typeId, { name: newName.trim() });
            this.renderMeetingTypes();
            // Refresh meeting filters
            if (meetingManager) {
                meetingManager.renderMeetings();
            }
        }
    }

    deleteMeetingType(typeId) {
        if (confirm('Delete this meeting type?')) {
            dataManager.deleteMeetingType(typeId);
            this.renderMeetingTypes();
            // Refresh meeting filters
            if (meetingManager) {
                meetingManager.renderMeetings();
            }
        }
    }

    deleteTag(id) {
        if (confirm('Delete this tag?')) {
            dataManager.deleteTag(id);
            this.renderTags();
            this.populateFilterOptions();
        }
    }

    populateFilterOptions() {
        const departments = dataManager.getDepartments();
        const tags = dataManager.getTags();
        const meetingTypes = dataManager.getMeetingTypes();

        // Populate department filters (including sub-departments)
        const deptFilters = [
            'task-filter-department',
            'idea-filter-department',
            'meeting-filter-department',
            'sidebar-dept-filter'
        ];

        deptFilters.forEach(filterId => {
            const select = document.getElementById(filterId);
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">All Departments</option>';
                departments.forEach(dept => {
                    select.innerHTML += `<option value="${dept.id}">${dept.name}</option>`;
                    // Add sub-departments
                    if (dept.subDepartments && dept.subDepartments.length > 0) {
                        dept.subDepartments.forEach(subDept => {
                            select.innerHTML += `<option value="${subDept.id}">${dept.name} > ${subDept.name}</option>`;
                        });
                    }
                });
                select.value = currentValue;
            }
        });


        // Populate tag filters
        const tagFilters = [
            'task-filter-tag',
            'idea-filter-tag'
        ];

        tagFilters.forEach(filterId => {
            const select = document.getElementById(filterId);
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">All Tags</option>';
                tags.forEach(tag => {
                    select.innerHTML += `<option value="${tag.name}">${tag.name}</option>`;
                });
                select.value = currentValue;
            }
        });
    }

    setupExport() {
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToExcel());
        }
    }

    exportToExcel() {
        try {
            const data = dataManager.getData();
            
            // Create workbook
            const wb = XLSX.utils.book_new();

            // Tasks sheet
            if (data.tasks && data.tasks.length > 0) {
                const tasksData = data.tasks.map(task => {
                    const deptIds = Array.isArray(task.departments) ? task.departments : 
                        (task.department ? [task.department] : []);
                    const deptNames = deptIds.map(id => {
                        // Try to get name from ID, or use as-is if it's already a name
                        const dept = dataManager.getDepartments().find(d => d.id === id || d.name === id);
                        if (dept) {
                            if (dept.id === id) return dept.name;
                            // Check sub-departments
                            if (dept.subDepartments) {
                                const subDept = dept.subDepartments.find(sd => sd.id === id);
                                if (subDept) return `${dept.name} > ${subDept.name}`;
                            }
                        }
                        return id; // Fallback to ID if not found
                    });
                    const people = Array.isArray(task.people) ? task.people : 
                        (task.person ? [task.person] : []);
                    return {
                        Headline: task.headline,
                        Description: task.description || '',
                        DueDate: task.dueDate || '',
                        Priority: task.priority || '',
                        Departments: deptNames.join('; '),
                        People: people.join('; '),
                        Tag: task.tag || '',
                        Status: task.status || '',
                        Created: task.created ? new Date(task.created).toLocaleString() : '',
                        Updated: task.updated ? new Date(task.updated).toLocaleString() : ''
                    };
                });
                const wsTasks = XLSX.utils.json_to_sheet(tasksData);
                XLSX.utils.book_append_sheet(wb, wsTasks, 'Tasks');
            }

            // Ideas sheet
            if (data.ideas && data.ideas.length > 0) {
                const ideasData = data.ideas.map(idea => {
                    const deptIds = Array.isArray(idea.departments) ? idea.departments : 
                        (idea.department ? [idea.department] : []);
                    const deptNames = deptIds.map(id => {
                        // Try to get name from ID, or use as-is if it's already a name
                        const dept = dataManager.getDepartments().find(d => d.id === id || d.name === id);
                        if (dept) {
                            if (dept.id === id) return dept.name;
                            // Check sub-departments
                            if (dept.subDepartments) {
                                const subDept = dept.subDepartments.find(sd => sd.id === id);
                                if (subDept) return `${dept.name} > ${subDept.name}`;
                            }
                        }
                        return id; // Fallback to ID if not found
                    });
                    const people = Array.isArray(idea.people) ? idea.people : 
                        (idea.person ? [idea.person] : []);
                    return {
                        Headline: idea.headline,
                        Description: idea.description || '',
                        Departments: deptNames.join('; '),
                        People: people.join('; '),
                        Tag: idea.tag || '',
                        Created: idea.created ? new Date(idea.created).toLocaleString() : '',
                        Updated: idea.updated ? new Date(idea.updated).toLocaleString() : ''
                    };
                });
                const wsIdeas = XLSX.utils.json_to_sheet(ideasData);
                XLSX.utils.book_append_sheet(wb, wsIdeas, 'Ideas');
            }

            // Birthdays sheet
            if (data.birthdays && data.birthdays.length > 0) {
                const birthdaysData = data.birthdays.map(birthday => ({
                    Name: birthday.name,
                    Date: birthday.date,
                    Created: birthday.created ? new Date(birthday.created).toLocaleString() : ''
                }));
                const wsBirthdays = XLSX.utils.json_to_sheet(birthdaysData);
                XLSX.utils.book_append_sheet(wb, wsBirthdays, 'Birthdays');
            }

            // Summaries sheet
            if (data.summaries && data.summaries.length > 0) {
                const summariesData = data.summaries.map(summary => ({
                    Headline: summary.headline,
                    Content: summary.content || '',
                    Created: summary.created ? new Date(summary.created).toLocaleString() : ''
                }));
                const wsSummaries = XLSX.utils.json_to_sheet(summariesData);
                XLSX.utils.book_append_sheet(wb, wsSummaries, 'Summaries');
            }

            // Meetings sheet
            if (data.meetings && data.meetings.length > 0) {
                const meetingsData = data.meetings.map(meeting => {
                    const dept = meeting.department ? app.getDepartmentNameForExport(meeting.department) : '';
                    const people = Array.isArray(meeting.people) ? meeting.people.join('; ') : '';
                    return {
                        Title: meeting.title,
                        Date: meeting.date || '',
                        InternalExternal: meeting.internalExternal || 'Internal',
                        Department: dept,
                        People: people,
                        Description: meeting.description || '',
                        Created: meeting.created ? new Date(meeting.created).toLocaleString() : ''
                    };
                });
                const wsMeetings = XLSX.utils.json_to_sheet(meetingsData);
                XLSX.utils.book_append_sheet(wb, wsMeetings, 'Meetings');
            }

            // Org Charts sheet
            if (data.orgCharts && data.orgCharts.length > 0) {
                const orgChartsData = [];
                data.orgCharts.forEach(chart => {
                    if (chart.positions && chart.positions.length > 0) {
                        chart.positions.forEach(position => {
                            const level = parseInt(position.level || 0);
                            const levelLabel = level === 0 ? 'Top Level (0)' : `Level ${level}`;
                            orgChartsData.push({
                                'Org Chart': chart.name,
                                'Position Name': position.name,
                                'Title': position.title || '',
                                'Department': position.department || '',
                                'Level': levelLabel,
                                'Created': position.created ? new Date(position.created).toLocaleString() : ''
                            });
                        });
                    } else {
                        orgChartsData.push({
                            'Org Chart': chart.name,
                            'Position Name': '',
                            'Title': '',
                            'Department': '',
                            'Level': '',
                            'Created': chart.created ? new Date(chart.created).toLocaleString() : ''
                        });
                    }
                });
                if (orgChartsData.length > 0) {
                    const wsOrgCharts = XLSX.utils.json_to_sheet(orgChartsData);
                    XLSX.utils.book_append_sheet(wb, wsOrgCharts, 'Org Charts');
                }
            }

            // Write file
            const fileName = `Day2Day-Export-${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            alert('Export completed successfully!');
        } catch (error) {
            console.error('Export error:', error);
            alert('Error exporting data. Please try again.');
        }
    }

    setupPrint() {
        const printBtn = document.getElementById('print-btn');
        if (printBtn) {
            printBtn.addEventListener('click', () => window.print());
        }
    }

    setupRecycleBin() {
        // Recycle bin rendering is handled in renderRecycleBin
    }

    renderRecycleBin() {
        const container = document.getElementById('recycle-bin-list');
        if (!container) return;

        const bin = dataManager.getData().recycleBin || [];
        
        container.innerHTML = '';

        if (bin.length === 0) {
            container.innerHTML = '<p>Recycle bin is empty.</p>';
            return;
        }

        bin.forEach(item => {
            const card = document.createElement('div');
            card.className = 'task-card';
            
            const deletedDate = item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : '';
            
            card.innerHTML = `
                <div class="card-header">
                    <div>
                        <div class="card-title">${item.headline || item.name || 'Item'}</div>
                        <div class="card-meta">
                            <span>Type: ${item.type}</span>
                            <span>Deleted: ${deletedDate}</span>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="card-btn" onclick="app.restoreItem('${item.id}')" title="Restore">↩️</button>
                        <button class="card-btn" onclick="app.permanentlyDelete('${item.id}')" title="Permanently Delete">🗑️</button>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });
    }

    restoreItem(id) {
        if (dataManager.restoreFromRecycleBin(id)) {
            this.renderRecycleBin();
            // Force refresh of all sections
            setTimeout(() => {
                if (taskManager) {
                    // Clear any filters that might hide the restored task
                    const searchInput = document.getElementById('task-search');
                    const deptFilter = document.getElementById('task-filter-department');
                    const tagFilter = document.getElementById('task-filter-tag');
                    const priorityFilter = document.getElementById('task-filter-priority');
                    const statusFilter = document.getElementById('task-filter-status');
                    
                    if (searchInput) searchInput.value = '';
                    if (deptFilter) deptFilter.value = '';
                    if (tagFilter) tagFilter.value = '';
                    if (priorityFilter) priorityFilter.value = '';
                    if (statusFilter) statusFilter.value = '';
                    
                    taskManager.renderTasks();
                }
                if (ideaManager) ideaManager.renderIdeas();
                if (meetingManager) meetingManager.renderMeetings();
                if (widgetManager) widgetManager.refreshWidgets();
            }, 100);
            alert('Item restored successfully! The page will refresh to show it.');
        } else {
            alert('Failed to restore item.');
        }
    }

    restoreMostRecentTask() {
        if (dataManager.restoreMostRecentTask()) {
            this.renderRecycleBin();
            // Force refresh of all sections
            if (taskManager) taskManager.renderTasks();
            if (widgetManager) widgetManager.refreshWidgets();
            alert('Most recent task restored successfully!');
        } else {
            alert('No tasks found in recycle bin.');
        }
    }

    // Emergency function to delete all tasks and clear filters
    emergencyDeleteAllTasks() {
        if (!confirm('EMERGENCY: Delete ALL tasks permanently? This cannot be undone!')) {
            return;
        }
        
        // Get current data
        const data = dataManager.getData();
        const taskCount = (data.tasks || []).length;
        const recycleBinCount = (data.recycleBin || []).filter(item => item.type === 'task').length;
        
        // Clear all tasks
        data.tasks = [];
        if (data.recycleBin) {
            data.recycleBin = data.recycleBin.filter(item => item.type !== 'task');
        }
        
        // Save directly
        try {
            localStorage.setItem('day2day-data', JSON.stringify(data));
            dataManager.data = data;
            
            // Clear all filters
            const taskDeptFilter = document.getElementById('task-filter-department');
            const taskTagFilter = document.getElementById('task-filter-tag');
            const taskPriorityFilter = document.getElementById('task-filter-priority');
            const taskStatusFilter = document.getElementById('task-filter-status');
            const taskSearch = document.getElementById('task-search');
            const sidebarFilter = document.getElementById('sidebar-dept-filter');
            
            if (taskDeptFilter) taskDeptFilter.value = '';
            if (taskTagFilter) taskTagFilter.value = '';
            if (taskPriorityFilter) taskPriorityFilter.value = '';
            if (taskStatusFilter) taskStatusFilter.value = '';
            if (taskSearch) taskSearch.value = '';
            if (sidebarFilter) sidebarFilter.value = '';
            window.currentDeptFilter = '';
            
            // Refresh everything
            dataManager.loadData();
            if (taskManager) taskManager.renderTasks();
            if (widgetManager) widgetManager.refreshWidgets();
            
            alert(`Deleted ${taskCount} tasks from data and ${recycleBinCount} from recycle bin. Total: ${taskCount + recycleBinCount}`);
            console.log('Emergency deletion complete');
        } catch (error) {
            console.error('Emergency deletion failed:', error);
            alert('Error during deletion. Check console.');
        }
    }

    permanentlyDelete(id) {
        if (confirm('Permanently delete this item? This cannot be undone.')) {
            const bin = dataManager.getData().recycleBin || [];
            const index = bin.findIndex(item => item.id === id);
            if (index !== -1) {
                bin.splice(index, 1);
                dataManager.updateData({ recycleBin: bin });
                this.renderRecycleBin();
            }
        }
    }


    exportToJSON() {
        try {
            const data = dataManager.getData();
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `day2day-data-${new Date().toISOString().split('T')[0]}.json`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            const statusEl = document.getElementById('backup-status');
            if (statusEl) {
                statusEl.innerHTML = `<p style="color: green;">JSON file downloaded. Save it to your OneDrive project folder.</p>`;
            }
        } catch (error) {
            console.error('Export JSON error:', error);
            alert('Error exporting JSON file. Please try again.');
        }
    }

    getDepartmentNameForExport(deptId) {
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
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new Day2DayApp();
});

