/**
 * Custom modal dialog system to replace native browser dialogs
 * Works on all browsers including Steam browser
 */

/**
 * Show a custom confirmation dialog
 * @param {string} message - The confirmation message to display
 * @param {object} options - Optional settings for the dialog
 * @param {string} options.titleText - Title text for the modal
 * @param {string} options.confirmButtonText - Text for the confirm button
 * @param {string} options.confirmButtonClass - CSS class for the confirm button
 * @returns {Promise<boolean>} - Promise that resolves to true if confirmed, false if cancelled
 */
function showConfirm(message, options = {}) {
	return new Promise((resolve) => {
		const modal = document.getElementById('customModal');
		const title = document.getElementById('modalTitle');
		const body = document.getElementById('modalBody');
		const confirmBtn = document.getElementById('modalConfirm');
		const cancelBtn = document.getElementById('modalCancel');
		const inputField = document.getElementById('modalInput');

		const {
			titleText = 'Confirm Action',
			confirmButtonText = 'Confirm',
			confirmButtonClass = 'modal-btn-confirm',
		} = options;
		title.textContent = titleText;
		body.textContent = message;
		inputField.style.display = 'none';
		confirmBtn.textContent = confirmButtonText;
		confirmBtn.className = `modal-btn ${confirmButtonClass}`;
		cancelBtn.style.display = 'inline-block';

		modal.classList.add('modal-active');

		const handleConfirm = () => {
			cleanup();
			resolve(true);
		};

		const handleCancel = () => {
			cleanup();
			resolve(false);
		};

		const handleEscape = (e) => {
			if (e.key === 'Escape') {
				handleCancel();
			}
		};

		const cleanup = () => {
			modal.classList.remove('modal-active');
			confirmBtn.removeEventListener('click', handleConfirm);
			cancelBtn.removeEventListener('click', handleCancel);
			document.removeEventListener('keydown', handleEscape);
		};

		confirmBtn.addEventListener('click', handleConfirm);
		cancelBtn.addEventListener('click', handleCancel);
		document.addEventListener('keydown', handleEscape);

		setTimeout(() => confirmBtn.focus(), 100);
	});
}

/**
 * Show a custom prompt dialog
 * @param {string} message - The prompt message to display
 * @param {object} options - Optional settings for the dialog
 * @param {string} options.titleText - Title text for the modal
 * @param {string} options.confirmButtonText - Text for the confirm button
 * @param {string} options.confirmButtonClass - CSS class for the confirm button
 * @param {string} options.initialValue - Initial value for the input field
 * @returns {Promise<string|null>} - Promise that resolves to the input value or null if cancelled
 */
function showPrompt(message, options = {}) {
	return new Promise((resolve) => {
		const modal = document.getElementById('customModal');
		const title = document.getElementById('modalTitle');
		const body = document.getElementById('modalBody');
		const confirmBtn = document.getElementById('modalConfirm');
		const cancelBtn = document.getElementById('modalCancel');
		const inputField = document.getElementById('modalInput');

		const {
			titleText = 'Enter Value',
			confirmButtonText = 'OK',
			confirmButtonClass = 'modal-btn-primary',
			initialValue = '',
		} = options;
		title.textContent = titleText;
		body.textContent = message;
		inputField.style.display = 'block';
		inputField.value = initialValue;
		confirmBtn.textContent = confirmButtonText;
		confirmBtn.className = `modal-btn ${confirmButtonClass}`;
		cancelBtn.style.display = 'inline-block';

		modal.classList.add('modal-active');

		const handleConfirm = () => {
			const value = inputField.value.trim();
			cleanup();
			resolve(value || null);
		};

		const handleCancel = () => {
			cleanup();
			resolve(null);
		};

		const handleEscape = (e) => {
			if (e.key === 'Escape') {
				handleCancel();
			} else if (e.key === 'Enter') {
				handleConfirm();
			}
		};

		const cleanup = () => {
			modal.classList.remove('modal-active');
			inputField.value = '';
			confirmBtn.removeEventListener('click', handleConfirm);
			cancelBtn.removeEventListener('click', handleCancel);
			document.removeEventListener('keydown', handleEscape);
		};

		confirmBtn.addEventListener('click', handleConfirm);
		cancelBtn.addEventListener('click', handleCancel);
		document.addEventListener('keydown', handleEscape);

		setTimeout(() => {
			inputField.focus();
			inputField.select();
		}, 100);
	});
}

/**
 * Show a custom alert dialog
 * @param {string} message - The alert message to display
 * @param {object} options - Optional settings for the dialog
 * @param {string} options.titleText - Title text for the modal
 * @param {string} options.confirmButtonText - Text for the confirm button
 * @param {string} options.confirmButtonClass - CSS class for the confirm button
 * @returns {Promise<void>} - Promise that resolves when the alert is dismissed
 */
function showAlert(message, options = {}) {
	return new Promise((resolve) => {
		const modal = document.getElementById('customModal');
		const title = document.getElementById('modalTitle');
		const body = document.getElementById('modalBody');
		const confirmBtn = document.getElementById('modalConfirm');
		const cancelBtn = document.getElementById('modalCancel');
		const inputField = document.getElementById('modalInput');

		const { titleText = 'Alert', confirmButtonText = 'OK', confirmButtonClass = 'modal-btn-primary' } = options;
		title.textContent = titleText;
		body.textContent = message;
		inputField.style.display = 'none';
		confirmBtn.textContent = confirmButtonText;
		confirmBtn.className = `modal-btn ${confirmButtonClass}`;
		cancelBtn.style.display = 'none';

		modal.classList.add('modal-active');

		const handleConfirm = () => {
			cleanup();
			resolve();
		};

		const handleEscape = (e) => {
			if (e.key === 'Escape' || e.key === 'Enter') {
				handleConfirm();
			}
		};

		const cleanup = () => {
			modal.classList.remove('modal-active');
			confirmBtn.removeEventListener('click', handleConfirm);
			document.removeEventListener('keydown', handleEscape);
		};

		confirmBtn.addEventListener('click', handleConfirm);
		document.addEventListener('keydown', handleEscape);

		setTimeout(() => confirmBtn.focus(), 100);
	});
}
