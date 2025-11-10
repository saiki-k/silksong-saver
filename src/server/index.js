const express = require('express');
const { shutDown } = require('./utils/shutdown');

const MetaService = require('./services/metaService');
const BackupOpsService = require('./services/backupOpsService');
const createBackupOpsRouter = require('./routers/backupOpsRouter');
const createStaticAssetsRouter = require('./routers/staticAssetsRouter');
const { errorHandler } = require('./middleware/middleware');

async function startServer() {
	let config;
	try {
		config = require('../config').default;
	} catch (error) {
		console.error('Failed to start server!');
		console.error('Error loading config.json:', error.message);
		shutDown({ hasError: true });
		return;
	}

	const app = express();

	const metaService = new MetaService(config);
	const backupOpsService = new BackupOpsService(config, metaService);

	app.use(express.json());

	app.use('/', createBackupOpsRouter({ backupOpsService, config }));
	app.use('/', createStaticAssetsRouter());

	app.use(errorHandler);

	try {
		await metaService.initializeMeta();

		app.listen(config.port, () => {
			console.log('🚀 Silksong Saver');
			console.log(`📁 Source folder: ${config.sourceFolder}`);
			console.log(`📁 Backup folder: ${config.backupFolder}`);
			console.log(`🌐 Server running at http://localhost:${config.port}`);
		});
	} catch (error) {
		console.error('Failed to start the server:', error);
		shutDown({ hasError: true });
	}
}

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);

startServer();
