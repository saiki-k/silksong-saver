/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Next middleware function
 */
function requestLogger(req, res, next) {
	const timestamp = new Date().toISOString();
	console.log(`[${timestamp}] ${req.method} ${req.path}`);
	next();
}

/**
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Next middleware function
 */
function errorHandler(err, req, res, next) {
	console.error('Error:', err);

	// Default error response
	const status = err.status || 500;
	const message = err.message || 'Internal Server Error';

	res.status(status).json({
		error: message,
		...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
	});
}

module.exports = {
	requestLogger,
	errorHandler,
};
