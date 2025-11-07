function initializeApp() {
	loadBackups();
	loadConfig();

	const backupForm = document.getElementById('backupForm');
	if (backupForm) {
		backupForm.addEventListener('submit', handleBackupFormSubmit);
	}
}

document.addEventListener('DOMContentLoaded', initializeApp);
