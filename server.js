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

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/backups', async (req, res) => {
	try {
		const backupsExist = await fs.pathExists(config.destinationFolder);
		if (!backupsExist) {
			return res.json({ backups: [] });
		}

		const backupFolders = await fs.readdir(config.destinationFolder);
		const backups = backupFolders
			.filter(folder => {
				// Filter for folders that match our backup naming pattern
				return /^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}_slot[1-4]_/.test(folder);
			})
			.map(folder => {
				const parts = folder.split('_');
				if (parts.length >= 3) {
					const timestamp = parts[0];
					const slotPart = parts[1];
					const nameParts = parts.slice(2);
					
					return {
						folderName: folder,
						timestamp,
						slot: slotPart.replace('slot', ''),
						name: nameParts.join('_')
					};
				}
				return null;
			})
			.filter(backup => backup !== null)
			.sort((a, b) => b.timestamp.localeCompare(a.timestamp)); // Sort by timestamp descending

		res.json({ backups });
	} catch (error) {
		console.error('Error fetching backups:', error);
		res.status(500).json({ error: 'Failed to fetch backups: ' + error.message });
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

		const targetFolder = path.join(config.destinationFolder, finalBackupName);
		await fs.ensureDir(targetFolder);

		const copyResults = [];
		const errors = [];

		// Copy user save files (user{slot}*)
		const userFilePattern = path.join(config.sourceFolder, `user${saveSlot}*`);
		try {
			const userFiles = await glob(userFilePattern.replace(/\\/g, '/'));
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

		res.json({
			success: true,
			message,
			backupCreated: finalBackupName,
			itemsCopied: copyResults,
		});
	} catch (error) {
		console.error('Error creating backup:', error);
		res.status(500).json({ error: 'Internal server error: ' + error.message });
	}
});

// Start server
app.listen(PORT, () => {
	console.log('🚀 Silksong Saver');
	console.log(`📁 Source folder: ${config.sourceFolder}`);
	console.log(`📁 Destination: ${config.destinationFolder}`);
	console.log(`🌐 Server running at http://localhost:${PORT}`);
});
