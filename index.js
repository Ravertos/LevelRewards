
// Root index.js - Properly starts the Smart Bot System
import { spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting LevelRewards Smart Bot System...');
console.log('📂 Navigating to smart-bot directory...');

// Change to smart-bot directory and start the bot
const smartBotPath = join(__dirname, 'smart-bot');
console.log(`📁 Smart Bot Path: ${smartBotPath}`);

// Start the Smart Bot
const smartBot = spawn('node', ['index.js'], {
  cwd: smartBotPath,
  stdio: 'inherit'
});

smartBot.on('error', (error) => {
  console.error('❌ Error starting Smart Bot:', error);
});

smartBot.on('close', (code) => {
  console.log(`🛑 Smart Bot exited with code ${code}`);
});

console.log('✅ Smart Bot System started successfully!');
