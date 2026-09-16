const fs = require('fs');
const path = require('path');
const dir = 'routes';

function searchInDir(startPath) {
  const files = fs.readdirSync(startPath);
  for (let i = 0; i < files.length; i++) {
    const filename = path.join(startPath, files[i]);
    const stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      searchInDir(filename);
    } else if (filename.endsWith('.js')) {
      const content = fs.readFileSync(filename, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('u.dob') || line.includes('profiles p') || line.includes('is_deleted')) {
          console.log(`${filename}:${idx + 1}: ${line.trim()}`);
        }
      });
    }
  }
}
searchInDir(dir);
