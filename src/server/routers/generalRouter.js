const express = require('express');
const path = require('path');
const router = express.Router();

/**
 * @param {Object} config - Application configuration
 * @param {number} PORT - Server port number
 * @returns {Router} Express router with general routes
 */
function createGeneralRouter(config, PORT) {
	router.get('/', (req, res) => {
		res.sendFile(path.join(__dirname, '../../client', 'index.html'));
	});

	router.get('/config', (req, res) => {
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

	return router;
}

module.exports = createGeneralRouter;
