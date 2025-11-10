const fs = require('fs');
const path = require('path');

function loadEnvFile() {
	const envPath = path.join(process.cwd(), '.env');
	if (!fs.existsSync(envPath)) {
		console.warn('\n⚠️ .env file not found, skipping environment variable loading.\n');
		return;
	}

	const envContent = fs.readFileSync(envPath, 'utf8');
	envContent.split('\n').forEach((line) => {
		line = line.trim();
		if (line && !line.startsWith('#')) {
			const match = line.match(/^([^=]+)=(.*)$/);
			if (match) {
				const key = match[1].trim();
				let value = match[2].trim();
				if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
					value = value.slice(1, -1);
				}
				process.env[key] = value;
			}
		}
	});
}

module.exports = { loadEnvFile };
