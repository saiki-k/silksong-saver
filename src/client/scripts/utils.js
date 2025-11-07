/**
 * Formats a backup name by capitalizing each word
 * @param {string} name - The backup name to format
 * @returns {string} Formatted backup name
 */
function formatBackupName(name) {
	return name
		.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}

/**
 * @param {string} timestamp - Timestamp in 2024-11-04-14-30-15 format
 * @returns {string} Human-readable timestamp
 */
function formatTimestamp(timestamp) {
	const parts = timestamp.split('-');
	if (parts.length === 6) {
		const [year, month, day, hour, minute, second] = parts;
		const date = new Date(year, month - 1, day, hour, minute, second);
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
	return timestamp;
}

/**
 * @param {string} message - The message to display
 * @param {string} type - The type of message ('success' or 'error')
 */
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
