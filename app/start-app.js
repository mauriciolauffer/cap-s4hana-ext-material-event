#!/usr/bin/env node

/**
 * Start script for the Business Partners Fiori Elements application
 * This script starts both the CAP backend and the UI5 frontend
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Business Partners Application...\n');

// Start the CAP backend server
console.log('📡 Starting CAP Backend Server...');
const backendProcess = spawn('cds', ['watch'], {
  cwd: path.join(__dirname, '../../'),
  stdio: 'pipe'
});

backendProcess.stdout.on('data', (data) => {
  process.stdout.write(`[Backend] ${data}`);
});

backendProcess.stderr.on('data', (data) => {
  process.stderr.write(`[Backend Error] ${data}`);
});

// Wait for backend to start, then start the UI
setTimeout(() => {
  console.log('\n🎨 Starting UI5 Frontend...');
  
  const frontendProcess = spawn('npm', ['start'], {
    cwd: path.join(__dirname, '../business-partners'),
    stdio: 'inherit'
  });
  
  frontendProcess.on('error', (error) => {
    console.error('Failed to start frontend:', error);
  });
  
}, 5000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  backendProcess.kill();
  process.exit(0);
});
