const fs = require('fs-extra');
const path = require('path');

class MetaService {
	constructor(config) {
		this.config = config;
	}

	/**
	 * Gets the path to the meta.json file
	 * @returns {Promise<string>} Path to meta.json
	 */
	async getMetaPath() {
		return path.join(this.config.backupFolder, 'meta.json');
	}

	/**
	 * Loads metadata from meta.json file
	 * @returns {Promise<Object>} Metadata object
	 */
	async loadMeta() {
		const metaPath = await this.getMetaPath();
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

	/**
	 * Saves metadata to meta.json file
	 * @param {Object} meta - Metadata object to save
	 */
	async saveMeta(meta) {
		const metaPath = await this.getMetaPath();
		await fs.ensureDir(path.dirname(metaPath));
		await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));
	}

	/**
	 * Initializes metadata for existing backups
	 */
	async initializeMeta() {
		await fs.ensureDir(this.config.backupFolder);
		const meta = await this.loadMeta();

		const backupFolders = await fs.readdir(this.config.backupFolder).catch(() => []);
		const existingBackups = backupFolders.filter((folder) =>
			/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}_slot[1-4]_/.test(folder)
		);

		let updated = false;

		// Add metadata for existing backups without metadata
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

		// Remove metadata for non-existent backups
		const metaKeys = Object.keys(meta);
		for (const key of metaKeys) {
			const folderPath = path.join(this.config.backupFolder, key);
			const exists = await fs.pathExists(folderPath);
			if (!exists) {
				delete meta[key];
				updated = true;
			}
		}

		if (updated) {
			await this.saveMeta(meta);
		}
	}
}

module.exports = MetaService;
