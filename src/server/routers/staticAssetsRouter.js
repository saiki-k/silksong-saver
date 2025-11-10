const express = require('express');
const path = require('path');

let isSEA = false;
let getAsset = null;

try {
	const { isSea } = require('node:sea');
	isSEA = isSea();
	getAsset = sea.getAsset;
} catch {}

function createStaticAssetsRouter() {
	const router = express.Router();

	if (isSEA) {
		router.get('/', (req, res) => {
			res.set('Content-Type', 'text/html');
			res.send(getAsset('client/index.html'));
		});

		router.get('/style.css', (req, res) => {
			res.set('Content-Type', 'text/css');
			res.send(getAsset('client/style.css'));
		});

		router.get('/scripts/:file', (req, res) => {
			res.set('Content-Type', 'application/javascript');
			res.send(getAsset(`client/scripts/${req.params.file}`));
		});

		router.get('/assets/:file', (req, res) => {
			const buffer = getAsset(`client/assets/${req.params.file}`);
			res.set('Content-Type', 'image/png');
			res.send(buffer);
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
