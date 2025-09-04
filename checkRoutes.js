const fs = require('fs');
const path = require('path');

const folderPath = path.join(__dirname); // adjust if needed
const fileExtensions = ['.js', '.ts'];

function scanFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            scanFiles(fullPath);
        } else if (fileExtensions.includes(path.extname(file))) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const regex = /(app\.use|router\.use|router\.(get|post|put|delete|patch))\s*\(\s*['"`](http|https):\/\//g;
            const matches = [...content.matchAll(regex)];
            if (matches.length > 0) {
                console.log(`Found in ${fullPath}:`);
                matches.forEach(m => console.log('  ', m[0]));
            }
        }
    }
}

scanFiles(folderPath);
console.log("Scan complete.");
