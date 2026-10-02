const { spawn } = require('child_process');
const path = require('path');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const rootDir = path.resolve(__dirname, '..');

console.log('\n==================================================');
console.log('🚀 Starting Lab Aggregator (Backend & Frontend)...');
console.log('==================================================\n');

const server = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(rootDir, 'server'),
  stdio: 'inherit',
  shell: true
});

const client = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(rootDir, 'client'),
  stdio: 'inherit',
  shell: true
});

function cleanup() {
  console.log('\n🛑 Shutting down dev servers...');
  try {
    if (isWin) {
      if (server.pid) spawn('taskkill', ['/pid', server.pid, '/f', '/t']);
      if (client.pid) spawn('taskkill', ['/pid', client.pid, '/f', '/t']);
    } else {
      server.kill();
      client.kill();
    }
  } catch (e) {
    // Ignore cleanup errors
  }
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

server.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`Server process exited with code ${code}`);
  }
});

client.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`Client process exited with code ${code}`);
  }
});
