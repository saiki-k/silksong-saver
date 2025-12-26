const fs = require('fs-extra');
const path = require('path');
const { glob } = require('glob');

class BackupOpsService {
	constructor(config, metaService) {
		this.config = config;
		this.metaService = metaService;
	}

	/**
	 * @returns {Promise<Array>} Array of backup objects
	 */
	async getBackups() {
		const backupsExist = await fs.pathExists(this.config.backupFolder);
		if (!backupsExist) {
			return [];
		}

		const meta = await this.metaService.loadMeta();
		const backupFolders = await fs.readdir(this.config.backupFolder);

		const backups = backupFolders
			.filter((folder) => {
				return /^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}_slot[1-4]_/.test(folder);
			})
			.map((folder) => {
				const parts = folder.split('_');
				if (parts.length >= 3) {
					const timestamp = parts[0];
					const slotPart = parts[1];
					const nameParts = parts.slice(2);
					const metaInfo = meta[folder] || {
						originalName: nameParts.join(' ').toLowerCase(),
						restoreCount: 0,
					};

					return {
						fullBackupName: folder,
						timestamp,
						slot: slotPart.replace('slot', ''),
						name: metaInfo.originalName,
						restoreCount: metaInfo.restoreCount,
					};
				}
				return null;
			})
			.filter((backup) => backup !== null)
			.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

