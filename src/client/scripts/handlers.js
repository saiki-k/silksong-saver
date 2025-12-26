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

	const confirmed = await showConfirm(confirmMessage, {
		titleText: 'Confirm Restore',
		confirmButtonText: 'Restore',
		confirmButtonClass: 'modal-btn-restore',
	});
	if (!confirmed) {
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
 * @param {string} backupSlot - Original save slot from which the backup was created
 * @param {Event} event - Click event
 */
async function handleReplaceBackup(fullBackupName, backupSlot, event) {
	const card = event.target.closest('.backup-card');
	const displayName = card.querySelector('.backup-name').textContent;

	// Generate options for slots 1-4, excluding the backup slot
	let optionsHTML = '';
	for (let slot = 1; slot <= 4; slot++) {
		if (slot.toString() !== backupSlot) {
			optionsHTML += `<option value="${slot}">Slot ${slot}</option>`;
		}
	}

	const contentHTML = `
			<p style="margin: -24px 0 0 0; font-size: 14px; color: #666;">This allows you to copy this backup to a different save slot, overwriting the files in that slot.</p>
			<label for="slotSelect" style="display: block; margin: 0; font-weight: bold;">Which save slot should be replaced with the <span style="color: #4caf50; font-weight: bold;">${displayName}</span> backup?</label>
			<select id="slotSelect" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;">
				${optionsHTML}
			</select>
	`;

	const targetSlot = await showRichPrompt('', contentHTML, {
		titleText: 'Replace Backup',
		confirmButtonText: 'Replace',
		confirmButtonClass: 'modal-btn-replace',
	});

	if (!targetSlot) {
		return;
	}

	const confirmMessage = `Are you sure you want to replace Slot ${targetSlot} with this backup?\n\nThis will overwrite your current Slot ${targetSlot} save files.\n\nYou must exit and restart the game for changes to take effect.`;

	const confirmed = await showConfirm(confirmMessage, {
		titleText: 'Confirm Replace',
		confirmButtonText: 'Replace',
		confirmButtonClass: 'modal-btn-replace',
	});
	if (!confirmed) {
		return;
	}

	const replaceBtn = event.target;
	const originalText = replaceBtn.textContent;
	replaceBtn.disabled = true;
	replaceBtn.textContent = 'Replacing...';

	try {
		const data = await replaceBackup(fullBackupName, backupSlot, targetSlot);
		showResult(data.message, 'success');
	} catch (error) {
		showResult(error.message, 'error');
	} finally {
		replaceBtn.disabled = false;
		replaceBtn.textContent = originalText;
	}
}

/**
 * @param {string} fullBackupName - Full backup folder name
 * @param {Event} event - Click event
 */
async function handleRenameBackup(fullBackupName, event) {
	const card = event.target.closest('.backup-card');
	const currentName = card.querySelector('.backup-name').textContent;

	const newName = await showPrompt('Edit the name of this backup', {
		titleText: 'Rename Backup',
		confirmButtonText: 'Rename',
		confirmButtonClass: 'modal-btn-rename',
		initialValue: currentName,
	});

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
		if (data.newFullBackupName) {
			const buttons = card.querySelectorAll('[data-backup-name]');
			buttons.forEach((btn) => btn.setAttribute('data-backup-name', data.newFullBackupName));
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

	const confirmed = await showConfirm(confirmMessage, {
		titleText: 'Confirm Delete',
		confirmButtonText: 'Delete',
		confirmButtonClass: 'modal-btn-delete',
	});
	if (!confirmed) {
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
	} else if (button.classList.contains('replace-btn')) {
		const fullBackupName = button.getAttribute('data-backup-name');
		const backupSlot = button.getAttribute('data-slot');
		handleReplaceBackup(fullBackupName, backupSlot, event);
	} else if (button.classList.contains('delete-btn')) {
		const fullBackupName = button.getAttribute('data-backup-name');
		handleDeleteBackup(fullBackupName, event);
	}
}
