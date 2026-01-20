const fs = require('fs');
const path = require('path');

console.log('📦 Starting post-build processing...');

// Check if _worker.js exists, if not try worker.js
const workerSource = fs.existsSync('.open-next/_worker.js') 
  ? '.open-next/_worker.js' 
  : '.open-next/worker.js';

if (fs.existsSync(workerSource)) {
  console.log(`✓ Found worker at ${workerSource}`);
  
  // Ensure it's named _worker.js
  if (workerSource === '.open-next/worker.js') {
    fs.renameSync('.open-next/worker.js', '.open-next/_worker.js');
    console.log('✓ Renamed worker.js to _worker.js');
  }
} else {
  console.error('✗ No worker file found!');
}

// Create _routes.json for proper routing
const routesConfig = {
  version: 1,
  include: ['/*'],
  exclude: [
    '/favicon.ico',
    '/robots.txt',
    '/*.png',
    '/*.jpg',
    '/*.jpeg',
    '/*.gif',
    '/*.svg',
    '/*.ico',
    '/*.webp'
  ]
};

fs.writeFileSync(
  '.open-next/_routes.json',
  JSON.stringify(routesConfig, null, 2)
);
console.log('✓ Created _routes.json');

// List the contents of .open-next for debugging
console.log('\n📁 Contents of .open-next:');
const files = fs.readdirSync('.open-next');
files.forEach(file => {
  const stats = fs.statSync(path.join('.open-next', file));
  console.log(`  ${stats.isDirectory() ? '📂' : '📄'} ${file}`);
});

console.log('\n✅ Post-build processing complete!');