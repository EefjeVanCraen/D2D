// Squad Manager - Handles squad operations and widgets
class SquadManager {
    constructor() {
        this.currentSquadId = null;
        this.searchQuery = '';
        this.init();
    }

    init() {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            this.setupEventListeners();
            this.renderSquads();
        }, 100);
    }

    setupEventListeners() {
        // Remove existing listeners first to avoid duplicates
        const importBtn = document.getElementById('import-squads-btn');
        if (importBtn) {
            // Clone and replace to remove old listeners
            const newImportBtn = importBtn.cloneNode(true);
            importBtn.parentNode.replaceChild(newImportBtn, importBtn);
            newImportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.importFromExcel();
            });
        }

        const addBtn = document.getElementById('add-squad-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openSquadModal());
        }

        const deleteAllBtn = document.getElementById('delete-all-squads-btn');
        if (deleteAllBtn) {
            deleteAllBtn.addEventListener('click', () => this.deleteAllSquads());
        }

        const searchInput = document.getElementById('squad-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderSquads();
            });
        }

        const form = document.getElementById('squad-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSquad();
            });
        }

        const closeBtn = document.getElementById('squad-modal-close');
        const cancelBtn = document.getElementById('squad-cancel-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeSquadModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeSquadModal());

        const addFieldBtn = document.getElementById('add-squad-data-field');
        if (addFieldBtn) {
            addFieldBtn.addEventListener('click', () => this.addDataField());
        }
    }

    importFromExcel() {
        console.log('Import button clicked');
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.xlsx,.xls';
            input.style.display = 'none';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    console.log('File selected:', file.name);
                    this.processExcelFile(file);
                } else {
                    console.log('No file selected');
                }
                // Remove input from DOM
                document.body.removeChild(input);
            };
            document.body.appendChild(input);
            input.click();
        } catch (error) {
            console.error('Error in importFromExcel:', error);
            alert('Error opening file dialog: ' + error.message);
        }
    }

    processExcelFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (typeof XLSX === 'undefined') {
                    alert('Excel library not loaded. Please refresh the page and try again.');
                    return;
                }

                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                
                // Find the "squadz 2.0" sheet
                const sheetName = workbook.SheetNames.find(name => 
                    name.toLowerCase().includes('squadz') || 
                    name.toLowerCase().includes('2.0')
                ) || workbook.SheetNames[0];
                
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, {header: 1, defval: ''});
                
                console.log('Total rows in Excel:', jsonData.length);
                console.log('First 10 rows:', jsonData.slice(0, 10));
                
                // Parse squads based on the simplified structure:
                // Row 6-15: Responsibilities (indices 5-14)
                // Row 17-23: Product People (indices 16-22)
                // Each squad has 3 columns
                
                const squads = [];
                
                // Find the maximum column width by checking ALL rows to ensure we don't miss anything
                let maxCols = 0;
                for (let row = 0; row < jsonData.length; row++) {
                    if (jsonData[row] && jsonData[row].length > maxCols) {
                        maxCols = jsonData[row].length;
                    }
                }
                
                console.log('Maximum columns found across ALL rows:', maxCols);
                console.log('Will process squads in groups of 3 columns');
                console.log('Total possible squad positions:', Math.ceil(maxCols / 3));
                
                // Process ALL possible squad positions (every 3 columns) - don't skip any
                // We'll check a wider range to make sure we don't miss any squads
                const totalSquadPositions = Math.ceil(maxCols / 3);
                console.log(`Processing ${totalSquadPositions} potential squad positions...`);
                
                for (let squadIndex = 0; squadIndex < totalSquadPositions; squadIndex++) {
                    const colStart = squadIndex * 3;
                    
                    // Check if there's any data in rows 6-15 (Responsibilities) or 17-23 (Product People)
                    let hasData = false;
                    let dataCount = 0;
                    
                    // Check responsibilities rows (6-15)
                    for (let row = 5; row <= 14; row++) {
                        if (jsonData[row]) {
                            for (let col = colStart; col < colStart + 3 && col < jsonData[row].length; col++) {
                                const value = jsonData[row][col];
                                if (value && value.toString().trim() !== '') {
                                    hasData = true;
                                    dataCount++;
                                }
                            }
                        }
                    }
                    
                    // Check product people rows (17-23)
                    for (let row = 16; row <= 22; row++) {
                        if (jsonData[row]) {
                            for (let col = colStart; col < colStart + 3 && col < jsonData[row].length; col++) {
                                const value = jsonData[row][col];
                                if (value && value.toString().trim() !== '') {
                                    hasData = true;
                                    dataCount++;
                                }
                            }
                        }
                    }
                    
                    // Only skip if absolutely no data found
                    if (!hasData) {
                        console.log(`Skipping columns ${colStart}-${colStart + 2}: no data in rows 6-15 or 17-23`);
                        continue;
                    }
                    
                    console.log(`Found squad at columns ${colStart}-${colStart + 2} with ${dataCount} data items`);
                    
                    // Generate squad name/number based on position
                    const squadNumber = Math.floor(colStart / 3) + 1;
                    const finalSquadNumber = `Squad ${squadNumber}`;
                    const finalSquadName = `Squad ${squadNumber}`;
                    
                    // Create squad object
                    const squad = {
                        id: this.generateId(),
                        name: finalSquadName,
                        data: {
                            'Squad Number': finalSquadNumber
                        },
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    
                    console.log(`Processing squad ${squads.length + 1}: "${finalSquadName}" (${finalSquadNumber}) at columns ${colStart}-${colStart + 2}`);
                    
                    // Collect data from the 3 columns for this squad
                    const squadCols = [colStart, colStart + 1, colStart + 2];
                    
                    // Row 6-15: Responsibilities (indices 5-14)
                    const responsibilities = [];
                    for (let row = 5; row <= 14; row++) {
                        if (jsonData[row]) {
                            squadCols.forEach(col => {
                                if (col < jsonData[row].length) {
                                    const value = jsonData[row][col];
                                    if (value && value.toString().trim() !== '') {
                                        responsibilities.push(value.toString().trim());
                                    }
                                }
                            });
                        }
                    }
                    if (responsibilities.length > 0) {
                        // Filter out city/country from responsibilities
                        const filteredResponsibilities = this.filterCityCountry(responsibilities);
                        
                        if (filteredResponsibilities.length > 0) {
                            squad.data['Responsibilities'] = filteredResponsibilities.join(', ');
                        }
                    }
                    
                    // Row 17-23: Product People (indices 16-22)
                    const productPeople = [];
                    for (let row = 16; row <= 22; row++) {
                        if (jsonData[row]) {
                            squadCols.forEach(col => {
                                if (col < jsonData[row].length) {
                                    const value = jsonData[row][col];
                                    if (value && value.toString().trim() !== '') {
                                        const valueStr = value.toString().trim();
                                        
                                        // Filter out city/country from product people
                                        if (!this.containsCityOrCountry(valueStr)) {
                                            productPeople.push(valueStr);
                                        }
                                    }
                                }
                            });
                        }
                    }
                    if (productPeople.length > 0) {
                        squad.data['Product People'] = productPeople.join(', ');
                    }
                    
                    squads.push(squad);
                    console.log(`✓ Added squad ${squads.length}: "${finalSquadName}" at columns ${colStart}-${colStart + 2}`);
                }
                
                console.log(`\n=== IMPORT SUMMARY ===`);
                console.log(`Total squads found: ${squads.length}`);
                console.log(`Maximum columns in file: ${maxCols}`);
                console.log(`Total possible squad positions checked: ${totalSquadPositions}`);
                console.log('Squad details:');
                squads.forEach((s, i) => {
                    const responsibilities = s.data['Responsibilities'] ? s.data['Responsibilities'].split(', ').length : 0;
                    const productPeople = s.data['Product People'] ? s.data['Product People'].split(', ').length : 0;
                    console.log(`  ${i + 1}. ${s.name} - ${responsibilities} responsibilities, ${productPeople} product people`);
                });
                console.log(`=====================\n`);
                
                if (squads.length > 0) {
                    // Merge with existing squads (avoid duplicates by name)
                    const existingSquads = dataManager.getSquads();
                    const existingNames = existingSquads.map(s => s.name.toLowerCase());
                    let importedCount = 0;
                    let skippedCount = 0;
                    
                    squads.forEach(squad => {
                        if (!existingNames.includes(squad.name.toLowerCase())) {
                            dataManager.addSquad(squad);
                            importedCount++;
                        } else {
                            skippedCount++;
                        }
                    });
                    
                    this.renderSquads();
                    alert(`Successfully imported ${importedCount} new squad(s)!\n\nTotal found in Excel: ${squads.length}\nSkipped (already exist): ${skippedCount}\nNewly imported: ${importedCount}\n\nSquads: ${squads.map(s => s.name).join(', ')}`);
                    console.log('Import successful:', importedCount, 'new squads imported,', skippedCount, 'skipped');
                    console.log('All squads found:', squads);
                    
                    if (squads.length < totalSquadPositions) {
                        console.warn(`Warning: Found ${squads.length} squads but checked ${totalSquadPositions} positions. Some positions may have been empty.`);
                    }
                } else {
                    alert('No squads found in the Excel file.');
                    console.log('No squads found in Excel file');
                }
            } catch (error) {
                alert('Error importing Excel file: ' + error.message);
                console.error('Import error:', error);
                console.error('Error stack:', error.stack);
            }
        };
        
        reader.onerror = (error) => {
            console.error('FileReader error:', error);
            alert('Error reading file. Please try again.');
        };
        
        reader.readAsArrayBuffer(file);
    }

    renderSquads() {
        const container = document.getElementById('squads-container');
        if (!container) return;
        
        let squads = dataManager.getSquads();
        
        // Filter squads based on search query
        if (this.searchQuery) {
            squads = squads.filter(squad => this.matchesSearch(squad, this.searchQuery));
        }
        
        if (squads.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <p>${this.searchQuery ? 'No squads match your search.' : 'No squads yet. Import from Excel or add a new squad!'}</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = squads.map(squad => this.createSquadWidget(squad)).join('');
        
        // Attach event listeners to widgets
        squads.forEach(squad => {
            const widget = document.querySelector(`[data-squad-id="${squad.id}"]`);
            if (widget) {
                const editBtn = widget.querySelector('.squad-edit-btn');
                const deleteBtn = widget.querySelector('.squad-delete-btn');
                
                if (editBtn) {
                    editBtn.addEventListener('click', () => this.openSquadModal(squad.id));
                }
                
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => this.deleteSquad(squad.id));
                }
            }
        });
    }

    createSquadWidget(squad) {
        // Format squad data for display
        // Filter out city and country information
        const dataEntries = Object.entries(squad.data || {});
        const filteredEntries = dataEntries.filter(([key, value]) => {
            if (!value || value.toString().trim() === '') return false;
            
            // Skip if key contains city/country terms
            const keyLower = key.toLowerCase();
            const cityCountryTerms = ['city', 'country', 'location', 'address', 'place', 'nation', 'state', 'region'];
            const keyHasCityCountry = cityCountryTerms.some(term => keyLower.includes(term));
            
            // Skip if value contains city/country
            const valueHasCityCountry = this.containsCityOrCountry(value.toString());
            
            return !keyHasCityCountry && !valueHasCityCountry;
        });
        
        const dataHtml = filteredEntries.map(([key, value]) => {
            // If value is comma-separated, filter out city/country from each item
            let displayValue = value.toString();
            if (displayValue.includes(',')) {
                const items = displayValue.split(',').map(item => item.trim());
                const filteredItems = this.filterCityCountry(items);
                displayValue = filteredItems.join(', ');
            }
            
            return `
                <div class="squad-data-item">
                    <strong>${this.escapeHtml(key)}:</strong> 
                    <span>${this.escapeHtml(displayValue)}</span>
                </div>
            `;
        }).join('');
        
        return `
            <div class="squad-widget" data-squad-id="${squad.id}">
                <div class="squad-widget-header">
                    <h3 class="squad-widget-title">${this.escapeHtml(squad.name)}</h3>
                    <div class="squad-widget-actions">
                        <button class="squad-edit-btn btn-icon" title="Edit Squad">✏️</button>
                        <button class="squad-delete-btn btn-icon" title="Delete Squad">🗑️</button>
                    </div>
                </div>
                <div class="squad-widget-body">
                    ${dataHtml || '<div class="squad-empty-data">No additional data</div>'}
                </div>
                <div class="squad-widget-footer">
                    <small>Updated: ${this.formatDate(squad.updatedAt)}</small>
                </div>
            </div>
        `;
    }

    openSquadModal(squadId = null) {
        this.currentSquadId = squadId;
        const modal = document.getElementById('squad-modal');
        const title = document.getElementById('squad-modal-title');
        
        if (squadId) {
            title.textContent = 'Edit Squad';
            const squad = dataManager.getSquads().find(s => s.id === squadId);
            if (squad) {
                document.getElementById('squad-id').value = squad.id;
                document.getElementById('squad-name').value = squad.name;
                
                // Populate data fields
                const dataContainer = document.getElementById('squad-data-container');
                dataContainer.innerHTML = '';
                
                Object.entries(squad.data || {}).forEach(([key, value]) => {
                    this.addDataField(key, value);
                });
            }
        } else {
            title.textContent = 'New Squad';
            document.getElementById('squad-form').reset();
            document.getElementById('squad-id').value = '';
            document.getElementById('squad-data-container').innerHTML = '';
        }
        
        if (modal) modal.classList.add('active');
    }

    closeSquadModal() {
        const modal = document.getElementById('squad-modal');
        if (modal) modal.classList.remove('active');
        const form = document.getElementById('squad-form');
        if (form) form.reset();
        this.currentSquadId = null;
    }

    addDataField(key = '', value = '') {
        const container = document.getElementById('squad-data-container');
        if (!container) return;
        
        const field = document.createElement('div');
        field.className = 'squad-data-field';
        field.innerHTML = `
            <input type="text" class="squad-data-key" placeholder="Field name" value="${this.escapeHtml(key)}" style="flex: 1; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;">
            <input type="text" class="squad-data-value" placeholder="Value" value="${this.escapeHtml(value)}" style="flex: 2; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; margin: 0 8px;">
            <button type="button" class="btn-icon remove-data-field" title="Remove field" style="background: var(--danger-color); color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">❌</button>
        `;
        container.appendChild(field);
        
        field.querySelector('.remove-data-field').addEventListener('click', () => {
            field.remove();
        });
    }

    saveSquad() {
        const squadId = document.getElementById('squad-id').value;
        const squadName = document.getElementById('squad-name').value.trim();
        
        if (!squadName) {
            alert('Squad name is required!');
            return;
        }
        
        // Collect data fields
        const dataFields = document.querySelectorAll('.squad-data-field');
        const squadData = {};
        
        dataFields.forEach(field => {
            const key = field.querySelector('.squad-data-key').value.trim();
            const value = field.querySelector('.squad-data-value').value.trim();
            if (key) {
                squadData[key] = value;
            }
        });
        
        if (squadId) {
            // Update existing squad
            dataManager.updateSquad(squadId, {
                name: squadName,
                data: squadData,
                updatedAt: new Date().toISOString()
            });
        } else {
            // Create new squad
            dataManager.addSquad({
                id: this.generateId(),
                name: squadName,
                data: squadData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
        
        this.renderSquads();
        this.closeSquadModal();
    }

    deleteSquad(squadId) {
        if (confirm('Are you sure you want to delete this squad?')) {
            dataManager.deleteSquad(squadId);
            this.renderSquads();
        }
    }

    deleteAllSquads() {
        const squads = dataManager.getSquads();
        
        if (squads.length === 0) {
            alert('No squads to delete.');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete ALL ${squads.length} squad(s)?\n\nThis action cannot be undone!`)) {
            return;
        }
        
        // Double confirmation for safety
        if (!confirm('Last chance! This will permanently delete all squads. Click OK to confirm.')) {
            return;
        }
        
        const count = squads.length;
        squads.forEach(squad => {
            dataManager.deleteSquad(squad.id);
        });
        
        this.renderSquads();
        alert(`Successfully deleted ${count} squad(s).`);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(dateStr) {
        if (!dateStr) return 'No date';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Helper function to check if text contains city/country information
    containsCityOrCountry(text) {
        if (!text || typeof text !== 'string') return false;
        
        const textLower = text.toLowerCase();
        
        // Check for city/country related terms in the text
        const cityCountryTerms = ['city', 'country', 'location', 'address', 'place', 'nation', 'state', 'region'];
        const hasCityCountry = cityCountryTerms.some(term => textLower.includes(term));
        
        // Check for common city/country names
        const cityCountryPatterns = [
            /\b(amsterdam|rotterdam|utrecht|the hague|den haag|eindhoven|groningen|tilburg|almere|breda|nijmegen|enschede|haarlem|arnhem|zaanstad|amersfoort|apeldoorn|hoofddorp|'s-hertogenbosch|maastricht|leiden|dordrecht|zoetermeer|zwolle|deventer|delft|heerlen|alkmaar|venlo|leeuwarden|helmond|amstelveen|purmerend|oss|schiedam|spijkenisse|veenendaal|roosendaal|doetinchem|terneuzen|hardinxveld-giessendam|emmen|vlaardingen|capelle aan den ijssel|heerhugowaard|almelo|gouda|zaandam|hoorn|ede|bergen op zoom|kampen|katwijk|barneveld|nijkerk|rijswijk|maassluis|papendrecht|woerden|noordwijk|driebergen-rijsenburg|hilversum|weert|oosterhout|middelburg|emmeloord|sneek|drachten)\b/i,
            /\b(netherlands|holland|dutch|nederland|belgium|belgian|belgie|germany|german|deutschland|france|french|uk|united kingdom|england|british|spain|spanish|espana|italy|italian|italia|portugal|portuguese|poland|polish|polska|sweden|swedish|sverige|norway|norwegian|norge|denmark|danish|danmark|finland|finnish|suomi|switzerland|swiss|schweiz|austria|austrian|osterreich|ireland|irish|eire|greece|greek|ellada|romania|romanian|czech|ceska|hungary|hungarian|magyarorszag)\b/i
        ];
        
        const matchesPattern = cityCountryPatterns.some(pattern => pattern.test(text));
        
        return hasCityCountry || matchesPattern;
    }

    // Helper function to filter city/country from an array of strings
    filterCityCountry(items) {
        return items.filter(item => !this.containsCityOrCountry(item));
    }

    // Helper function to check if a squad matches the search query
    matchesSearch(squad, query) {
        if (!query) return true;
        
        const queryLower = query.toLowerCase();
        
        // Search in squad name
        if (squad.name && squad.name.toLowerCase().includes(queryLower)) {
            return true;
        }
        
        // Search in squad number if it exists
        if (squad.data && squad.data['Squad Number']) {
            const squadNumber = squad.data['Squad Number'].toString().toLowerCase();
            if (squadNumber.includes(queryLower)) {
                return true;
            }
        }
        
        // Search in all data fields
        if (squad.data) {
            for (const [key, value] of Object.entries(squad.data)) {
                if (value && value.toString().toLowerCase().includes(queryLower)) {
                    return true;
                }
            }
        }
        
        return false;
    }
}

// Initialize squad manager
const squadManager = new SquadManager();

// Make deleteAllSquads available globally for console access
window.deleteAllSquads = function() {
    if (squadManager) {
        squadManager.deleteAllSquads();
    } else {
        // Direct deletion if manager not initialized
        const data = JSON.parse(localStorage.getItem('day2day-data') || '{}');
        data.squads = [];
        localStorage.setItem('day2day-data', JSON.stringify(data));
        location.reload();
    }
};

