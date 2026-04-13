const fs = require('fs');
const path = require('path');

const SRC_DIR = './src';
const OUTPUT_FILE = './collab/MASTER_CONTEXT.txt';

function bundleFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      bundleFiles(filePath, fileList);
    } else {
      const content = fs.readFileSync(filePath, 'utf8');
      fileList.push(`--- FILE: ${filePath} ---\n${content}\n`);
    }
  });
  return fileList;
}

const allCode = bundleFiles(SRC_DIR).join('\n');
fs.writeFileSync(OUTPUT_FILE, allCode);
console.log('CONTEXT LOCKED: src/collab/MASTER_CONTEXT.txt updated.');
