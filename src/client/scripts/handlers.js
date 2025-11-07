/**
 * @param {Event} event - Form submit event
 */
async function handleBackupFormSubmit(event) {
	event.preventDefault();

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
		const data = await createBackup(backupName, saveSlot);
		showResult(data.message, 'success');
		document.getElementById('backupName').value = '';
		addNewBackupCard(data.backupCreated, data.originalName, saveSlot);
	} catch (error) {
		showResult(error.message, 'error');
	}
}

/**
 * @param {string} fullBackupName - Full backup folder name
 * @param {string} slot - Save slot to restore to
 * @param {Event} event - Click event
 */
async function handleRestoreBackup(fullBackupName, slot, event) {
	const confirmMessage = `Are you sure you want to restore this backup?\n\nThis will overwrite your current Slot ${slot} save files.\n\nYou must exit and restart the game for changes to take effect.`;

	if (!confirm(confirmMessage)) {
		return;
	}

	const restoreBtn = event.target;
	const originalText = restoreBtn.textContent;
	restoreBtn.disabled = true;
	restoreBtn.textContent = 'Restoring...';

	try {
		const data = await restoreBackup(fullBackupName, slot);
		showResult(data.message, 'success');
		updateRestoreCount(restoreBtn);
	} catch (error) {
		showResult(error.message, 'error');
	} finally {
		restoreBtn.disabled = false;
		restoreBtn.textContent = originalText;
	}
}

/**
 * @param {string} fullBackupName - Full backup folder name
 * @param {Event} event - Click event
 */
async function handleRenameBackup(fullBackupName, event) {
	const newName = prompt('Enter a new name for this backup');

	if (!newName || !newName.trim()) {
		return;
	}

	const renameBtn = event.target;
	const originalText = renameBtn.textContent;
	renameBtn.disabled = true;
	renameBtn.textContent = 'Renaming...';

	try {
		const data = await renameBackup(fullBackupName, newName.trim());
		showResult(data.message, 'success');

		// Update the display name in the card
		const card = renameBtn.closest('.backup-card');
		const nameElement = card.querySelector('.backup-name');
		nameElement.textContent = newName.trim();

		// Update data attributes if folder name changed
		if (data.newFolderName) {
			const buttons = card.querySelectorAll('[data-backup-name]');
			buttons.forEach((btn) => btn.setAttribute('data-backup-name', data.newFolderName));
		}
	} catch (error) {
		showResult(error.message, 'error');
	} finally {
		renameBtn.disabled = false;
		renameBtn.textContent = originalText;
	}
}

/**
 * @param {string} fullBackupName - Full backup folder name
 * @param {Event} event - Click event
 */
async function handleDeleteBackup(fullBackupName, event) {
	const confirmMessage = `Are you sure you want to delete this backup?\n\nThis action cannot be undone.`;

	if (!confirm(confirmMessage)) {
		return;
	}

	const deleteBtn = event.target;
	const originalText = deleteBtn.textContent;
	deleteBtn.disabled = true;
	deleteBtn.textContent = 'Deleting...';

	try {
		const data = await deleteBackup(fullBackupName);
		showResult(data.message, 'success');
		removeBackupCard(deleteBtn);
	} catch (error) {
		showResult(error.message, 'error');
	} finally {
		deleteBtn.disabled = false;
		deleteBtn.textContent = originalText;
	}
}

/**
 * @param {Event} event - Click event
 */
function handleBackupButtonClick(event) {
	const button = event.target;

	if (button.classList.contains('rename-btn')) {
		const fullBackupName = button.getAttribute('data-backup-name');
		handleRenameBackup(fullBackupName, event);
	} else if (button.classList.contains('restore-btn')) {
		const fullBackupName = button.getAttribute('data-backup-name');
		const slot = button.getAttribute('data-slot');
		handleRestoreBackup(fullBackupName, slot, event);
	} else if (button.classList.contains('delete-btn')) {
		const fullBackupName = button.getAttribute('data-backup-name');
		handleDeleteBackup(fullBackupName, event);
	}
}
