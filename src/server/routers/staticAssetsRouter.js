const express = require('express');
const path = require('path');
const sea = require('node:sea');

function createStaticAssetsRouter() {
	const router = express.Router();

	if (sea.isSea()) {
		router.get('/', (req, res) => {
			res.set('Content-Type', 'text/html');
			const asset = sea.getAsset('client/index.html');
			res.send(Buffer.from(asset));
		});

		router.get('/style.css', (req, res) => {
			res.set('Content-Type', 'text/css');
			const asset = sea.getAsset('client/style.css');
			res.send(Buffer.from(asset));
		});

		router.get('/scripts/:file', (req, res) => {
			res.set('Content-Type', 'application/javascript');
			const asset = sea.getAsset(`client/scripts/${req.params.file}`);
			res.send(Buffer.from(asset));
		});

		router.get('/assets/:file', (req, res) => {
			res.set('Content-Type', 'image/png');
			const asset = sea.getAsset(`client/assets/${req.params.file}`);
			res.send(Buffer.from(asset));
		});
	} else {
		router.get('/', (req, res) => {
			res.sendFile(path.join(__dirname, '../../client/index.html'));
		});
		router.use(express.static(path.join(__dirname, '../../client')));
	}

	return router;
}

module.exports = createStaticAssetsRouter;
