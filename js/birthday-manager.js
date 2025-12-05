// Birthday Manager - Handles birthday operations and countdowns
class BirthdayManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderBirthdays();
        this.updateCountdowns();
        setInterval(() => this.updateCountdowns(), 60000); // Update every minute
    }

    setupEventListeners() {
        const addBtn = document.getElementById('add-birthday-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openBirthdayModal());
        }

        const form = document.getElementById('birthday-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveBirthday();
            });
        }

        const closeBtn = document.getElementById('birthday-modal-close');
        const cancelBtn = document.getElementById('birthday-cancel-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeBirthdayModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeBirthdayModal());
    }

    openBirthdayModal(birthdayId = null) {
        this.currentBirthdayId = birthdayId;
        const modal = document.getElementById('birthday-modal');
        const title = document.getElementById('birthday-modal-title');
        
        if (birthdayId) {
            title.textContent = 'Edit Birthday';
            const birthday = dataManager.getBirthdays().find(b => b.id === birthdayId);
            if (birthday) {
                document.getElementById('birthday-name').value = birthday.name || '';
                // Parse the date to extract month and day
                if (birthday.date) {
                    const dateParts = birthday.date.split('-');
                    if (dateParts.length >= 2) {
                        document.getElementById('birthday-month').value = dateParts[1] || '';
                        document.getElementById('birthday-day').value = dateParts[2] || '';
                    }
                }
            }
        } else {
            title.textContent = 'Add Birthday';
            document.getElementById('birthday-form').reset();
        }

        modal.classList.add('active');
    }

    saveBirthday() {
        const name = document.getElementById('birthday-name').value.trim();
        const month = document.getElementById('birthday-month').value;
        const day = document.getElementById('birthday-day').value;

        if (!name || !month || !day) {
            alert('Name, month, and day are required');
            return;
        }

        // Validate day based on month
        const dayNum = parseInt(day);
        const monthNum = parseInt(month);
        const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (dayNum < 1 || dayNum > daysInMonth[monthNum - 1]) {
            alert(`Invalid day for the selected month. Please enter a day between 1 and ${daysInMonth[monthNum - 1]}`);
            return;
        }

        // Format as YYYY-MM-DD using year 2000 as placeholder (leap year for Feb 29)
        const paddedDay = String(dayNum).padStart(2, '0');
        const date = `2000-${month}-${paddedDay}`;

        const birthday = {
            name,
            date
        };

        if (this.currentBirthdayId) {
            dataManager.updateBirthday(this.currentBirthdayId, birthday);
        } else {
            dataManager.addBirthday(birthday);
        }

        this.closeBirthdayModal();
        this.renderBirthdays();
        this.updateCountdowns();
    }

    closeBirthdayModal() {
        document.getElementById('birthday-modal').classList.remove('active');
        this.currentBirthdayId = null;
        document.getElementById('birthday-form').reset();
    }

    deleteBirthday(birthdayId) {
        if (confirm('Delete this birthday?')) {
            dataManager.deleteBirthday(birthdayId);
            this.renderBirthdays();
            this.updateCountdowns();
        }
    }

    updateCountdowns() {
        const birthdays = dataManager.getBirthdays();
        const today = new Date();
        const currentYear = today.getFullYear();

        // Find user's birthday (March 13)
        const userBirthday = birthdays.find(b => b.name.includes('Eefje') || b.date.includes('-03-13'));
        if (userBirthday) {
            const myBirthday = this.getNextBirthday(userBirthday.date, currentYear);
            const daysUntil = this.getDaysUntil(myBirthday);
            const countdownEl = document.getElementById('my-birthday-countdown');
            if (countdownEl) {
                countdownEl.textContent = `${daysUntil} days`;
            }
        }

        // Find nearest birthday
        let nearestBirthday = null;
        let nearestDays = Infinity;

        birthdays.forEach(birthday => {
            const nextBirthday = this.getNextBirthday(birthday.date, currentYear);
            const daysUntil = this.getDaysUntil(nextBirthday);
            if (daysUntil < nearestDays) {
                nearestDays = daysUntil;
                nearestBirthday = birthday;
            }
        });

        if (nearestBirthday) {
            const countdownEl = document.getElementById('next-birthday-countdown');
            if (countdownEl) {
                countdownEl.textContent = `${nearestBirthday.name}: ${nearestDays} days`;
            }
        }
    }

    getNextBirthday(dateStr, currentYear) {
        const [year, month, day] = dateStr.split('-').map(Number);
        let birthday = new Date(currentYear, month - 1, day);
        
        // If birthday has passed this year, use next year
        const today = new Date();
        if (birthday < today) {
            birthday = new Date(currentYear + 1, month - 1, day);
        }
        
        return birthday;
    }

    getDaysUntil(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(date);
        target.setHours(0, 0, 0, 0);
        const diff = target - today;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    renderBirthdays() {
        const container = document.getElementById('birthdays-list');
        if (!container) return;

        const birthdays = dataManager.getBirthdays();
        
        // Sort by next birthday date
        const sorted = birthdays.map(b => ({
            ...b,
            nextDate: this.getNextBirthday(b.date, new Date().getFullYear())
        })).sort((a, b) => a.nextDate - b.nextDate);

        container.innerHTML = '';

        if (sorted.length === 0) {
            container.innerHTML = '<p>No birthdays added yet.</p>';
            return;
        }

        sorted.forEach(birthday => {
            const card = document.createElement('div');
            card.className = 'birthday-card';
            
            const nextDate = this.getNextBirthday(birthday.date, new Date().getFullYear());
            const daysUntil = this.getDaysUntil(nextDate);
            const dateStr = nextDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            
            card.innerHTML = `
                <div class="card-header">
                    <div>
                        <div class="card-title">${birthday.name}</div>
                        <div class="card-meta">
                            <span>Next: ${dateStr}</span>
                            <span class="badge badge-primary">${daysUntil} days</span>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="card-btn" onclick="birthdayManager.openBirthdayModal('${birthday.id}')" title="Edit">✏️</button>
                        <button class="card-btn" onclick="birthdayManager.deleteBirthday('${birthday.id}')" title="Delete">🗑️</button>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });
    }
}

const birthdayManager = new BirthdayManager();

