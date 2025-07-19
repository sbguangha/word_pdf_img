const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Next.js...');

const nextPath = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');
const child = spawn('node', [nextPath, 'dev'], {
  stdio: 'inherit',
  cwd: __dirname
});

child.on('error', (error) => {
  console.error('Error starting Next.js:', error);
});

child.on('exit', (code) => {
  console.log(`Next.js exited with code ${code}`);
});
