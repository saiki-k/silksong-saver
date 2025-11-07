# 🤹‍♀️ Silksong Saver · Manage Unlimited Save Backups

A simple, local Node.js server for managing **Hollow Knight: Silksong** (Steam) save backups. Access it locally (http://localhost:3000) from Steam's in-game browser or any browser.

While the game provides only four save slots, this tool lets you create unlimited named backups for experimentation, testing different routes, or preserving specific moments you want to revisit.

I haven't tested it, but this should work with **Hollow Knight** saves as well.

![Screenshot](./screenshot.png)

## ✨ Features

-   **Create backups** with custom names for each save slot
-   **View all backups** with timestamps and slot information
-   **Rename / Restore / Delete backups** directly from the displayed backup list
-   **Configuration display** with current (source and backup) folder paths

## 🚀 Quick Setup

1. **Install Node.js**: Download from [nodejs.org](https://nodejs.org)
2. **Clone and install packages**:
    ```bash
    git clone https://github.com/saiki-k/silksong-saver.git
    cd silksong-saver
    npm install
    ```
3. **Update STEAM_ID** in `config.js` (optionally, you can also update `backupFolder` to change the backup destination folder)

    > 💡 **Steam Cloud Sync**: For Steam, consider setting your backup destination within the same folder where your save files are stored. This is the default configuration, so if this sounds good to you, no changes are needed! This ensures your backups are automatically synced across devices via [Steam Cloud](https://store.steampowered.com/account/remotestorageapp/?appid=1030300).
    >
    > ⚠️ **Steam Cloud Sync Warning**: When using Steam Cloud, always perform backup operations (rename/delete) while the game is running. If you modify backups while the game is closed, Steam may detect "missing" files and may resync these stale files when the game launches.

4. **Launch the server**: `npm start`
5. **Open in a (Steam) browser**: `http://localhost:3000`

## 📖 Usage

-   Launch the server before playing Silksong
-   Access via Steam's in-game web browser (Shift+Tab → Web Browser), or any web browser at `http://localhost:3000`
-   Create backups as needed during gameplay, after sitting at a bench
-   **Restore a backup**: Select a backup and restore it (replaces the current save file)
    -   ⚠️ After restoring a backup, you must exit and restart the game for changes to take effect
