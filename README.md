# Day2Day Platform

A comprehensive daily task and idea management dashboard for Eefje Van Craen.

**Version 2.0** — Optimized April 2026

## Quick Start

1. **Double-click** `launch-day2day.bat` — opens the platform AND backs up to GitHub
2. Or open `index.html` directly in your browser
3. **First time?** Run `setup-daily-github-backup.ps1` as Administrator to enable auto-backups

## What's New in v2.0

- **Fixed**: Idea modal tags not populating (critical bug)
- **Fixed**: CET timezone now correctly handles summer time (CEST)
- **Fixed**: Calendar prev/next month navigation actually works now
- **Fixed**: Weekly summaries open in a proper viewer instead of alert()
- **Fixed**: Daily backup no longer auto-downloads files (saves to localStorage instead)
- **Optimized**: Reduced excessive data reloading (was re-parsing JSON every render)
- **Optimized**: Periodic save reduced from 30s to 2min (less battery/CPU drain)
- **Optimized**: Fixed event listener memory leaks on Squads/Credit Circle/Settings
- **New**: Automatic daily GitHub backup (on launch + scheduled task)
- **New**: Data recovery page (`data-recovery.html`)
- **New**: 7-day rolling localStorage backup (no more surprise file downloads)

## GitHub Backup System

Your data is protected with **3 layers of backup**:

| Layer | Method | Frequency | Location |
|-------|--------|-----------|----------|
| 1 | localStorage rolling backup | Daily (auto) | Browser localStorage (7 days) |
| 2 | GitHub push | Every launch + daily 6 PM | github.com/EefjeVanCraen/D2D |
| 3 | Manual export | On demand | JSON/Excel file download |

### Setup Daily GitHub Backup
```powershell
# Run once as Administrator:
.\setup-daily-github-backup.ps1
```
This creates a Windows Task Scheduler job that pushes to GitHub every day at 6 PM.

### Manual GitHub Backup
Double-click `BACKUP-NOW.bat` to commit and push immediately.

### Data Recovery
Open `data-recovery.html` in your browser to:
- View storage health status
- Export current data or daily backups
- Restore from a daily backup or file
- Inspect raw data

## Features

### Dashboard
- Customizable drag-and-drop widgets
- Calendar with working month navigation
- Task counters (active, due this week, overdue)
- Quick views for tasks, ideas, meetings, birthdays

### Task Management
- Add, edit, delete, complete tasks
- Due dates, priorities, departments, tags, people
- Special tags for Asana-style weekly summaries
- Filter by any combination of criteria
- Recycle bin with restore

### Ideas, Meetings, Credit Circle, Squads, Org Charts, Birthdays
- Full CRUD operations on all entities
- Department/people associations
- Create tasks from meetings, ideas, or credit circle outcomes
- Excel import for squads

### Weekly Summaries
- Auto-generated every Friday at 5 PM CET/CEST
- Proper summary viewer with formatted content

### Settings & Customization
- Custom departments with sub-departments and people
- Custom tags with department associations
- Sidebar color themes
- Draggable sidebar navigation order
- Resizable settings modal

## Project Structure

```
Day2Day Platform/
├── index.html                      # Main app
├── data-recovery.html              # Data diagnostics & recovery
├── styles/main.css                 # Stylesheet
├── js/
│   ├── data-manager.js             # Data storage, backup, CRUD
│   ├── widget-manager.js           # Dashboard widgets
│   ├── task-manager.js             # Tasks
│   ├── idea-manager.js             # Ideas
│   ├── meeting-manager.js          # Meetings
│   ├── birthday-manager.js         # Birthdays
│   ├── summary-manager.js          # Weekly summaries
│   ├── squad-manager.js            # Squads
│   ├── credit-circle-manager.js    # Credit Circle
│   ├── org-chart-manager.js        # Org Charts
│   └── main.js                     # App controller
├── launch-day2day.bat              # Launch + backup
├── Day2Day-Launcher.vbs            # VBS launcher + backup
├── BACKUP-NOW.bat                  # Manual GitHub backup
├── backup-to-github.ps1            # GitHub commit/push script
├── setup-daily-github-backup.ps1   # Task Scheduler setup
├── CnG logo.png                    # Logo
└── README.md
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Data not saving | Open `data-recovery.html` to check localStorage |
| Widgets not dragging | Click on widget header, not content |
| GitHub push fails | Run `git push origin main` manually to authenticate |
| Wrong time displayed | Timezone uses Europe/Brussels (auto CET/CEST) |
| Tags missing in ideas | Fixed in v2.0 — clear cache and reload |

## Technical Details

- Pure JavaScript, no frameworks
- localStorage API for persistence
- Intl.DateTimeFormat for proper CET/CEST timezone
- SheetJS for Excel export
- Git + GitHub for version-controlled backups

---

**Created for Eefje Van Craen**  
**Repository**: https://github.com/EefjeVanCraen/D2D
