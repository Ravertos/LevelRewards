
const fs = require('fs');
const path = './memory.json';

function loadMemory() {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, '{}');
  }
  return JSON.parse(fs.readFileSync(path));
}

function saveMemory(memory) {
  fs.writeFileSync(path, JSON.stringify(memory, null, 2));
}

function remember(playerName, key, value) {
  const memory = loadMemory();
  if (!memory[playerName]) memory[playerName] = {};
  memory[playerName][key] = value;
  saveMemory(memory);
}

function recall(playerName, key) {
  const memory = loadMemory();
  return memory[playerName]?.[key];
}

function getAllMemories(playerName) {
  const memory = loadMemory();
  return memory[playerName] || {};
}

function forgetPlayer(playerName) {
  const memory = loadMemory();
  if (memory[playerName]) {
    delete memory[playerName];
    saveMemory(memory);
    return true;
  }
  return false;
}

function getMemoryStats() {
  const memory = loadMemory();
  const playerCount = Object.keys(memory).length;
  let totalEntries = 0;
  
  for (const player in memory) {
    totalEntries += Object.keys(memory[player]).length;
  }
  
  return { playerCount, totalEntries };
}

module.exports = { 
  remember, 
  recall, 
  loadMemory, 
  saveMemory, 
  getAllMemories, 
  forgetPlayer, 
  getMemoryStats 
};
