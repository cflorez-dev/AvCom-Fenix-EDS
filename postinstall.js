/* eslint-disable import/extensions */
const fs = require('fs');
const path = require('path');

const { dependencies } = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Define the dropins folder
const dropinsDir = path.join('scripts', '__dropins__');

// Remove existing dropins folder
if (fs.existsSync(dropinsDir)) {
  fs.rmSync(dropinsDir, { recursive: true });
}

// Create scripts/__dropins__ directory if not exists
fs.mkdirSync(dropinsDir, { recursive: true });

// Copy specified files from node_modules/@dropins to scripts/__dropins__
if (fs.existsSync('node_modules/@dropins')) {
  fs.readdirSync('node_modules/@dropins', { withFileTypes: true }).forEach((file) => {
    // Skip if package is not in package.json dependencies / skip devDependencies
    if (!dependencies[`@dropins/${file.name}`]) {
      return;
    }

    // Skip if is not folder
    if (!file.isDirectory()) {
      return;
    }

    console.log(`📦 Copying @dropins/${file.name} to scripts/__dropins__/`);

    fs.cpSync(
      path.join('node_modules', '@dropins', file.name),
      path.join(dropinsDir, file.name),
      {
        recursive: true,
        filter: (src) => !src.endsWith('package.json'),
      },
    );
  });
}

// Copy HTM library
console.log('📦 Copying htm library...');
const htmSrc = path.join('node_modules', 'htm', 'dist', 'htm.module.js');
const htmDest = path.join('scripts', 'htm.js');

if (fs.existsSync(htmSrc)) {
  fs.copyFileSync(htmSrc, htmDest);
  console.log('✅ HTM copied successfully!');
} else {
  console.warn('⚠️  HTM source not found, using existing htm.js');
}

// DOMPurify is now loaded from CDN with SRI in head.html/404.html.
// No longer vendored in the repo (closes scanner finding 117).

console.log('\n✅ Drop-ins vendorized successfully!');
console.log('📁 Location: scripts/__dropins__/\n');