		return backups;
	}

	/**
	 * @param {string} backupName - User-provided backup name
	 * @param {string} saveSlot - Save slot number (1-4)
	 * @returns {Promise<Object>} Backup creation result
	 */
	async createBackup(backupName, saveSlot) {
		// Validate inputs
		if (!saveSlot || !['1', '2', '3', '4'].includes(saveSlot)) {
			throw new Error('Invalid save slot provided');
		}

		if (!backupName || typeof backupName !== 'string' || !backupName.trim()) {
			throw new Error('Invalid backup name provided');
		}

		// Generate backup folder name
		const sanitizedBackupName = backupName
			.trim()
			.toLowerCase()
			.replace(/[<>:"/\\|?* ]/g, '_');
		const timestamp = new Date().toLocaleString('sv-SE').replace(/[\/: ]/g, '-');
		const finalBackupName = `${timestamp}_slot${saveSlot}_${sanitizedBackupName}`;

		// Check if save files exist
		const userFilePattern = path.join(this.config.sourceFolder, `user${saveSlot}*`);
		let userFiles;
		try {
			userFiles = await glob(userFilePattern.replace(/\\/g, '/'));
			if (userFiles.length === 0) {
				throw new Error(`No save files found for slot ${saveSlot}`);
			}
		} catch (error) {
			throw new Error(`Failed to check save files: ${error.message}`);
		}

		// Create backup directory
		const targetFolder = path.join(this.config.backupFolder, finalBackupName);
		await fs.ensureDir(targetFolder);

		const copyResults = [];
		const errors = [];

		// Copy user save files
		try {
			for (const userFile of userFiles) {
				const fileName = path.basename(userFile);
				const targetPath = path.join(targetFolder, fileName);
				await fs.copy(userFile, targetPath);
				copyResults.push(fileName);
				console.log(`✓ Copied: ${fileName}`);
			}
		} catch (error) {
			errors.push(`Failed to copy user files: ${error.message}`);
		}

		// Copy restore points folder
		const restoreFolder = path.join(this.config.sourceFolder, `Restore_Points${saveSlot}`);
		try {
			const restoreFolderExists = await fs.pathExists(restoreFolder);
			if (restoreFolderExists) {
				const targetRestoreFolder = path.join(targetFolder, `Restore_Points${saveSlot}`);
				await fs.copy(restoreFolder, targetRestoreFolder);
				copyResults.push(`Restore_Points${saveSlot}/`);
				console.log(`✓ Copied: Restore_Points${saveSlot}/`);
			}
		} catch (error) {
			errors.push(`Failed to copy restore folder: ${error.message}`);
		}

		// Update metadata
		const meta = await this.metaService.loadMeta();
		meta[finalBackupName] = {
			originalName: backupName.trim(),
			timestamp,
			restoreCount: 0,
		};
		await this.metaService.saveMeta(meta);

		// Build response message
		let message = `✅ Successfully created the backup "${finalBackupName}"!`;
		if (copyResults.length > 0) {
			message += `\nCopied: ${copyResults.join(', ')}`;
		}
		if (errors.length > 0) {
			message += `\nWarnings: ${errors.join('; ')}`;
		}

		return {
			success: true,
			message,
			backupCreated: finalBackupName,
			originalName: backupName.trim(),
			itemsCopied: copyResults,
		};
	}

	/**
	 * Restores a backup to the specified save slot
	 * @param {string} fullBackupName - Backup folder name
	 * @param {string} saveSlot - Target save slot (1-4)
	 * @returns {Promise<Object>} Restore result
	 */
	async restoreBackup(fullBackupName, saveSlot) {
		// Validate inputs
		if (!saveSlot || !['1', '2', '3', '4'].includes(saveSlot)) {
			throw new Error('Invalid save slot provided');
		}

		if (!fullBackupName || typeof fullBackupName !== 'string') {
			throw new Error('Invalid backup folder name provided');
		}

		// Check if backup exists
		const backupPath = path.join(this.config.backupFolder, fullBackupName);
		const backupExists = await fs.pathExists(backupPath);
		if (!backupExists) {
			throw new Error('Backup folder not found');
		}

		const restoredFiles = [];
		const errors = [];

		// Restore user files
		const userFilePattern = path.join(backupPath, `user${saveSlot}*`);
		const userFiles = await glob(userFilePattern.replace(/\\/g, '/'));

		for (const userFile of userFiles) {
			const fileName = path.basename(userFile);
			const targetPath = path.join(this.config.sourceFolder, fileName);

			try {
				await fs.copy(userFile, targetPath);
				restoredFiles.push(fileName);
				console.log(`✓ Restored: ${fileName}`);
			} catch (error) {
				errors.push(`Failed to restore ${fileName}: ${error.message}`);
			}
		}

		// Restore Restore_Points folder
		const restorePointsSource = path.join(backupPath, `Restore_Points${saveSlot}`);
		const restorePointsTarget = path.join(this.config.sourceFolder, `Restore_Points${saveSlot}`);

		const restorePointsExist = await fs.pathExists(restorePointsSource);
		if (restorePointsExist) {
			try {
				await fs.remove(restorePointsTarget);
				await fs.copy(restorePointsSource, restorePointsTarget);
				restoredFiles.push(`Restore_Points${saveSlot}/`);
				console.log(`✓ Restored: Restore_Points${saveSlot}/`);
			} catch (error) {
				errors.push(`Failed to restore Restore_Points${saveSlot}: ${error.message}`);
			}
		}

		// Update restore count in metadata
		const meta = await this.metaService.loadMeta();
		if (meta[fullBackupName]) {
			meta[fullBackupName].restoreCount = (meta[fullBackupName].restoreCount ?? 0) + 1;
			await this.metaService.saveMeta(meta);
		}

		// Build response message
		let message = `✅ Successfully restored the backup to slot ${saveSlot}!`;
		if (restoredFiles.length > 0) {
			message += `\nRestored: ${restoredFiles.join(', ')}`;
		}
		if (errors.length > 0) {
			message += `\nWarnings: ${errors.join('; ')}`;
		}

		return {
			success: true,
			message,
			itemsRestored: restoredFiles,
		};
	}

	/**
	 * Replaces a save slot with the contents of a backup
	 * @param {string} fullBackupName - Backup folder name
	 * @param {string} backupSlot - Original save slot of the backup
	 * @param {string} targetSlot - Target save slot to replace (1-4)
	 * @returns {Promise<Object>} Replace result
	 */
	async replaceBackup(fullBackupName, backupSlot, targetSlot) {
		// Validate inputs
		if (!targetSlot || !['1', '2', '3', '4'].includes(targetSlot)) {
			throw new Error('Invalid target save slot provided');
		}

		if (!backupSlot || !['1', '2', '3', '4'].includes(backupSlot)) {
			throw new Error('Invalid backup slot provided');
		}

		if (targetSlot === backupSlot) {
			throw new Error('Target slot cannot be the same as the backup slot');
		}

		if (!fullBackupName || typeof fullBackupName !== 'string') {
			throw new Error('Invalid backup folder name provided');
		}

		// Check if backup exists
		const backupPath = path.join(this.config.backupFolder, fullBackupName);
		const backupExists = await fs.pathExists(backupPath);
		if (!backupExists) {
			throw new Error('Backup folder not found');
		}

		const restoredFiles = [];
		const errors = [];

		// Replace user files
		const userFilePattern = path.join(backupPath, `user${backupSlot}*`);
		const userFiles = await glob(userFilePattern.replace(/\\/g, '/'));

		for (const userFile of userFiles) {
			const fileName = path.basename(userFile).replace(`user${backupSlot}`, `user${targetSlot}`);
			const targetPath = path.join(this.config.sourceFolder, fileName);

			try {
				await fs.copy(userFile, targetPath);
				restoredFiles.push(fileName);
				console.log(`✓ Replaced: ${fileName}`);
			} catch (error) {
				errors.push(`Failed to replace ${fileName}: ${error.message}`);
			}
		}

		// Replace Restore_Points folder
		const restorePointsSource = path.join(backupPath, `Restore_Points${backupSlot}`);
		const restorePointsTarget = path.join(this.config.sourceFolder, `Restore_Points${targetSlot}`);

		const restorePointsExist = await fs.pathExists(restorePointsSource);
		if (restorePointsExist) {
			try {
				await fs.remove(restorePointsTarget);
				await fs.copy(restorePointsSource, restorePointsTarget);
				restoredFiles.push(`Restore_Points${targetSlot}/`);
				console.log(`✓ Replaced: Restore_Points${targetSlot}/`);
			} catch (error) {
				errors.push(`Failed to replace Restore_Points${targetSlot}: ${error.message}`);
			}
		}

		// Build response message
		let message = `✅ Successfully replaced slot ${targetSlot} with the backup!`;
		if (restoredFiles.length > 0) {
			message += `\nReplaced: ${restoredFiles.join(', ')}`;
		}
		if (errors.length > 0) {
			message += `\nWarnings: ${errors.join('; ')}`;
		}

		return {
			success: true,
			message,
			itemsReplaced: restoredFiles,
		};
	}

	/**
	 * @param {string} fullBackupName - Current backup folder name
	 * @param {string} newName - New display name for the backup
	 * @returns {Promise<Object>} Rename result
	 */
	async renameBackup(fullBackupName, newName) {
		if (!fullBackupName || typeof fullBackupName !== 'string') {
			throw new Error('Invalid backup folder name provided');
		}

		if (!newName || typeof newName !== 'string' || !newName.trim()) {
			throw new Error('Invalid new backup name provided');
		}

		const backupPath = path.join(this.config.backupFolder, fullBackupName);
		const backupExists = await fs.pathExists(backupPath);
		if (!backupExists) {
			throw new Error('Backup folder not found');
		}

		// Parse the existing folder name to extract timestamp and slot
		const folderParts = fullBackupName.split('_');
		if (folderParts.length < 3) {
			throw new Error('Invalid backup folder name format');
		}

		const timestamp = folderParts[0];
		const slotPart = folderParts[1];

		// Validate timestamp and slot format
		if (!/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$/.test(timestamp)) {
			throw new Error('Invalid timestamp format in backup folder name');
		}
		if (!/^slot[1-4]$/.test(slotPart)) {
			throw new Error('Invalid slot format in backup folder name');
		}

		const newSanitizedBackupName = newName
			.trim()
			.toLowerCase()
			.replace(/[<>:"/\\|?* ]/g, '_');
		const newFullBackupName = `${timestamp}_${slotPart}_${newSanitizedBackupName}`;

		const newBackupPath = path.join(this.config.backupFolder, newFullBackupName);
		const newPathExists = await fs.pathExists(newBackupPath);
		if (newPathExists && newFullBackupName !== fullBackupName) {
			throw new Error('A backup with this name already exists for the same timestamp and slot');
		}

		// If the folder name would be the same, just update metadata
		if (newFullBackupName === fullBackupName) {
			const meta = await this.metaService.loadMeta();
			if (meta[fullBackupName]) {
				meta[fullBackupName].originalName = newName.trim();
				await this.metaService.saveMeta(meta);
			}

			return {
				success: true,
				message: `✅ Successfully renamed the backup to "${newName.trim()}"!`,
				newDisplayName: newName.trim(),
				newFullBackupName: fullBackupName,
			};
		}

		// Rename the physical folder
		await fs.move(backupPath, newBackupPath);
		console.log(`✓ Renamed folder: ${fullBackupName} -> ${newFullBackupName}`);

		// Update metadata - remove the old entry and add the new one
		const meta = await this.metaService.loadMeta();
		if (meta[fullBackupName]) {
			const metaData = { ...meta[fullBackupName] };
			metaData.originalName = newName.trim();

			delete meta[fullBackupName];
			meta[newFullBackupName] = metaData;

			await this.metaService.saveMeta(meta);
		}

		return {
			success: true,
			message: `✅ Successfully renamed the backup to "${newName.trim()}"!`,
			newDisplayName: newName.trim(),
			newFullBackupName,
		};
	}

	/**
	 * @param {string} fullBackupName - Backup folder name to delete
	 * @returns {Promise<Object>} Deletion result
	 */
	async deleteBackup(fullBackupName) {
		if (!fullBackupName || typeof fullBackupName !== 'string') {
			throw new Error('Invalid backup folder name provided');
		}

		const backupPath = path.join(this.config.backupFolder, fullBackupName);
		const backupExists = await fs.pathExists(backupPath);
		if (!backupExists) {
			throw new Error('Backup folder not found');
		}

		// Remove backup folder
		await fs.remove(backupPath);
		console.log(`✓ Deleted backup: ${fullBackupName}`);

		// Remove from metadata
		const meta = await this.metaService.loadMeta();
		if (meta[fullBackupName]) {
			delete meta[fullBackupName];
			await this.metaService.saveMeta(meta);
		}

		return {
			success: true,
			message: `✅ Successfully deleted the backup "${fullBackupName}"!`,
			deletedBackup: fullBackupName,
		};
	}
}

module.exports = BackupOpsService;
