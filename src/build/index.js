const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const pngToIco = require('png-to-ico');
const ResEdit = require('resedit');
const AdmZip = require('adm-zip');
const { version } = require('../../package.json');

async function build() {
	console.log('Building single executable application...\n');

	const buildDir = path.join(__dirname, '..', '..', 'dist');
	fs.mkdirSync(buildDir, { recursive: true });

	const outputExePath = path.join(buildDir, 'silksong-saver.exe');
	const blobFilePath = path.join(buildDir, 'sea-prep.blob');
	const bundledPath = path.join(buildDir, 'bundled.js');
	const seaConfigPath = path.join(buildDir, 'sea-config.json');

	console.log('\n1. Bundling application with dependencies using ncc...');
	execSync(`npx ncc build src/server/index.js -o dist/ncc-output`, { stdio: 'inherit' });

	fs.copyFileSync(path.join(buildDir, 'ncc-output', 'index.js'), bundledPath);

	const seaConfig = {
		main: bundledPath,
		output: blobFilePath,
		disableExperimentalSEAWarning: true,
		assets: {
			'client/index.html': 'src/client/index.html',
			'client/style.css': 'src/client/style.css',
			'client/scripts/utils.js': 'src/client/scripts/utils.js',
			'client/scripts/modal.js': 'src/client/scripts/modal.js',
			'client/scripts/handlers.js': 'src/client/scripts/handlers.js',
			'client/scripts/dom.js': 'src/client/scripts/dom.js',
			'client/scripts/api.js': 'src/client/scripts/api.js',
			'client/scripts/main.js': 'src/client/scripts/main.js',
			'client/assets/garmond.png': 'src/client/assets/garmond.png',
			'client/assets/garmond_and_zaza.png': 'src/client/assets/garmond_and_zaza.png',
		},
	};
	fs.writeFileSync(seaConfigPath, JSON.stringify(seaConfig, null, '\t'));

	console.log('\n2. Generating SEA blob...');
	execSync(`node --experimental-sea-config "${seaConfigPath}"`, { stdio: 'inherit' });

	console.log('\n3. Copying Node.js executable...');
	fs.copyFileSync(process.execPath, outputExePath);

	console.log('\n4. Injecting application code...');
	execSync(
		`npx postject "${outputExePath}" NODE_SEA_BLOB "${blobFilePath}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`,
		{ stdio: 'inherit' }
	);

	console.log('\n5. Setting executable icon and metadata...');
	const pngPath = path.join(__dirname, '..', 'client', 'assets', 'garmond.png');
	const iconPath = path.join(buildDir, 'icon.ico');

	if (fs.existsSync(pngPath)) {
		try {
			const icoBuffer = await pngToIco(pngPath);
			fs.writeFileSync(iconPath, icoBuffer);
			console.log('✓ Converted PNG to ICO');

			// Set icon and metadata using resedit
			console.log('⏳ Setting icon and metadata...');

			// Read the executable (allow unsigned/modified executables)
			const exeData = fs.readFileSync(outputExePath);
			const exe = ResEdit.NtExecutable.from(exeData, { ignoreCert: true });
			const res = ResEdit.NtExecutableResource.from(exe);
			const iconFile = ResEdit.Data.IconFile.from(fs.readFileSync(iconPath));
			ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
				res.entries,
				1, // Icon ID
				1033, // Language (English US)
				iconFile.icons.map((icon) => icon.data)
			);

			// Set version info
			const viList = ResEdit.Resource.VersionInfo.fromEntries(res.entries);
			const vi = viList[0] || ResEdit.Resource.VersionInfo.createEmpty();

			const versionParts = version.split('.').map(Number);

			vi.setStringValues(
				{ lang: 1033, codepage: 1200 },
				{
					ProductName: 'Silksong Saver',
					FileDescription: 'Hollow Knight: Silksong Save Backup Manager',
					CompanyName: 'Sai Kishore Komanduri',
					LegalCopyright: 'MIT License',
					OriginalFilename: 'silksong-saver.exe',
					FileVersion: `${version}.0`,
					ProductVersion: `${version}.0`,
				}
			);

			vi.removeStringValue({ lang: 1033, codepage: 1200 }, 'PrivateBuild');
			vi.removeStringValue({ lang: 1033, codepage: 1200 }, 'SpecialBuild');
			vi.setFileVersion(versionParts[0] || 1, versionParts[1] || 0, versionParts[2] || 0, 0, 1033);
			vi.setProductVersion(versionParts[0] || 1, versionParts[1] || 0, versionParts[2] || 0, 0, 1033);
			vi.outputToResourceEntries(res.entries);

			res.outputResource(exe);
			const newExe = Buffer.from(exe.generate());
			fs.writeFileSync(outputExePath, newExe);

			console.log('✓ Icon and metadata set successfully');
		} catch (err) {
			console.warn('⚠  Failed to set icon:', err.message);
			console.warn('Continuing without icon...');
		}
	} else {
		console.warn('⚠  garmond.png not found, skipping icon setup');
	}

	console.log('\n6. Creating distribution package (zip archive)...');

	let osSuffix;
	if (process.platform === 'win32') {
		osSuffix = 'windows';
	} else if (process.platform === 'darwin') {
		const arch = process.arch === 'arm64' ? 'apple-silicon' : 'intel';
		osSuffix = `macos-${arch}`;
	} else {
		osSuffix = 'linux';
	}

	const extension = process.platform === 'win32' ? '.exe' : '';
	const distDirName = `silksong-saver-${osSuffix}`;
	const distDir = path.join(buildDir, distDirName);
	fs.mkdirSync(distDir, { recursive: true });

	const distExePath = path.join(distDir, `silksong-saver${extension}`);
	fs.copyFileSync(outputExePath, distExePath);

	const envExamplePath = path.join(__dirname, '../../', '.env.example');
	const distConfigPath = path.join(distDir, 'config');
	fs.copyFileSync(envExamplePath, distConfigPath);

	const zip = new AdmZip();
	zip.addLocalFolder(distDir);
	const zipPath = path.join(buildDir, `${distDirName}-v${version}.zip`);
	zip.writeZip(zipPath);

	console.log('\n7. Cleaning up temporary files...');
	fs.existsSync(seaConfigPath) && fs.unlinkSync(seaConfigPath);
	fs.existsSync(blobFilePath) && fs.unlinkSync(blobFilePath);
	fs.existsSync(bundledPath) && fs.unlinkSync(bundledPath);
	fs.rmSync(path.join(buildDir, 'ncc-output'), { recursive: true, force: true });
	fs.existsSync(outputExePath) && fs.unlinkSync(outputExePath);
	fs.existsSync(iconPath) && fs.unlinkSync(iconPath);

	console.log(`\n✅ Build complete!`);
	console.log(`Executable: ${path.relative(process.cwd(), distExePath)}`);
	console.log(`Package: ${path.relative(process.cwd(), zipPath)}`);
}

build().catch((err) => {
	console.error('Build failed:', err);
	process.exit(1);
});
