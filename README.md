# Day2Day Platform

A comprehensive daily task and idea management dashboard for Eefje Van Craen.

## Features

### Dashboard
- **Customizable Widgets**: Drag and resize widgets to organize your workspace
- **Calendar Widget**: View tasks by date with counters for active, due this week, and overdue tasks
- **Tasks Due Today**: Quick view of today's tasks with headlines and tags
- **Tasks This Week**: Overview of upcoming tasks
- **Weekly Summaries**: View recent weekly summary headlines

### Task Management
- Add, edit, delete, and complete tasks
- Set due dates, priorities, departments, and tags
- Filter tasks by department, tag, priority, and status
- Recycle bin for deleted items (with restore capability)

### Ideas Management
- Track and manage ideas with descriptions
- Organize by department and tags
- Filter and search functionality

### Birthday Calendar
- Track birthdays with countdowns
- Sidebar shows countdown to your birthday (March 13) and nearest birthday
- Add, edit, and manage birthday entries

### Weekly Summaries
- **Automatic Generation**: Every Friday at 5 PM CET, a summary is automatically created
- Includes completed tasks, active tasks, and ideas from the week
- View all summaries chronologically

### Data Management
- **Local Storage**: All data is stored in browser's localStorage
- **OneDrive Sync**: Data is automatically exported to JSON files in the project folder
- **Monthly Backups**: Automatic monthly backups (configurable in settings)
- **Export to Excel**: Export all data to Excel format
- **Print Support**: Print any section of the dashboard

### Customization
- Add custom departments
- Create custom tags
- Set task priorities (High, Medium, Low)
- Filter by any criteria across all sections

## Getting Started

### Launch the Application

1. **Double-click** `launch-day2day.bat` to open in your default browser
2. Or open `index.html` directly in your browser

### Create Desktop Shortcut

Run the PowerShell script to create a desktop shortcut:
```powershell
.\create-desktop-shortcut.ps1
```

### Pin to Taskbar

1. Run the PowerShell script:
```powershell
.\create-taskbar-shortcut.ps1
```

2. Open Start Menu and search for "Day2Day Platform"
3. Right-click the shortcut and select "Pin to taskbar"
   - Or drag the shortcut from Start Menu to the taskbar

## Project Structure

```
Day2Day Platform/
├── index.html              # Main HTML file
├── styles/
│   └── main.css           # Main stylesheet
├── js/
│   ├── data-manager.js    # Data storage and management
│   ├── widget-manager.js  # Widget system (drag, resize, etc.)
│   ├── task-manager.js    # Task operations
│   ├── idea-manager.js    # Idea operations
│   ├── birthday-manager.js # Birthday management and countdowns
│   ├── summary-manager.js  # Weekly summary automation
│   └── main.js            # Main application controller
├── CnG logo.png           # Application logo
├── create-desktop-shortcut.ps1
├── create-taskbar-shortcut.ps1
├── launch-day2day.bat
└── README.md
```

## Usage

### Adding Tasks
1. Navigate to the **Tasks** section
2. Click **+ Add Task**
3. Fill in the headline (required) and other details
4. Set due date, priority, department, and tag as needed
5. Click **Save**

### Managing Ideas
1. Go to the **Ideas** section
2. Click **+ Add Idea**
3. Enter headline and description
4. Assign department and tag if needed
5. Click **Save**

### Customizing Widgets
1. On the dashboard, drag widgets to reposition
2. Resize widgets by dragging the bottom-right corner
3. Click the settings icon (⚙️) on any widget to change its type or title
4. Click **+ Add Widget** to add new widgets

### Settings
1. Click the **Settings** button (⚙️) in the sidebar
2. Manage departments, tags, and backup settings
3. Create manual backups anytime

### Exporting Data
1. Click **Export All** in the sidebar
2. An Excel file will be downloaded with all your data
3. Data is organized into separate sheets: Tasks, Ideas, Birthdays, Summaries

### Recycle Bin
1. Navigate to **Recycle Bin** in the sidebar
2. View deleted items
3. Restore items or permanently delete them

## Data Storage

- **Primary Storage**: Browser localStorage (persists between sessions)
- **Backup Location**: Data is exported to JSON files in the project folder
- **Automatic Backups**: Monthly backups are created automatically (first of each month)
- **Manual Backups**: Create backups anytime from Settings

## Weekly Summaries

Weekly summaries are automatically generated every **Friday at 5 PM CET**. They include:
- Completed tasks from the week
- Active tasks
- All ideas

Summaries are saved and can be viewed in the **Summaries** section.

## Birthday Countdowns

The sidebar displays:
- **My Birthday**: Countdown to March 13
- **Next Birthday**: Countdown to the nearest birthday in your calendar

## Filtering

All sections support filtering:
- **Search**: Text search across headlines and descriptions
- **Department**: Filter by department
- **Tag**: Filter by tag
- **Priority**: Filter by priority (tasks only)
- **Status**: Filter by status (tasks only)

## Technical Details

- **Pure JavaScript**: No frameworks, easy to modify
- **LocalStorage API**: Client-side data persistence
- **SheetJS**: Excel export functionality
- **Responsive Design**: Works on different screen sizes
- **CET Timezone**: All times displayed in Central European Time

## Customization via Cursor

The codebase is structured for easy modification:
- **Modular Design**: Each feature is in its own file
- **Clear Separation**: Data, UI, and logic are separated
- **Well-commented**: Code includes comments for clarity
- **No Dependencies**: Pure JavaScript, no build process needed

## Troubleshooting

### Data Not Saving
- Check browser localStorage is enabled
- Ensure you have sufficient storage space
- Try clearing browser cache and reloading

### Widgets Not Dragging
- Make sure you're clicking on the widget header
- Check browser console for JavaScript errors

### Weekly Summary Not Generating
- Ensure the page is open on Friday at 5 PM CET
- Check browser console for errors
- Manually trigger summary creation if needed

## Support

For issues or modifications, use Cursor to edit the relevant JavaScript files. The code is designed to be maintainable and extensible.

---

**Created for Eefje Van Craen**  
**Version 1.0**
