# Day2Day Platform - Backup & Data Safety

## Automatic Daily Backups

Your Day2Day Platform automatically creates daily backups of all your data. Here's how it works:

### How It Works

1. **Automatic Daily Backups**: Every day, the system automatically creates a backup file
2. **Backup File Format**: Files are named `day2day-backup-YYYY-MM-DD.json`
3. **Data Included**: All tasks, ideas, birthdays, summaries, widgets, departments, tags, and settings
4. **Auto-Save to OneDrive**: Backups are automatically moved to your OneDrive `backups` folder

### Automatic OneDrive Sync (SETUP REQUIRED)

**One-Time Setup:**

1. **Run the Setup Script**: Double-click `setup-auto-backup-mover.ps1` in the project folder
   - This creates a Windows scheduled task that runs every hour
   - The task automatically moves backup files from Downloads to the OneDrive backups folder

2. **Automatic Operation**: Once set up:
   - Daily backups download to your Downloads folder
   - The scheduled task automatically moves them to: `Day2Day Platform\backups\`
   - OneDrive automatically syncs them to the cloud

3. **Manual Option**: If you prefer, you can manually move backup files to the `backups` folder

### Backup Location

Backups are automatically saved to:
```
C:\Users\vancraee\OneDrive - moodys.com\GPG\Credit Strategy\Cursor\Projects\Day2Day Platform\backups\
```

This folder is in your OneDrive, so files automatically sync to the cloud.

### Restoring from Backup

If your dashboard crashes or you need to restore data:

1. Go to **Settings** (⚙️ icon in sidebar)
2. Click the **Backup** tab
3. Click **"Choose File"** and select a backup JSON file
4. Click **"Restore from Selected File"**
5. Confirm the restore (this will replace all current data)
6. The page will reload with your restored data

### Data Storage

- **Primary Storage**: Browser localStorage (saves automatically as you work)
- **Daily Backups**: JSON files downloaded to your Downloads folder
- **OneDrive Sync**: Move backup files to the `backups` folder for cloud sync

### Important Notes

- **Archive URL Warning**: If you see "archive" in the URL, this is normal for local HTML files. The dashboard works perfectly fine - it's just a browser security indicator.
- **Backup Frequency**: Backups are created once per day (the first time you open the dashboard each day)
- **File Location**: Backup files are saved to your browser's default download location
- **Data Safety**: Your data is stored in browser localStorage AND backed up daily to files

### Troubleshooting

**If backups aren't downloading:**
- Check your browser's download settings
- Ensure pop-ups aren't blocked for file downloads
- Check your Downloads folder for backup files

**If you need to restore:**
- Use the restore function in Settings > Backup tab
- Select a backup JSON file from your Downloads or backups folder
- Confirm the restore to replace current data

---

**Remember**: Move your daily backup files to the `backups` folder to ensure they sync to OneDrive!

