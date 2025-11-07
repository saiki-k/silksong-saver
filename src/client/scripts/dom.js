async function loadBackups() {
	const backupsList = document.getElementById('backupsList');

	try {
		backupsList.innerHTML = '<div class="loading">Loading backups...</div>';
		const data = await fetchBackups();
		displayBackups(data.backups);
	} catch (error) {
		backupsList.innerHTML = '<div class="error">Failed to load backups</div>';
	}
}

async function loadConfig() {
	const configInfo = document.getElementById('configInfo');

	try {
		configInfo.innerHTML = '<div class="loading">Loading configuration...</div>';
		const data = await fetchConfig();
		displayConfig(data);
	} catch (error) {
		configInfo.innerHTML = '<div class="error">Network error loading configuration</div>';
	}
}

/**
 * @param {Array} backups - Array of backup objects
 */
function displayBackups(backups) {
	const backupsList = document.getElementById('backupsList');

	if (backups.length === 0) {
		backupsList.innerHTML = '<div class="no-backups">No backups found. Create your first backup above!</div>';
		return;
	}

	backupsList.innerHTML = backups
		.map((backup) => {
			const displayName = backup.name;
			const formattedTimestamp = formatTimestamp(backup.timestamp);

			return `
			<div class="backup-card">
				<div class="backup-info">
					<div class="backup-name">${displayName}</div>
					<div class="backup-bottom">
						<div class="backup-pills">
							<span class="pill timestamp">${formattedTimestamp}</span>
							<span class="pill slot">Slot ${backup.slot}</span>
							${backup.restoreCount > 0 ? `<span class="pill restore-count">Restored ${backup.restoreCount}x</span>` : ''}
						</div>
						<div class="backup-actions">
							<button class="restore-btn" data-backup-name="${backup.folderName}" data-slot="${backup.slot}">
								Restore
							</button>
							<button class="delete-btn" data-backup-name="${backup.folderName}">
								Delete
							</button>
						</div>
					</div>
				</div>
			</div>
		`;
		})
		.join('');

	addBackupButtonListeners();
}

/**
 * @param {Object} config - Configuration object
 */
function displayConfig(config) {
	const configInfo = document.getElementById('configInfo');

	configInfo.innerHTML = `
		<div class="config-item">
			<span class="config-label">Source Folder</span>
			<span class="config-value">${config.sourceFolder}</span>
		</div>
		<div class="config-item">
			<span class="config-label">Backup Folder</span>
			<span class="config-value">${config.backupFolder}</span>
		</div>
	`;
}

/**
 * @param {HTMLElement} restoreBtn - The restore button element
 */
function updateRestoreCount(restoreBtn) {
	const card = restoreBtn.closest('.backup-card');
	const pillsContainer = card.querySelector('.backup-pills');
	let restoreCountPill = pillsContainer.querySelector('.pill.restore-count');

	if (restoreCountPill) {
		const currentCount = parseInt(restoreCountPill.textContent.match(/\d+/)[0]);
		restoreCountPill.textContent = `Restored ${currentCount + 1}x`;
	} else {
		const newPill = document.createElement('span');
		newPill.className = 'pill restore-count';
		newPill.textContent = 'Restored 1x';
		pillsContainer.appendChild(newPill);
	}
}

/**
 * @param {HTMLElement} deleteBtn - The delete button element
 */
function removeBackupCard(deleteBtn) {
	const card = deleteBtn.closest('.backup-card');
	card.remove();
}

/**
 * @param {string} fullBackupName - Full backup folder name
 * @param {string} backupName - Display name for the backup
 * @param {string} slot - Save slot number
 */
function addNewBackupCard(fullBackupName, backupName, slot) {
	const backupsList = document.getElementById('backupsList');
	const noBackupsDiv = backupsList.querySelector('.no-backups');
	if (noBackupsDiv) {
		noBackupsDiv.remove();
	}

	const displayName = backupName;
	const timestamp = fullBackupName.split('_')[0];
	const formattedTimestamp = formatTimestamp(timestamp);

	const newCard = document.createElement('div');
	newCard.className = 'backup-card';
	newCard.innerHTML = `
		<div class="backup-info">
			<div class="backup-name">${displayName}</div>
			<div class="backup-bottom">
				<div class="backup-pills">
					<span class="pill timestamp">${formattedTimestamp}</span>
					<span class="pill slot">Slot ${slot}</span>
				</div>
				<div class="backup-actions">
					<button class="restore-btn" data-backup-name="${fullBackupName}" data-slot="${slot}">
						Restore
					</button>
					<button class="delete-btn" data-backup-name="${fullBackupName}">
						Delete
					</button>
				</div>
			</div>
		</div>
	`;

	backupsList.insertBefore(newCard, backupsList.firstChild);
	addBackupButtonListeners();
}

function addBackupButtonListeners() {
	const backupsList = document.getElementById('backupsList');
	backupsList.removeEventListener('click', handleBackupButtonClick);
	backupsList.addEventListener('click', handleBackupButtonClick);
}