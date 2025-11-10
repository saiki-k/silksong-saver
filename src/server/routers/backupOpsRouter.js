const express = require('express');

/**
 * @param {Object} options - Router options
 * @param {BackupOpsService} options.backupOpsService - Backup service instance
 * @param {Object} options.config - Configuration object
 * @returns {express.Router} Express router with backup routes
 */
function createBackupOpsRouter({ backupOpsService, config }) {
	const router = express.Router();

	router.get('/config', (req, res) => {
		const { sourceFolder, backupFolder, port } = config;
		res.json({ sourceFolder, backupFolder, port });
	});

	router.get('/backups', async (req, res) => {
		try {
			const backups = await backupOpsService.getBackups();
			res.json({ backups });
		} catch (error) {
			console.error('Error fetching backups:', error);
			res.status(500).json({ error: 'Failed to fetch backups: ' + error.message });
		}
	});

	router.post('/create-backup', async (req, res) => {
		try {
			const { backupName, saveSlot } = req.body;
			const result = await backupOpsService.createBackup(backupName, saveSlot);
			res.json(result);
		} catch (error) {
			console.error('Error creating backup:', error);

			let statusCode = 500;
			switch (true) {
				case error.message === 'Invalid save slot provided':
				case error.message === 'Invalid backup name provided':
				case error.message.startsWith('No save files found for slot'):
					statusCode = 400;
					break;
				default:
					statusCode = 500;
			}

			res.status(statusCode).json({ error: error.message });
		}
	});

	router.post('/restore-backup', async (req, res) => {
		try {
			const { folderName, saveSlot } = req.body;
			const result = await backupOpsService.restoreBackup(folderName, saveSlot);
			res.json(result);
		} catch (error) {
			console.error('Error restoring backup:', error);

			let statusCode = 500;
			switch (true) {
				case error.message === 'Invalid save slot provided':
				case error.message === 'Invalid backup folder name provided':
					statusCode = 400;
					break;
				case error.message === 'Backup folder not found':
					statusCode = 404;
					break;
				default:
					statusCode = 500;
			}

			res.status(statusCode).json({ error: error.message });
		}
	});

	router.put('/rename-backup', async (req, res) => {
		try {
			const { folderName, newName } = req.body;
			const result = await backupOpsService.renameBackup(folderName, newName);
			res.json(result);
		} catch (error) {
			console.error('Error renaming backup:', error);

			let statusCode = 500;
			switch (true) {
				case error.message === 'Invalid backup folder name provided':
				case error.message === 'Invalid new backup name provided':
					statusCode = 400;
					break;
				case error.message === 'Backup folder not found':
					statusCode = 404;
					break;
				default:
					statusCode = 500;
			}

			res.status(statusCode).json({ error: error.message });
		}
	});

	router.delete('/delete-backup', async (req, res) => {
		try {
			const { folderName } = req.body;
			const result = await backupOpsService.deleteBackup(folderName);
			res.json(result);
		} catch (error) {
			console.error('Error deleting backup:', error);

			let statusCode = 500;
			switch (true) {
				case error.message === 'Invalid backup folder name provided':
					statusCode = 400;
					break;
				case error.message === 'Backup folder not found':
					statusCode = 404;
					break;
				default:
					statusCode = 500;
			}

			res.status(statusCode).json({ error: error.message });
		}
	});

	return router;
}

module.exports = createBackupOpsRouter;
