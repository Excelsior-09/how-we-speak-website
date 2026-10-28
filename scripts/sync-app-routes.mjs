import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const appIndex = path.join(rootDir, 'app/index.html');

if (!fs.existsSync(appIndex)) {
  console.error('app/index.html does not exist. Run web-app build first.');
  process.exit(1);
}

const htmlContent = fs.readFileSync(appIndex, 'utf8');

// List of top-level and subfolder routes that must serve the SPA shell statically
const routesToSync = [
  path.join(rootDir, 'reset-password.html'),
  path.join(rootDir, 'recovery.html'),
  path.join(rootDir, 'password-reset.html'),
  path.join(rootDir, 'app/reset-password/index.html'),
  path.join(rootDir, 'app/recovery/index.html'),
  path.join(rootDir, 'app/settings/index.html'),
  path.join(rootDir, 'app/dashboard/index.html'),
];

for (const targetPath of routesToSync) {
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(targetPath, htmlContent, 'utf8');
  console.log(`Synced SPA shell to ${path.relative(rootDir, targetPath)}`);
}

console.log('All SPA routes synchronized successfully.');
