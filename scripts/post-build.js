const fs = require('fs');
const path = require('path');

console.log('📦 Starting post-build processing...');

// List all files in server-functions
const serverFunctionsPath = '.open-next/server-functions';
if (fs.existsSync(serverFunctionsPath)) {
  console.log('\n📂 Contents of server-functions:');
  const serverFiles = fs.readdirSync(serverFunctionsPath);
  serverFiles.forEach(file => {
    const fullPath = path.join(serverFunctionsPath, file);
    const stats = fs.statSync(fullPath);
    console.log(`  ${stats.isDirectory() ? '📂' : '📄'} ${file}`);
    
    // If it's a directory, list its contents too
    if (stats.isDirectory()) {
      const subFiles = fs.readdirSync(fullPath);
      subFiles.forEach(subFile => {
        console.log(`    📄 ${subFile}`);
      });
    }
  });
}

// Check for .build directory
const buildPath = '.open-next/.build';
if (fs.existsSync(buildPath)) {
  console.log('\n📂 Contents of .build:');
  const buildFiles = fs.readdirSync(buildPath);
  buildFiles.forEach(file => {
    console.log(`  📄 ${file}`);
  });
}

console.log('\n✅ Post-build processing complete!');