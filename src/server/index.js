const express = require('express');
const path = require('path');

const MetaService = require('./services/metaService');
const BackupOpsService = require('./services/backupOpsService');
const createBackupRouter = require('./routers/backupOpsRouter');
const createGeneralRouter = require('./routers/generalRouter');
const { errorHandler } = require('./middleware/middleware');

let config;
try {
	config = require('../config').default;
} catch (error) {
	console.error('Error loading config.json:', error.message);
	process.exit(1);
}

const PORT = config.port || 3000;
const app = express();

const metaService = new MetaService(config);
const backupOpsService = new BackupOpsService(config, metaService);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));
app.use('/', createGeneralRouter(config, PORT));
app.use('/', createBackupRouter(backupOpsService));
app.use(errorHandler);

async function startServer() {
	try {
		await metaService.initializeMeta();

		app.listen(PORT, () => {
			console.log('🚀 Silksong Saver');
			console.log(`📁 Source folder: ${config.sourceFolder}`);
			console.log(`📁 Backup folder: ${config.backupFolder}`);
			console.log(`🌐 Server running at http://localhost:${PORT}`);
		});
	} catch (error) {
		console.error('Failed to start server:', error);
		process.exit(1);
	}
}

const shutDown = () => {
	console.log('\n🛑 Shutting down server...');
	process.exit(0);
};

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);

startServer();
