const fs = require('fs');
const path = require('path');

console.log('📦 Starting post-build processing...');

// List server-functions contents
const serverFunctionsPath = '.open-next/server-functions';
if (fs.existsSync(serverFunctionsPath)) {
  console.log('\n📂 Contents of server-functions:');
  const serverFiles = fs.readdirSync(serverFunctionsPath);
  serverFiles.forEach(file => {
    const fullPath = path.join(serverFunctionsPath, file);
    const stats = fs.statSync(fullPath);
    console.log(`  ${stats.isDirectory() ? '📂' : '📄'} ${file}`);
    
    if (stats.isDirectory()) {
      const subFiles = fs.readdirSync(fullPath);
      subFiles.forEach(subFile => {
        console.log(`    📄 ${subFile}`);
      });
    }
  });
}

// Create _worker.js that imports the actual worker
const workerContent = `
import server from './server-functions/default/index.mjs';

export default server;
`;

fs.writeFileSync('.open-next/_worker.js', workerContent.trim());
console.log('\n✓ Created _worker.js');

// Create _routes.json for proper routing
const routesConfig = {
  version: 1,
  include: ['/*'],
  exclude: []
};

fs.writeFileSync(
  '.open-next/_routes.json',
  JSON.stringify(routesConfig, null, 2)
);
console.log('✓ Created _routes.json');

console.log('\n✅ Post-build processing complete!');