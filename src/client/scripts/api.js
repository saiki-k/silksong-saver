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
 * @param {string} fullBackupName - Full backup folder name
 * @param {string} saveSlot - Save slot to restore to
 * @returns {Promise<Object>} Response containing restore result
 */
async function restoreBackup(fullBackupName, saveSlot) {
	const response = await fetch('/restore-backup', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ fullBackupName, saveSlot }),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to restore backup');
	}

	return data;
}

/**
 * @param {string} fullBackupName - Full backup folder name
 * @param {string} backupSlot - Original save slot of the backup
 * @param {string} targetSlot - Target save slot to replace
 * @returns {Promise<Object>} Response containing replace result
 */
async function replaceBackup(fullBackupName, backupSlot, targetSlot) {
	const response = await fetch('/replace-backup', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ fullBackupName, backupSlot, targetSlot }),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to replace backup');
	}

	return data;
}

/**
 * @param {string} fullBackupName - Full backup folder name
 * @param {string} newName - New display name for the backup
 * @returns {Promise<Object>} Response containing rename result
 */
async function renameBackup(fullBackupName, newName) {
	const response = await fetch('/rename-backup', {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ fullBackupName, newName }),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to rename backup');
	}

	return data;
}

/**
 * @param {string} fullBackupName - Full backup folder name
 * @returns {Promise<Object>} Response containing deletion result
 */
async function deleteBackup(fullBackupName) {
	const response = await fetch('/delete-backup', {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ fullBackupName }),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to delete backup');
	}

	return data;
}
