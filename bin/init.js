#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const TARGET = process.argv[2] || '.';

function copy(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      if (entry === 'node_modules') continue;
      copy(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('');
console.log('  \x1b[36mAIXO Core — OpenCode Integration\x1b[0m');
console.log('');

const dest = path.resolve(TARGET);
fs.mkdirSync(dest, { recursive: true });

console.log('  \x1b[2mScaffolding in:\x1b[0m ' + dest);

copy(TEMPLATES_DIR, dest);

console.log('  \x1b[32m✓\x1b[0m Structure created');
console.log('  \x1b[2m  Installing OpenCode plugin...\x1b[0m');

try {
  execSync('npm install', { cwd: path.join(dest, '.opencode'), stdio: 'pipe' });
  console.log('  \x1b[32m✓\x1b[0m Dependencies installed');
} catch (e) {
  console.log('  \x1b[33m⚠\x1b[0m npm install failed — run `cd .opencode && npm install` manually');
}

console.log('');
console.log('  \x1b[1mReady!\x1b[0m');
console.log('  \x1b[2m  cd\x1b[0m ' + path.relative(process.cwd(), dest) || '.');
console.log('  \x1b[2m  opencode\x1b[0m');
console.log('  \x1b[2m  /aiox-init\x1b[0m');
console.log('');
