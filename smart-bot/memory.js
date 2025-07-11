
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
  if (!memory[playerName]) {
    memory[playerName] = {
      created: new Date().toISOString(),
      interactions: 0,
      personality_traits: {},
      preferences: {}
    };
  }
  
  memory[playerName][key] = value;
  memory[playerName].last_updated = new Date().toISOString();
  memory[playerName].interactions = (memory[playerName].interactions || 0) + 1;
  
  saveMemory(memory);
}

function learnFromInteraction(playerName, question, response, wasHelpful = true) {
  const memory = loadMemory();
  if (!memory[playerName]) memory[playerName] = {};
  
  // Lerne Kommunikationsmuster
  if (!memory[playerName].communication_patterns) {
    memory[playerName].communication_patterns = {
      preferred_tone: 'friendly',
      question_types: [],
      response_preferences: []
    };
  }
  
  // Analysiere Fragetypen
  const questionType = analyzeQuestionType(question);
  memory[playerName].communication_patterns.question_types.push(questionType);
  
  // Merke erfolgreiche Antwortmuster
  if (wasHelpful) {
    memory[playerName].communication_patterns.response_preferences.push({
      question_theme: questionType,
      successful_response_pattern: response.substring(0, 100),
      timestamp: new Date().toISOString()
    });
  }
  
  saveMemory(memory);
}

function analyzeQuestionType(question) {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('level') || lowerQuestion.includes('belohnung')) return 'rewards';
  if (lowerQuestion.includes('server') || lowerQuestion.includes('lag')) return 'server_tech';
  if (lowerQuestion.includes('dino') || lowerQuestion.includes('ark')) return 'gameplay';
  if (lowerQuestion.includes('command') || lowerQuestion.includes('bot')) return 'bot_usage';
  if (lowerQuestion.includes('hilfe') || lowerQuestion.includes('help')) return 'help_request';
  
  return 'general';
}

function getUserPersonality(playerName) {
  const memory = loadMemory();
  const userData = memory[playerName];
  
  if (!userData) return { type: 'new_user', traits: [] };
  
  const interactions = userData.interactions || 0;
  const patterns = userData.communication_patterns || {};
  
  // Bestimme Persönlichkeitstyp basierend auf Interaktionen
  let personalityType = 'casual';
  let traits = [];
  
  if (interactions > 10) {
    if (patterns.question_types?.filter(q => q === 'server_tech').length > 3) {
      personalityType = 'tech_savvy';
      traits.push('technical', 'detailed');
    } else if (patterns.question_types?.filter(q => q === 'gameplay').length > 3) {
      personalityType = 'gamer';
      traits.push('enthusiastic', 'game_focused');
    }
  }
  
  return { type: personalityType, traits, interactions };
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
