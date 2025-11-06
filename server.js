const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { glob } = require('glob');

const app = express();

let config;
try {
	config = require('./config').default;
} catch (error) {
	console.error('Error loading config.json:', error.message);
	process.exit(1);
}

const PORT = config.port || 3000;

async function getMetaPath() {
	return path.join(config.backupFolder, 'meta.json');
}

async function loadMeta() {
	const metaPath = await getMetaPath();
	try {
		const exists = await fs.pathExists(metaPath);
		if (!exists) {
			return {};
		}
		const data = await fs.readFile(metaPath, 'utf8');
		return JSON.parse(data);
	} catch (error) {
		console.error('Error loading meta.json:', error);
		return {};
	}
}

async function saveMeta(meta) {
	const metaPath = await getMetaPath();
	await fs.ensureDir(path.dirname(metaPath));
	await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));
}

async function initializeMeta() {
	await fs.ensureDir(config.backupFolder);
	const meta = await loadMeta();

	const backupFolders = await fs.readdir(config.backupFolder).catch(() => []);
	const existingBackups = backupFolders.filter((folder) =>
		/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}_slot[1-4]_/.test(folder)
	);

	let updated = false;

	for (const folder of existingBackups) {
		if (!meta[folder]) {
			const parts = folder.split('_');
			const nameParts = parts.slice(2);
			meta[folder] = {
				originalName: nameParts.join(' ').toLowerCase(),
				timestamp: parts[0],
				restoreCount: 0,
			};
			updated = true;
		}
	}

	const metaKeys = Object.keys(meta);
	for (const key of metaKeys) {
		const folderPath = path.join(config.backupFolder, key);
		const exists = await fs.pathExists(folderPath);
		if (!exists) {
			delete meta[key];
			updated = true;
		}
	}

	if (updated) {
		await saveMeta(meta);
	}
}

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/backups', async (req, res) => {
	try {
		const backupsExist = await fs.pathExists(config.backupFolder);
		if (!backupsExist) {
			return res.json({ backups: [] });
		}

		const meta = await loadMeta();
		const backupFolders = await fs.readdir(config.backupFolder);
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
						folderName: folder,
						timestamp,
						slot: slotPart.replace('slot', ''),
						name: metaInfo.originalName,
						restoreCount: metaInfo.restoreCount,
					};
				}
				return null;
			})
			.filter((backup) => backup !== null)
			.sort((a, b) => b.timestamp.localeCompare(a.timestamp)); // Sort by timestamp descending

		res.json({ backups });
	} catch (error) {
		console.error('Error fetching backups:', error);
		res.status(500).json({ error: 'Failed to fetch backups: ' + error.message });
	}
});

app.get('/config', (req, res) => {
	try {
		res.json({
			sourceFolder: config.sourceFolder,
			backupFolder: config.backupFolder,
			port: PORT,
		});
	} catch (error) {
		console.error('Error fetching config:', error);
		res.status(500).json({ error: 'Failed to fetch config: ' + error.message });
	}
});

