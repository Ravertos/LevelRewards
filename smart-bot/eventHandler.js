import { askDeepSeek } from './ai.js';
import config from './config.json' assert { type: 'json' };
import { sendToDiscord } from './discord.js';

const messageHistory = [
  { role: "system", content: config.system_prompt }
];

export async function handleEvent({ type, content, source = "unknown", metadata = {} }) {
  if (config.debug_mode) {
    console.log(`[EventHandler] Processing: ${type} from ${source}`);
  }

  const promptMap = {
    error: `❌ Fehler erkannt (${source}): ${content}`,
    missing_info: `❓ Es fehlt etwas: ${content}`,
    user_question: `💬 Frage vom User: ${content}`,
    rcon_log: `📋 Spielserver Log: ${content}`,
    system_status: `📊 System Status: ${content}`,
    player_join: `👋 Spieler beigetreten: ${content}`,
    player_leave: `👋 Spieler verlassen: ${content}`
  };

  const userPrompt = promptMap[type] || `❓ Unbekanntes Event (${type}): ${content}`;

  // Füge zur Historie hinzu
  messageHistory.push({ role: "user", content: userPrompt });

  // KI-Antwort abrufen
  const aiReply = await askDeepSeek(messageHistory);

  // Antwort zur Historie hinzufügen
  messageHistory.push({ role: "assistant", content: aiReply });

  // Historie begrenzen
  if (messageHistory.length > config.max_message_history) {
    const systemPrompt = messageHistory[0];
    const recentMessages = messageHistory.slice(-(config.max_message_history - 1));
    messageHistory.length = 0;
    messageHistory.push(systemPrompt, ...recentMessages);
  }

    // Sende Empfehlung an Discord
    if (aiReply) {
        await sendToDiscord(
            `🤖 LevelRewards-AI Antwort:\n${aiReply}`,
            'info'
        );
    }

  return aiReply;
}

// Spezielle Funktionen für verschiedene Event-Typen
export async function handleUserQuestion(question) {
  return await handleEvent({ type: "user_question", content: question });
}

export async function handleError(error) {
  return await handleEvent({ type: "error", content: error });
}

export async function handleRconLog(logMessage) {
  return await handleEvent({ type: "rcon_log", content: logMessage });
}

export async function handleSystemStatus(status) {
  return await handleEvent({ type: "system_status", content: status });
}

// Alert-System-Klasse
class AlertSystem {
    constructor() {
        this.scheduledAlerts = new Map();
    }

    async sendCriticalAlert(type, content) {
        console.log(`🚨 CRITICAL ALERT [${type}]: ${content}`);

        await sendToDiscord(
            `🚨 **KRITISCHER ALERT**\n\n` +
            `**Typ:** ${type}\n` +
            `**Details:** ${content}\n\n` +
            `*Sofortige Aufmerksamkeit erforderlich!*`,
            'error'
        );
    }

    async sendSecurityAlert(type, content) {
        console.log(`🛡️ SECURITY ALERT [${type}]: ${content}`);

        await sendToDiscord(
            `🛡️ **SICHERHEITS-ALERT**\n\n` +
            `**Typ:** ${type}\n` +
            `**Details:** ${content}\n\n` +
            `*Sicherheitsmaßnahmen wurden eingeleitet.*`,
            'warning'
        );
    }

    async sendResourceAlert(type, content) {
        console.log(`📊 RESOURCE ALERT [${type}]: ${content}`);

        await sendToDiscord(
            `📊 **RESOURCE-ALERT**\n\n` +
            `**Typ:** ${type}\n` +
            `**Details:** ${content}\n\n` +
            `*Ressourcen-Überwachung aktiv.*`,
            'warning'
        );
    }

    async sendSuspiciousActivityAlert(playerInfo, indicators) {
        console.log(`⚠️ SUSPICIOUS ACTIVITY: ${playerInfo.name} - ${indicators.join(', ')}`);

        await sendToDiscord(
            `⚠️ **VERDÄCHTIGE AKTIVITÄT**\n\n` +
            `**Spieler:** ${playerInfo.name}\n` +
            `**Indikatoren:** ${indicators.join(', ')}\n\n` +
            `*Überwachung verstärkt.*`,
            'warning'
        );
    }

    async schedulePreventiveAlert(type, timestamp) {
        this.scheduledAlerts.set(type, timestamp);
        console.log(`⏰ SCHEDULED ALERT [${type}] for ${new Date(timestamp)}`);
    }
}

// Erweiterte Event-Handler-Klasse mit Discord-Command-Integration (Simplified)
class AdvancedEventHandler {
    constructor() {
        this.alertSystem = new AlertSystem();
    }

    async handleEvent(eventData) {
        return await handleEvent(eventData); // Direct call to the simplified handleEvent
    }
}

const advancedEventHandler = new AdvancedEventHandler();

export { advancedEventHandler };
import { sendToDiscord } from './discord.js';
import { sendRCONCommand } from './rcon.js';
import config from './config.js';

class EventHandler {
  constructor() {
    this.eventQueue = [];
    this.processing = false;
  }

  async processEvent(event) {
    console.log(`🎯 Event verarbeitet: ${event.type}`);

    switch (event.type) {
      case 'player_join':
        await this.handlePlayerJoin(event.data);
        break;
      case 'player_leave':
        await this.handlePlayerLeave(event.data);
        break;
      case 'server_crash':
        await this.handleServerCrash(event.data);
        break;
      case 'error_detected':
        await this.handleError(event.data);
        break;
      default:
        console.log(`⚠️ Unbekannter Event-Typ: ${event.type}`);
    }
  }

  async handlePlayerJoin(data) {
    const message = `🎮 **Spieler beigetreten:** ${data.playerName}`;
    sendToDiscord(message, 'info');
  }

  async handlePlayerLeave(data) {
    const message = `👋 **Spieler verlassen:** ${data.playerName}`;
    sendToDiscord(message, 'info');
  }

  async handleServerCrash(data) {
    const message = `🚨 **SERVER CRASH ERKANNT!**\n\`\`\`${data.error}\`\`\``;
    sendToDiscord(message, 'error');
  }

  async handleError(data) {
    const message = `⚠️ **Fehler erkannt:** ${data.message}`;
    sendToDiscord(message, 'warning');
  }

  addEvent(type, data) {
    this.eventQueue.push({ type, data, timestamp: Date.now() });
    this.processQueue();
  }

  async processQueue() {
    if (this.processing || this.eventQueue.length === 0) return;

    this.processing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      await this.processEvent(event);
    }

    this.processing = false;
  }
}

export default new EventHandler();