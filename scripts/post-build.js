const fs = require('fs');
const path = require('path');

// Move worker.js to _worker.js
if (fs.existsSync('.open-next/worker.js')) {
    fs.renameSync('.open-next/worker.js', '.open-next/_worker.js');
}

// Copy assets to root
const assetsDir = '.open-next/assets';
if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    files.forEach(file => {
        const srcPath = path.join(assetsDir, file);
        const destPath = path.join('.open-next', file);

        if (fs.statSync(srcPath).isDirectory()) {
            // Copy directory recursively
            fs.cpSync(srcPath, destPath, { recursive: true });
        } else {
            // Copy file
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

// Create _routes.json
const routesConfig = {
    version: 1,
    include: ['/*'],
    exclude: [
        '/_next/static/*',
        '/favicon.ico',
        '/robots.txt',
        '/sitemap.xml',
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

console.log('✅ Post-build processing complete!');