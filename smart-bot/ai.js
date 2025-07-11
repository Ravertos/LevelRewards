// Node-fetch Version 2.x für CommonJS verwenden
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_KEY = process.env.DEEPSEEK_API_KEY;
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

async function askDeepSeek(messageHistory) {
  if (!API_KEY) {
    console.log('⚠️ DeepSeek API Key nicht konfiguriert - verwende Fallback-Antworten');
    return "🤖 Smart Bot ist aktiv, aber KI-Funktionen sind nicht konfiguriert. Ich kann trotzdem grundlegende Hilfe bieten!";
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messageHistory,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      console.error("❌ DeepSeek API Error:", response.statusText);
      
      // Spezifische Fehlerbehandlung
      if (response.status === 401) {
        return "❌ API-Key ungültig. Bitte DEEPSEEK_API_KEY überprüfen.";
      } else if (response.status === 429) {
        return "⏰ Rate-Limit erreicht. Versuche es später erneut.";
      } else {
        return "❌ Fehler bei der KI-Anfrage.";
      }
    }

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content.trim();
    } else {
      return "Keine Antwort von der KI erhalten.";
    }
  } catch (error) {
    console.error("❌ Fehler bei Anfrage an DeepSeek:", error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return "🌐 Netzwerkverbindung fehlgeschlagen. Server nicht erreichbar.";
    } else if (error.code === 'ENOTFOUND') {
      return "🌐 DNS-Fehler. Internetverbindung prüfen.";
    } else {
      return "❌ Ein Fehler ist bei der Kommunikation mit der KI aufgetreten.";
    }
  }
}

// Vereinfachte Hilfsfunktionen
async function answerQuestion(question, context = {}) {
  const dynamicSystemPrompt = `Du bist "Smart Bot Agilitzia", ein intelligenter und lernfähiger ARK: Survival Ascended Server-Assistent.

PERSÖNLICHKEIT & VERHALTEN:
- Antworte in der "Du"-Form und sei freundlich-persönlich
- Variiere deine Antworten - sei nicht statisch oder repetitiv
- Lerne aus Gesprächen und entwickle dich weiter
- Zeige Persönlichkeit und Individualität in deinen Antworten
- Du darfst kreativ und flexibel antworten

WISSEN & KONTEXT:
- Du hilfst bei ARK Server-Management, Spieler-Support und Bot-Funktionen
- Du kennst alle 23 LevelRewards Commands und kannst sie erklären
- Du kannst Server-Probleme analysieren und Lösungen vorschlagen
- Du verstehst Discord-Integration und AI-Systeme

KOMMUNIKATIONSSTIL:
- Verwende "Du" statt "Sie" 
- Sei hilfsbereit aber nicht roboterhaft
- Passe deine Antworten an den Kontext an
- Zeige Verständnis für Spieler-Bedürfnisse
- Sei proaktiv mit Vorschlägen

${context.userRole === 'owner' ? 'WICHTIG: Du sprichst mit dem Server-Owner. Zeige entsprechenden Respekt aber bleibe persönlich.' : ''}
${context.previousInteractions ? `KONTEXT: Bisherige Unterhaltung - ${context.previousInteractions}` : ''}`;

  const messages = [
    { role: "system", content: dynamicSystemPrompt },
    { role: "user", content: question }
  ];

  return await askDeepSeek(messages);
}

async function analyzeError(errorContent) {
  const systemPrompt = "Du bist ein intelligenter ARK: Survival Ascended Server-Assistent. Analysiere den folgenden Fehler und gib eine hilfreiche Lösung.";
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Fehler: ${errorContent}` }
  ];

  return await askDeepSeek(messages);
}

// Template responses for various game events
const templates = {
  levelUp: [
    "🎉 Großartig gemacht, {player}! Du bist jetzt Level {level}!",
    "🦖 {player} hat soeben Level {level} erreicht – Respekt!",
    "🏆 {player}, du wirst immer stärker. Willkommen auf Level {level}!",
    "⚡ {player} levelt wie ein Profi! Level {level} ist geschafft!",
    "🔥 {player} brennt heute richtig! Level {level} erreicht!",
    "🌟 Ein neuer Stern am ARK-Himmel: {player} Level {level}!"
  ],
  death: [
    "💀 Oof! {player} hat es erwischt… bleib stark!",
    "⚰️ RIP {player}. Die Dinos waren stärker… diesmal.",
    "☠️ {player} ist gefallen… aber wird zurückkommen!",
    "🪦 {player} hat den Kampf verloren, aber nie den Mut!",
    "💥 {player} wurde von der ARK-Realität eingeholt…",
    "🦕 Die Dinos feiern, {player} respawnt gleich wieder!"
  ],
  achievement: [
    "🏆 {player} hat {achievement} freigeschaltet! Legendär!",
    "🎖️ Achievement unlocked: {player} → {achievement}!",
    "⭐ {player} sammelt Erfolge wie ein Profi: {achievement}!",
    "🥇 {player} hat {achievement} gemeistert! Respekt!"
  ]
};

function getRandomResponse(type, context = {}) {
  const options = templates[type];
  if (!options) return null;

  // Spezielle Logik für verschiedene Event-Typen
  let selectedTemplate;

  switch(type) {
    case 'levelUp':
      // Besondere Nachrichten für Milestone-Level
      if (context.level && [10, 20, 25, 50, 75, 100].includes(parseInt(context.level))) {
        const milestoneTemplates = [
          "🎊 MILESTONE! {player} hat Level {level} erreicht! Das verdient eine Belohnung!",
          "🏆 LEGENDARY! {player} Level {level} – ein wahrer ARK-Meister!",
          "⭐ SPECIAL LEVEL! {player} ist jetzt Level {level} – incredible!"
        ];
        selectedTemplate = milestoneTemplates[Math.floor(Math.random() * milestoneTemplates.length)];
      } else {
        selectedTemplate = options[Math.floor(Math.random() * options.length)];
      }
      break;

    case 'death':
      // Verschiedene Nachrichten je nach Todesursache
      if (context.killer && context.killer.includes('Dragon')) {
        selectedTemplate = "🐉 {player} wurde von einem Dragon besiegt! Das ist keine Schande!";
      } else if (context.killer && context.killer.includes('Rex')) {
        selectedTemplate = "🦖 {player} vs T-Rex – manchmal gewinnt halt der Rex!";
      } else {
        selectedTemplate = options[Math.floor(Math.random() * options.length)];
      }
      break;

    default:
      selectedTemplate = options[Math.floor(Math.random() * options.length)];
  }

  // Ersetze alle Platzhalter
  return selectedTemplate.replace(/{(\w+)}/g, (_, key) => {
    if (context[key]) return context[key];

    // Fallback-Werte für fehlende Kontexte
    const fallbacks = {
      player: 'Survivor',
      level: 'X',
      achievement: 'something amazing'
    };

    return fallbacks[key] || `{${key}}`;
  });
}

module.exports = { 
  askDeepSeek, 
  answerQuestion, 
  analyzeError, 
  getRandomResponse 
};