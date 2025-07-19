const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Next.js development server...');
console.log('Working directory:', process.cwd());
console.log('Node version:', process.version);

// 尝试启动Next.js
const nextBin = path.join(__dirname, 'node_modules', '.bin', 'next');
const args = ['dev', '--port', '3000'];

console.log('Executing:', nextBin, args.join(' '));

const child = spawn('node', [path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next'), ...args], {
  stdio: 'inherit',
  cwd: __dirname,
  env: { ...process.env, NODE_ENV: 'development' }
});

child.on('error', (error) => {
  console.error('Error starting Next.js:', error);
});

child.on('exit', (code, signal) => {
  console.log(`Next.js process exited with code ${code} and signal ${signal}`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('Shutting down...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  child.kill('SIGTERM');
});
