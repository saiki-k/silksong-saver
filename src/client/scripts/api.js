/**
 * @returns {Promise<Object>} Response containing backup data
 */
async function fetchBackups() {
	const response = await fetch('/backups');
	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to fetch backups');
	}

	return data;
}

/**
 * @returns {Promise<Object>} Configuration data
 */
async function fetchConfig() {
	const response = await fetch('/config');
	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to fetch configuration');
	}

	return data;
}

/**
 * @param {string} backupName - Name for the backup
 * @param {string} saveSlot - Save slot to backup
 * @returns {Promise<Object>} Response containing backup creation result
 */
async function createBackup(backupName, saveSlot) {
	const response = await fetch('/create-backup', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ backupName, saveSlot }),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to create backup');
	}

	return data;
}

/**
 * @param {string} folderName - Full backup folder name
 * @param {string} saveSlot - Save slot to restore to
 * @returns {Promise<Object>} Response containing restore result
 */
async function restoreBackup(folderName, saveSlot) {
	const response = await fetch('/restore-backup', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ folderName, saveSlot }),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to restore backup');
	}

	return data;
}

/**
 * @param {string} folderName - Full backup folder name
 * @param {string} newName - New display name for the backup
 * @returns {Promise<Object>} Response containing rename result
 */
async function renameBackup(folderName, newName) {
	const response = await fetch('/rename-backup', {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ folderName, newName }),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to rename backup');
	}

	return data;
}

/**
 * @param {string} folderName - Full backup folder name
 * @returns {Promise<Object>} Response containing deletion result
 */
async function deleteBackup(folderName) {
	const response = await fetch('/delete-backup', {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ folderName }),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to delete backup');
	}

	return data;
}
