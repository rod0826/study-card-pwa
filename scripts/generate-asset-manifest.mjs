import crypto from 'node:crypto';
import fs from 'node:fs';

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const files = new Set([
  'index.html', 'styles.css', 'app.js', 'manifest.webmanifest', 'favicon.ico',
  'assets/icon.svg', 'assets/icon-180.png', 'assets/icon-192.png', 'assets/icon-512.png',
  'assets/logo.svg', 'assets/og-image.svg', 'assets/og-image.png',
  'data/catalog/exams.json', 'data/catalog/subjects.json',
]);

for (const exam of read('data/catalog/exams.json')) {
  files.add(exam.indexFile);
  for (const entry of read(exam.indexFile).subjects) for (const file of entry.setFiles) files.add(file);
}

const sorted = [...files].sort();
for (const file of sorted) if (!fs.existsSync(file)) throw new Error(`missing cache asset: ${file}`);
const hash = crypto.createHash('sha256');
for (const file of sorted) hash.update(file).update(fs.readFileSync(file));
const version = hash.digest('hex').slice(0, 12);
const assets = ['./', './asset-manifest.js', ...sorted.map((file) => `./${file}`)];
const output = `self.JIANSTUDY_ASSET_MANIFEST = ${JSON.stringify({ version, assets }, null, 2)};\n`;

if (process.argv.includes('--check')) {
  if (!fs.existsSync('asset-manifest.js') || fs.readFileSync('asset-manifest.js', 'utf8') !== output) throw new Error('asset-manifest.js is out of date; run node scripts/generate-asset-manifest.mjs');
  console.log(`OK: cache manifest ${version}, ${assets.length} assets`);
} else {
  fs.writeFileSync('asset-manifest.js', output);
  console.log(`Wrote asset-manifest.js: ${version}, ${assets.length} assets`);
}
