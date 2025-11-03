import path from 'path';

const USER_NAME = 'saiki';
const STEAM_ID = '115888760';
const BACKUP_FOLDER = 'Saves';
const BACKUP_SUBFOLDER = 'Steel Soul Saves';

const getSaveFolderPath = ({ userName, steamId } = { userName: USER_NAME, steamId: STEAM_ID }) => {
	return `C:\\Users\\${userName}\\AppData\\LocalLow\\Team Cherry\\Hollow Knight Silksong\\${steamId}`;
};

const config = {
	sourceFolder: getSaveFolderPath(),
	destinationFolder: path.join(getSaveFolderPath(), BACKUP_FOLDER, BACKUP_SUBFOLDER),
	port: 3000,
};

export default config;
