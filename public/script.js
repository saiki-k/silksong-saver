// Load backups and config when page loads
document.addEventListener('DOMContentLoaded', () => {
	loadBackups();
	loadConfig();
});

document.getElementById('backupForm').addEventListener('submit', async (e) => {
	e.preventDefault();

	const backupName = document.getElementById('backupName').value.trim();
	const saveSlot = document.getElementById('saveSlot').value;

	if (!backupName) {
		showResult('Please enter a backup name.', 'error');
		return;
	}

	if (!saveSlot) {
		showResult('Please select a save slot.', 'error');
		return;
	}

	try {
		const response = await fetch('/create-backup', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ backupName, saveSlot }),
		});

		const data = await response.json();

		if (response.ok) {
			showResult(data.message, 'success');
			document.getElementById('backupName').value = '';
			// Refresh the backup list after creating a new backup
			loadBackups();
		} else {
			showResult(data.error || 'An error occurred', 'error');
		}
	} catch (error) {
		showResult('Network error: ' + error.message, 'error');
	}
});

async function loadBackups() {
	const backupsList = document.getElementById('backupsList');

	try {
		backupsList.innerHTML = '<div class="loading">Loading backups...</div>';

		const response = await fetch('/backups');
		const data = await response.json();

		if (response.ok) {
			displayBackups(data.backups);
		} else {
			backupsList.innerHTML = '<div class="error">Failed to load backups</div>';
		}
	} catch (error) {
		backupsList.innerHTML = '<div class="error">Network error loading backups</div>';
	}
}

async function loadConfig() {
	const configInfo = document.getElementById('configInfo');

	try {
		configInfo.innerHTML = '<div class="loading">Loading configuration...</div>';

		const response = await fetch('/config');
		const data = await response.json();

		if (response.ok) {
			displayConfig(data);
		} else {
			configInfo.innerHTML = '<div class="error">Failed to load configuration</div>';
		}
	} catch (error) {
		configInfo.innerHTML = '<div class="error">Network error loading configuration</div>';
	}
}

function displayConfig(config) {
	const configInfo = document.getElementById('configInfo');

	configInfo.innerHTML = `
		<div class="config-item">
			<span class="config-label">Source Folder</span>
			<span class="config-value">${config.sourceFolder}</span>
		</div>
		<div class="config-item">
			<span class="config-label">Backup Folder</span>
			<span class="config-value">${config.destinationFolder}</span>
		</div>
		<div class="config-item">
			<span class="config-label">Server Port</span>
			<span class="config-value">${config.port}</span>
		</div>
	`;
}

function displayBackups(backups) {
	const backupsList = document.getElementById('backupsList');

	if (backups.length === 0) {
		backupsList.innerHTML = '<div class="no-backups">No backups found. Create your first backup above!</div>';
		return;
	}

	backupsList.innerHTML = backups
		.map((backup) => {
			const displayName = formatBackupName(backup.name);
			const formattedTimestamp = formatTimestamp(backup.timestamp);

			return `
			<div class="backup-card">
				<div class="backup-info">
					<div class="backup-name">${displayName}</div>
					<div class="backup-bottom">
						<div class="backup-pills">
							<span class="pill timestamp">${formattedTimestamp}</span>
							<span class="pill slot">Slot ${backup.slot}</span>
						</div>
						<div class="backup-actions">
							<button class="restore-btn" onclick="restoreBackup('${backup.folderName}', '${backup.slot}', event)">
								Restore
							</button>
							<button class="delete-btn" onclick="deleteBackup('${backup.folderName}', event)">
								Delete
							</button>
						</div>
					</div>
				</div>
			</div>
		`;
		})
		.join('');
}

function formatBackupName(name) {
	return name
		.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}

function formatTimestamp(timestamp) {
	// Convert from 2024-11-04-14-30-15 format to readable format
	const parts = timestamp.split('-');
	if (parts.length === 6) {
		const [year, month, day, hour, minute, second] = parts;
		const date = new Date(year, month - 1, day, hour, minute, second);
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
	return timestamp;
}

async function restoreBackup(folderName, slot, event) {
	const confirmMessage = `Are you sure you want to restore this backup?\n\nThis will overwrite your current Slot ${slot} save files.`;

	if (!confirm(confirmMessage)) {
		return;
	}

	const restoreBtn = event.target;
	const originalText = restoreBtn.textContent;
	restoreBtn.disabled = true;
	restoreBtn.textContent = 'Restoring...';

	try {
		const response = await fetch('/restore-backup', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ folderName, saveSlot: slot }),
		});

		const data = await response.json();

		if (response.ok) {
			showResult(data.message, 'success');
		} else {
			showResult(data.error || 'Failed to restore backup', 'error');
		}
	} catch (error) {
		showResult('Network error: ' + error.message, 'error');
	} finally {
		restoreBtn.disabled = false;
		restoreBtn.textContent = originalText;
	}
}

async function deleteBackup(folderName, event) {
	const confirmMessage = `Are you sure you want to delete this backup?\n\nThis action cannot be undone.`;

	if (!confirm(confirmMessage)) {
		return;
	}

	const deleteBtn = event.target;
	const originalText = deleteBtn.textContent;
	deleteBtn.disabled = true;
	deleteBtn.textContent = 'Deleting...';

	try {
		const response = await fetch('/delete-backup', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ folderName }),
		});

		const data = await response.json();

		if (response.ok) {
			showResult(data.message, 'success');
			loadBackups(); // Refresh the backup list
		} else {
			showResult(data.error || 'Failed to delete backup', 'error');
		}
	} catch (error) {
		showResult('Network error: ' + error.message, 'error');
	} finally {
		deleteBtn.disabled = false;
		deleteBtn.textContent = originalText;
	}
}

function showResult(message, type) {
	const resultDiv = document.getElementById('result');
	resultDiv.textContent = message;
	resultDiv.className = `result ${type}`;
	resultDiv.style.display = 'block';

	if (type === 'success') {
		setTimeout(() => {
			resultDiv.style.display = 'none';
		}, 5000);
	}
}
