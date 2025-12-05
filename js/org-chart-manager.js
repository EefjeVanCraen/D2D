// Org Chart Manager - Handles organizational chart operations
class OrgChartManager {
    constructor() {
        this.currentChartId = null;
        this.currentPositionId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderOrgCharts();
    }

    setupEventListeners() {
        const addBtn = document.getElementById('add-org-chart-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openOrgChartModal());
        }

        const form = document.getElementById('org-chart-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveOrgChart();
            });
        }

        const closeBtn = document.getElementById('org-chart-modal-close');
        const cancelBtn = document.getElementById('org-chart-cancel-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeOrgChartModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeOrgChartModal());

        // Position form listeners
        const positionForm = document.getElementById('position-form');
        if (positionForm) {
            positionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.savePosition();
            });
        }

        const positionCloseBtn = document.getElementById('position-modal-close');
        const positionCancelBtn = document.getElementById('position-cancel-btn');
        if (positionCloseBtn) positionCloseBtn.addEventListener('click', () => this.closePositionModal());
        if (positionCancelBtn) positionCancelBtn.addEventListener('click', () => this.closePositionModal());
    }

    openOrgChartModal(chartId = null) {
        this.currentChartId = chartId;
        const modal = document.getElementById('org-chart-modal');
        const title = document.getElementById('org-chart-modal-title');
        const form = document.getElementById('org-chart-form');

        if (modal && title && form) {
            if (chartId) {
                const chart = dataManager.getOrgChart(chartId);
                if (chart) {
                    title.textContent = 'Edit Org Chart';
                    document.getElementById('org-chart-name').value = chart.name || '';
                    document.getElementById('org-chart-description').value = chart.description || '';
                }
            } else {
                title.textContent = 'Create New Org Chart';
                form.reset();
            }
            modal.classList.add('active');
        }
    }

    closeOrgChartModal() {
        const modal = document.getElementById('org-chart-modal');
        if (modal) {
            modal.classList.remove('active');
            this.currentChartId = null;
        }
    }

    saveOrgChart() {
        const name = document.getElementById('org-chart-name').value.trim();
        if (!name) {
            alert('Please enter a name for the org chart');
            return;
        }

        const description = document.getElementById('org-chart-description').value.trim();

        if (this.currentChartId) {
            // Update existing
            dataManager.updateOrgChart(this.currentChartId, {
                name,
                description,
                updated: new Date().toISOString()
            });
        } else {
            // Create new
            dataManager.addOrgChart({
                name,
                description,
                positions: []
            });
        }

        this.closeOrgChartModal();
        this.renderOrgCharts();
    }

    deleteOrgChart(chartId) {
        if (confirm('Are you sure you want to delete this org chart? This will also delete all positions in it.')) {
            dataManager.deleteOrgChart(chartId);
            this.renderOrgCharts();
        }
    }

    renderOrgCharts() {
        const container = document.getElementById('org-charts-list');
        if (!container) return;

        const charts = dataManager.getOrgCharts();
        container.innerHTML = '';

        if (charts.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No org charts yet. Create one to get started!</p>';
            return;
        }

        charts.forEach(chart => {
            const card = document.createElement('div');
            card.className = 'org-chart-card';
            
            const positionCount = chart.positions ? chart.positions.length : 0;
            const createdDate = chart.created ? new Date(chart.created).toLocaleDateString() : '';
            
            card.innerHTML = `
                <div class="org-chart-card-header">
                    <div>
                        <h3 class="org-chart-card-title">${chart.name}</h3>
                        <p class="org-chart-card-meta">${positionCount} position${positionCount !== 1 ? 's' : ''} | Created: ${createdDate}</p>
                        ${chart.description ? `<p class="org-chart-card-description">${chart.description}</p>` : ''}
                    </div>
                    <div class="org-chart-card-actions">
                        <button class="card-btn" onclick="orgChartManager.viewOrgChart('${chart.id}')" title="View">👁️</button>
                        <button class="card-btn" onclick="orgChartManager.openOrgChartModal('${chart.id}')" title="Edit">✏️</button>
                        <button class="card-btn" onclick="orgChartManager.deleteOrgChart('${chart.id}')" title="Delete">🗑️</button>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });
    }

    viewOrgChart(chartId) {
        const chart = dataManager.getOrgChart(chartId);
        if (!chart) return;

        // Show the org chart view section
        const viewSection = document.getElementById('org-chart-view-section');
        const listSection = document.getElementById('org-charts-list-section');
        
        if (viewSection && listSection) {
            listSection.style.display = 'none';
            viewSection.style.display = 'block';
            
            // Set current chart
            this.currentChartId = chartId;
            
            // Render the chart
            this.renderChartView(chart);
        }
    }

    backToOrgChartsList() {
        const viewSection = document.getElementById('org-chart-view-section');
        const listSection = document.getElementById('org-charts-list-section');
        
        if (viewSection && listSection) {
            viewSection.style.display = 'none';
            listSection.style.display = 'block';
            this.currentChartId = null;
        }
    }

    renderChartView(chart) {
        const container = document.getElementById('org-chart-view');
        const title = document.getElementById('org-chart-view-title');
        
        if (!container || !title) return;

        title.textContent = chart.name;
        
        // Render positions
        this.renderPositions(chart);
        
        // Render visual chart
        this.renderVisualChart(chart);
    }

    renderPositions(chart) {
        const container = document.getElementById('org-chart-positions-list');
        if (!container) return;

        let positions = chart.positions || [];
        
        // Migrate old charts that use reportsTo to level-based system
        positions = this.migrateChartToLevels(positions, chart.id);
        
        container.innerHTML = '';

        if (positions.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No positions yet. Add positions to build your org chart.</p>';
            return;
        }

        // Sort positions by level (0, -1, -2, etc.) - descending so 0 appears first
        const sortedPositions = [...positions].sort((a, b) => {
            const levelA = parseInt(a.level || 0);
            const levelB = parseInt(b.level || 0);
            return levelB - levelA; // 0, -1, -2, -3... (0 at top)
        });

        sortedPositions.forEach(position => {
            const item = document.createElement('div');
            item.className = 'position-item';
            
            const level = parseInt(position.level || 0);
            const levelLabel = level === 0 ? 'Top Level (0)' : `Level ${level}`;
            
            item.innerHTML = `
                <div class="position-item-content">
                    <div>
                        <div class="position-name">${position.name}</div>
                        <div class="position-title">${position.title || 'No title'}</div>
                        <div class="position-meta">
                            ${position.department ? `<span>Dept: ${position.department}</span>` : ''}
                            <span class="position-level-badge">${levelLabel}</span>
                        </div>
                    </div>
                    <div class="position-item-actions">
                        <button class="card-btn" onclick="orgChartManager.openPositionModal('${chart.id}', '${position.id}')" title="Edit">✏️</button>
                        <button class="card-btn" onclick="orgChartManager.deletePosition('${chart.id}', '${position.id}')" title="Delete">🗑️</button>
                    </div>
                </div>
            `;

            container.appendChild(item);
        });
    }

    renderVisualChart(chart) {
        const container = document.getElementById('org-chart-visual');
        if (!container) return;

        let positions = chart.positions || [];
        if (positions.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Add positions to see the visual org chart.</p>';
            return;
        }

        // Migrate old charts that use reportsTo to level-based system
        positions = this.migrateChartToLevels(positions, chart.id);

        // Group positions by level
        const positionsByLevel = {};
        positions.forEach(pos => {
            const level = parseInt(pos.level || 0);
            if (!positionsByLevel[level]) {
                positionsByLevel[level] = [];
            }
            positionsByLevel[level].push(pos);
        });

        // Get all levels sorted (0, -1, -2, etc.) - descending so 0 appears first
        const levels = Object.keys(positionsByLevel)
            .map(l => parseInt(l))
            .sort((a, b) => b - a); // Sort descending: 0, -1, -2, -3... (0 at top)

        let html = '<div class="org-chart-visual-container">';
        
        levels.forEach(level => {
            const levelPositions = positionsByLevel[level];
            html += this.renderLevel(levelPositions, level);
        });

        html += '</div>';
        container.innerHTML = html;
    }

    renderLevel(positions, level) {
        if (positions.length === 0) return '';

        const levelLabel = level === 0 ? 'Top Level' : `Level ${level}`;
        
        let html = `
            <div class="org-chart-level-container" data-level="${level}">
                <div class="org-chart-level-label">${levelLabel}</div>
                <div class="org-chart-level-nodes">
        `;
        
        positions.forEach(position => {
            html += `
                <div class="org-chart-node">
                    <div class="org-chart-node-box">
                        <div class="org-chart-node-name">${position.name}</div>
                        <div class="org-chart-node-title">${position.title || ''}</div>
                        ${position.department ? `<div class="org-chart-node-dept">${position.department}</div>` : ''}
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
        
        return html;
    }

    openPositionModal(chartId, positionId = null) {
        this.currentChartId = chartId;
        this.currentPositionId = positionId;
        const modal = document.getElementById('position-modal');
        const title = document.getElementById('position-modal-title');
        const form = document.getElementById('position-form');

        if (modal && title && form) {
            const chart = dataManager.getOrgChart(chartId);
            if (!chart) return;

            // Populate department dropdown
            const deptSelect = document.getElementById('position-department');
            if (deptSelect) {
                const departments = dataManager.getDepartments();
                deptSelect.innerHTML = '<option value="">No Department</option>';
                departments.forEach(dept => {
                    deptSelect.innerHTML += `<option value="${dept.name}">${dept.name}</option>`;
                });
            }

            // Migrate chart if needed
            let positions = this.migrateChartToLevels(chart.positions || [], chart.id);
            
            if (positionId) {
                const position = positions.find(p => p.id === positionId);
                if (position) {
                    title.textContent = 'Edit Position';
                    document.getElementById('position-name').value = position.name || '';
                    document.getElementById('position-title').value = position.title || '';
                    document.getElementById('position-department').value = position.department || '';
                    // Use level, or default to 0 if not set
                    const level = position.level !== undefined && position.level !== null ? position.level : '0';
                    document.getElementById('position-level').value = level;
                }
            } else {
                title.textContent = 'Add Position';
                form.reset();
                // Set default level to -1 if there are already positions, otherwise 0
                if (positions.length > 0) {
                    // Find the lowest level (most negative)
                    const levels = positions.map(p => parseInt(p.level || 0));
                    const lowestLevel = Math.min(...levels);
                    document.getElementById('position-level').value = lowestLevel - 1;
                } else {
                    document.getElementById('position-level').value = '0';
                }
            }
            modal.classList.add('active');
        }
    }

    closePositionModal() {
        const modal = document.getElementById('position-modal');
        if (modal) {
            modal.classList.remove('active');
            this.currentPositionId = null;
        }
    }

    savePosition() {
        if (!this.currentChartId) return;

        const name = document.getElementById('position-name').value.trim();
        if (!name) {
            alert('Please enter a name for the position');
            return;
        }

        const title = document.getElementById('position-title').value.trim();
        const department = document.getElementById('position-department').value;
        const level = parseInt(document.getElementById('position-level').value) || 0;

        const chart = dataManager.getOrgChart(this.currentChartId);
        if (!chart) return;

        if (this.currentPositionId) {
            // Update existing
            dataManager.updateOrgChartPosition(this.currentChartId, this.currentPositionId, {
                name,
                title,
                department,
                level,
                updated: new Date().toISOString()
            });
        } else {
            // Add new
            dataManager.addOrgChartPosition(this.currentChartId, {
                name,
                title,
                department,
                level
            });
        }

        this.closePositionModal();
        const updatedChart = dataManager.getOrgChart(this.currentChartId);
        if (updatedChart) {
            this.renderChartView(updatedChart);
            this.renderVisualChart(updatedChart);
        }
    }

    deletePosition(chartId, positionId) {
        if (confirm('Are you sure you want to delete this position?')) {
            dataManager.deleteOrgChartPosition(chartId, positionId);
            const chart = dataManager.getOrgChart(chartId);
            if (chart) {
                this.renderChartView(chart);
                this.renderVisualChart(chart);
            }
        }
    }

    migrateChartToLevels(positions, chartId) {
        // Check if migration is needed (positions have reportsTo but no level)
        const needsMigration = positions.some(p => p.reportsTo !== undefined && (p.level === undefined || p.level === null));
        
        if (!needsMigration) {
            return positions;
        }

        // Build a map of position IDs to positions
        const positionMap = {};
        positions.forEach(p => {
            positionMap[p.id] = p;
        });

        // Function to calculate level based on reportsTo
        const calculateLevel = (position, visited = new Set()) => {
            if (visited.has(position.id)) {
                // Circular reference, default to -1
                return -1;
            }
            visited.add(position.id);

            // If already has level, use it
            if (position.level !== undefined && position.level !== null) {
                return parseInt(position.level);
            }

            // If no reportsTo, it's top level (0)
            if (!position.reportsTo) {
                return 0;
            }

            // Find the manager
            const manager = positionMap[position.reportsTo];
            if (!manager) {
                // Manager not found, default to -1
                return -1;
            }

            // Recursively calculate manager's level, then subtract 1
            const managerLevel = calculateLevel(manager, visited);
            return managerLevel - 1;
        };

        // Calculate levels for all positions
        const migratedPositions = positions.map(position => {
            const level = calculateLevel(position);
            const updatedPosition = {
                ...position,
                level: level
            };
            // Remove reportsTo if it exists (keep level)
            if (updatedPosition.reportsTo !== undefined) {
                delete updatedPosition.reportsTo;
            }
            return updatedPosition;
        });

        // Save migrated positions back to the chart
        if (chartId) {
            const chart = dataManager.getOrgChart(chartId);
            if (chart) {
                chart.positions = migratedPositions;
                chart.updated = new Date().toISOString();
                dataManager.updateOrgChart(chartId, { positions: migratedPositions });
            }
        }

        return migratedPositions;
    }
}

const orgChartManager = new OrgChartManager();

