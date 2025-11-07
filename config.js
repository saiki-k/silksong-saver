import path from 'path';
import os from 'os';
import fs from 'fs';

const STEAM_ID = process.env.STEAM_ID || 'YOUR_STEAM_USER_ID_HERE';

function getSaveFilesFolder() {
	const platform = os.platform();
	const homeDir = os.homedir();

	switch (platform) {
		case 'win32':
			return path.join(homeDir, 'AppData', 'LocalLow', 'Team Cherry', 'Hollow Knight Silksong', STEAM_ID);
		case 'darwin': // macOS
			return path.join(homeDir, 'Library', 'Application Support', 'unity.Team-Cherry.Silksong', STEAM_ID);
		case 'linux':
			return path.join(homeDir, '.config', 'unity3d', 'Team Cherry', 'Hollow Knight Silksong', STEAM_ID);
		default:
			throw new Error(`Unsupported platform: ${platform}`);
	}
}

const SAVE_FILES_FOLDER = getSaveFilesFolder();

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

if (!fs.existsSync(SAVE_FILES_FOLDER)) {
	throw new Error(
		`Save files folder does not exist: ${SAVE_FILES_FOLDER}. Please ensure STEAM_ID is set correctly in config.js.`
	);
}

export default config;
