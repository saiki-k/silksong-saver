const shutDown = (options = {}) => {
	const { hasError = false } = options;
	const exitCode = hasError ? 1 : 0;

	console.log('\n🛑 Shutting down server...');
	console.log('\nPress Enter to exit...');
	process.stdin.once('data', () => {
		process.exit(exitCode);
	});
};

module.exports = { shutDown };
