import path from 'path';

const USER_NAME = 'saiki';
const STEAM_ID = '115888760';

const SAVE_FILES_FOLDER = `C:\\Users\\${USER_NAME}\\AppData\\LocalLow\\Team Cherry\\Hollow Knight Silksong\\${STEAM_ID}`;

/**
 ** 💡 Steam Cloud Sync
 ** With Steam, it's recommended to keep your backups within the SAVE_FILES_FOLDER.
 ** This way, they will be automatically synced to Steam Cloud, and will be available across devices.
 **
 ** ⚠️ Steam Cloud Sync Warning
 ** When using Steam Cloud, always perform backup operations (rename/delete)
 ** while the game is running. If you modify backups while the game is closed, Steam may
 ** detect "missing" files and may resync these stale files when the game launches.
 **
 ** RELATIVE_BACKUP_FOLDER, and RELATIVE_BACKUP_SUBFOLDER are relative folders inside SAVE_FILES_FOLDER.
 ** These folders will be created if they do not exist.
 **
 ** You can change RELATIVE_BACKUP_SUBFOLDER to an empty string '' if you don't want a subfolder.
 */
const RELATIVE_BACKUP_FOLDER = 'Save Backups';
const RELATIVE_BACKUP_SUBFOLDER = 'Steel Soul Saves';

const config = {
	sourceFolder: SAVE_FILES_FOLDER,
	backupFolder: path.join(SAVE_FILES_FOLDER, RELATIVE_BACKUP_FOLDER, RELATIVE_BACKUP_SUBFOLDER),
	port: 3000,
};

export default config;