app.post('/create-backup', async (req, res) => {
	try {
		const { backupName, saveSlot } = req.body;

		if (!saveSlot || !['1', '2', '3', '4'].includes(saveSlot)) {
			return res.status(400).json({ error: 'Invalid save slot provided' });
		}

		if (!backupName || typeof backupName !== 'string' || !backupName.trim()) {
			return res.status(400).json({ error: 'Invalid backup name provided' });
		}

		const sanitizedBackupName = backupName
			.trim()
			.toLowerCase()
			.replace(/[<>:"/\\|?* ]/g, '_');
		const timestamp = new Date().toLocaleString('sv-SE').replace(/[\/: ]/g, '-');
		const finalBackupName = `${timestamp}_slot${saveSlot}_${sanitizedBackupName}`;

		// Check if save files exist before creating backup directory
		const userFilePattern = path.join(config.sourceFolder, `user${saveSlot}*`);
		let userFiles;
		try {
			userFiles = await glob(userFilePattern.replace(/\\/g, '/'));
			if (userFiles.length === 0) {
				return res.status(400).json({ error: `No save files found for slot ${saveSlot}` });
			}
		} catch (error) {
			return res.status(500).json({ error: `Failed to check save files: ${error.message}` });
		}

		const targetFolder = path.join(config.backupFolder, finalBackupName);
		await fs.ensureDir(targetFolder);

		const copyResults = [];
		const errors = [];

		// Copy user save files (user{slot}*)
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
		const restoreFolder = path.join(config.sourceFolder, `Restore_Points${saveSlot}`);
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

		let message = `✅ Successfully created backup "${finalBackupName}"`;
		if (copyResults.length > 0) {
			message += `\nCopied: ${copyResults.join(', ')}`;
		}

		if (errors.length > 0) {
			message += `\nWarnings: ${errors.join('; ')}`;
		}

		const meta = await loadMeta();
		meta[finalBackupName] = {
			originalName: backupName.trim(),
			timestamp,
			restoreCount: 0,
		};
		await saveMeta(meta);

		res.json({
			success: true,
			message,
			backupCreated: finalBackupName,
			originalName: backupName.trim(),
			itemsCopied: copyResults,
		});
	} catch (error) {
		console.error('Error creating backup:', error);
		res.status(500).json({ error: 'Internal server error: ' + error.message });
	}
});

app.post('/restore-backup', async (req, res) => {
	try {
		const { folderName, saveSlot } = req.body;

		if (!saveSlot || !['1', '2', '3', '4'].includes(saveSlot)) {
			return res.status(400).json({ error: 'Invalid save slot provided' });
		}

		if (!folderName || typeof folderName !== 'string') {
			return res.status(400).json({ error: 'Invalid backup folder name provided' });
		}

		const backupPath = path.join(config.backupFolder, folderName);
		const backupExists = await fs.pathExists(backupPath);

		if (!backupExists) {
			return res.status(404).json({ error: 'Backup folder not found' });
		}

		const restoredFiles = [];
		const errors = [];

		const userFilePattern = path.join(backupPath, `user${saveSlot}*`);
		const userFiles = await glob(userFilePattern.replace(/\\/g, '/'));

		for (const userFile of userFiles) {
			const fileName = path.basename(userFile);
			const targetPath = path.join(config.sourceFolder, fileName);

			try {
				await fs.copy(userFile, targetPath);
				restoredFiles.push(fileName);
				console.log(`✓ Restored: ${fileName}`);
			} catch (error) {
				errors.push(`Failed to restore ${fileName}: ${error.message}`);
			}
		}

		const restorePointsSource = path.join(backupPath, `Restore_Points${saveSlot}`);
		const restorePointsTarget = path.join(config.sourceFolder, `Restore_Points${saveSlot}`);

		const restorePointsExists = await fs.pathExists(restorePointsSource);
		if (restorePointsExists) {
			try {
				await fs.remove(restorePointsTarget);
				await fs.copy(restorePointsSource, restorePointsTarget);
				restoredFiles.push(`Restore_Points${saveSlot}/`);
				console.log(`✓ Restored: Restore_Points${saveSlot}/`);
			} catch (error) {
				errors.push(`Failed to restore Restore_Points${saveSlot}: ${error.message}`);
			}
		}

		let message = `✅ Successfully restored backup to slot ${saveSlot}`;
		if (restoredFiles.length > 0) {
			message += `\nRestored: ${restoredFiles.join(', ')}`;
		}

		if (errors.length > 0) {
			message += `\nWarnings: ${errors.join('; ')}`;
		}

		const meta = await loadMeta();
		if (meta[folderName]) {
			meta[folderName].restoreCount = (meta[folderName].restoreCount ?? 0) + 1;
			await saveMeta(meta);
		}

		res.json({
			success: true,
			message,
			itemsRestored: restoredFiles,
		});
	} catch (error) {
		console.error('Error restoring backup:', error);
		res.status(500).json({ error: 'Internal server error: ' + error.message });
	}
});

app.delete('/delete-backup', async (req, res) => {
	try {
		const { folderName } = req.body;

		if (!folderName || typeof folderName !== 'string') {
			return res.status(400).json({ error: 'Invalid backup folder name provided' });
		}

		const backupPath = path.join(config.backupFolder, folderName);
		const backupExists = await fs.pathExists(backupPath);

		if (!backupExists) {
			return res.status(404).json({ error: 'Backup folder not found' });
		}

		await fs.remove(backupPath);
		console.log(`✓ Deleted backup: ${folderName}`);

		const meta = await loadMeta();
		if (meta[folderName]) {
			delete meta[folderName];
			await saveMeta(meta);
		}

		res.json({
			success: true,
			message: `✅ Successfully deleted backup "${folderName}"`,
			deletedBackup: folderName,
		});
	} catch (error) {
		console.error('Error deleting backup:', error);
		res.status(500).json({ error: 'Internal server error: ' + error.message });
	}
});

// Start server
app.listen(PORT, async () => {
	await initializeMeta();

	console.log('🚀 Silksong Saver');
	console.log(`📁 Source folder: ${config.sourceFolder}`);
	console.log(`📁 Backup folder: ${config.backupFolder}`);
	console.log(`🌐 Server running at http://localhost:${PORT}`);
});
