
const { recall, remember } = require('./memory.js');

class ConversationStyler {
  constructor() {
    this.personalityVariations = {
      friendly: [
        "Hey {name}! ",
        "Hi {name}, ",
        "Hallo {name}! ",
        "Servus {name}! ",
        "{name}, "
      ],
      encouraging: [
        "Super Frage, {name}! ",
        "Gerne helfe ich dir, {name}! ",
        "Kein Problem, {name}! ",
        "Das kann ich dir erklären, {name}! "
      ],
      expert: [
        "Also {name}, ",
        "Gut dass du fragst, {name}! ",
        "Lass mich dir helfen, {name}: ",
        "Da kann ich weiterhelfen, {name}: "
      ]
    };

    this.responseEndings = {
      helpful: [
        " Hilft dir das weiter?",
        " Falls du noch Fragen hast, frag gerne!",
        " Sonst noch was?",
        " Brauchst du noch Hilfe dabei?"
      ],
      encouraging: [
        " Du schaffst das! 💪",
        " Viel Erfolg damit! 🚀",
        " Happy Gaming! 🎮",
        " Lass es krachen! ⚡"
      ]
    };
  }

  adaptResponseStyle(username, baseResponse, context = {}) {
    const userPersonality = this.getUserPersonality(username);
    const userPreferences = recall(username, 'conversation_preferences') || {};
    
    // Wähle passenden Stil basierend auf User und Kontext
    let style = this.selectStyle(userPersonality, context);
    let greeting = this.getRandomGreeting(style.greeting, username);
    let ending = this.getRandomEnding(style.ending);
    
    // Baue personalisierte Antwort zusammen
    let personalizedResponse = greeting + baseResponse + ending;
    
    // Lerne aus dieser Interaktion
    this.rememberInteractionStyle(username, style, context);
    
    return personalizedResponse;
  }

  selectStyle(userPersonality, context) {
    // Dynamische Stilauswahl basierend auf User und Kontext
    if (context.userRole === 'owner') {
      return { greeting: 'expert', ending: 'helpful' };
    }
    
    if (userPersonality.type === 'tech_savvy') {
      return { greeting: 'expert', ending: 'helpful' };
    }
    
    if (userPersonality.type === 'gamer') {
      return { greeting: 'friendly', ending: 'encouraging' };
    }
    
    // Standard für neue oder casual User
    return { greeting: 'friendly', ending: 'helpful' };
  }

  getRandomGreeting(style, username) {
    const greetings = this.personalityVariations[style] || this.personalityVariations.friendly;
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    return randomGreeting.replace('{name}', username);
  }

  getRandomEnding(style) {
    const endings = this.responseEndings[style] || this.responseEndings.helpful;
    return endings[Math.floor(Math.random() * endings.length)];
  }

  getUserPersonality(username) {
    const interactions = recall(username, 'successful_interactions') || 0;
    const questionHistory = recall(username, 'question_history') || [];
    
    // Analysiere Nutzerverhalten für Persönlichkeitsbestimmung
    let type = 'new_user';
    
    if (interactions > 5) {
      const techQuestions = questionHistory.filter(q => 
        q.toLowerCase().includes('server') || 
        q.toLowerCase().includes('command') || 
        q.toLowerCase().includes('fehler')
      ).length;
      
      const gameQuestions = questionHistory.filter(q => 
        q.toLowerCase().includes('dino') || 
        q.toLowerCase().includes('level') || 
        q.toLowerCase().includes('ark')
      ).length;
      
      if (techQuestions > gameQuestions) type = 'tech_savvy';
      else if (gameQuestions > 0) type = 'gamer';
      else type = 'casual';
    }
    
    return { type, interactions };
  }

  rememberInteractionStyle(username, style, context) {
    const styleHistory = recall(username, 'style_history') || [];
    styleHistory.push({
      style: style,
      context: context,
      timestamp: new Date().toISOString()
    });
    
    // Behalte nur die letzten 10 Stil-Interaktionen
    if (styleHistory.length > 10) styleHistory.shift();
    
    remember(username, 'style_history', styleHistory);
  }
}

module.exports = { ConversationStyler };
