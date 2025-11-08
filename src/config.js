import path from 'path';
import os from 'os';
import fs from 'fs';

const STEAM_ID = process.env.STEAM_ID;

if (!STEAM_ID) {
	throw new Error('STEAM_ID environment variable is not set. Please set it in your .env file.');
}

function getSaveFilesFolder() {
	switch (os.platform()) {
		case 'win32':
			return path.join(os.homedir(), 'AppData', 'LocalLow', 'Team Cherry', 'Hollow Knight Silksong', STEAM_ID);
		case 'darwin': // macOS
			return path.join(os.homedir(), 'Library', 'Application Support', 'unity.Team-Cherry.Silksong', STEAM_ID);
		case 'linux':
			return path.join(os.homedir(), '.config', 'unity3d', 'Team Cherry', 'Hollow Knight Silksong', STEAM_ID);
		default:
			throw new Error(`Unsupported platform: ${os.platform()}`);
	}
}

const SAVE_FILES_FOLDER = getSaveFilesFolder();

if (!fs.existsSync(SAVE_FILES_FOLDER)) {
	throw new Error(
		`Save files folder does not exist: ${SAVE_FILES_FOLDER}. Please ensure STEAM_ID is set correctly in your .env file.`
	);
}

const BACKUP_FOLDER = process.env.BACKUP_FOLDER;
const RELATIVE_BACKUP_FOLDER = process.env.RELATIVE_BACKUP_FOLDER || 'Save Backups';
const RELATIVE_BACKUP_SUBFOLDER = process.env.RELATIVE_BACKUP_SUBFOLDER || '';

const config = {
	sourceFolder: SAVE_FILES_FOLDER,
	backupFolder: BACKUP_FOLDER || path.join(SAVE_FILES_FOLDER, RELATIVE_BACKUP_FOLDER, RELATIVE_BACKUP_SUBFOLDER),
	port: process.env.PORT || 3000,
};

export default config;
