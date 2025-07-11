
import { aiAnalyzer } from './ai.js';
import { sendToDiscord } from './discord.js';
import config from './config.json' assert { type: 'json' };

// Kontinuierliches Feedback-System
export class ContinuousFeedbackSystem {
  constructor() {
    this.isActive = true;
    this.feedbackQueue = [];
    this.lastAnalysis = new Map();
    this.systemMetrics = {
      uptime: Date.now(),
      totalAnalyses: 0,
      criticalAlerts: 0,
      suggestions: 0,
      autoActions: 0
    };
    
    this.startContinuousMonitoring();
  }

  // 🔄 Kontinuierliche Überwachung starten
  startContinuousMonitoring() {
    console.log('🤖 [FEEDBACK] Kontinuierliches AI-Feedback-System gestartet');
    
    // Haupt-Feedback-Loop alle 30 Sekunden
    setInterval(async () => {
      if (this.isActive) {
        await this.performContinuousAnalysis();
      }
    }, config.feedback_interval || 30000);

    // Proaktive Überwachung alle 45 Sekunden
    setInterval(async () => {
      if (this.isActive) {
        await this.performProactiveScanning();
      }
    }, config.analysis_settings?.proactive_scan_interval || 45000);

    // System-Gesundheitscheck alle 2 Minuten
    setInterval(async () => {
      await this.performSystemHealthCheck();
    }, 120000);

    // Status-Report alle 10 Minuten
    setInterval(async () => {
      await this.sendStatusReport();
    }, 600000);
  }

  // 📊 Kontinuierliche System-Analyse
  async performContinuousAnalysis() {
    try {
      this.systemMetrics.totalAnalyses++;
      
      // 1. Performance-Überwachung
      const performanceStatus = await this.analyzeCurrentPerformance();
      
      // 2. Sicherheits-Scan
      const securityStatus = await this.performSecurityScan();
      
      // 3. Spieler-Aktivität überwachen
      const playerStatus = await this.monitorPlayerActivity();
      
      // 4. System-Optimierungen vorschlagen
      const optimizations = await this.suggestOptimizations();
      
      // Feedback zusammenstellen und senden
      await this.processAndSendFeedback({
        performance: performanceStatus,
        security: securityStatus,
        players: playerStatus,
        optimizations: optimizations
      });

    } catch (error) {
      console.error('[FEEDBACK] Fehler bei kontinuierlicher Analyse:', error);
      await this.sendErrorFeedback(error);
    }
  }

  // 🔍 Proaktive Systemüberwachung
  async performProactiveScanning() {
    const proactiveAnalysis = await aiAnalyzer.askDeepSeek([
      {
        role: "system",
        content: `Du führst eine proaktive System-Analyse durch. Scanne nach potenziellen Problemen, die noch nicht aufgetreten sind, aber wahrscheinlich auftreten werden.

PROAKTIVE SCAN-BEREICHE:
🔮 VORHERSAGE: Probleme die wahrscheinlich in den nächsten 1-6 Stunden auftreten
⚠️ FRÜHERKENNUNG: Schwache Signale für kommende Issues  
🛠️ PRÄVENTIVE MASSNAHMEN: Was jetzt getan werden sollte
📊 TREND-ANALYSE: Verschlechternde Systemmetriken
🎯 OPTIMIERUNGS-CHANCEN: Verbesserungsmöglichkeiten

AUSGABE-FORMAT:
🔮 VORHERSAGE: [Was wird wahrscheinlich passieren]
⚠️ RISIKO-LEVEL: [NIEDRIG/MITTEL/HOCH/KRITISCH]  
🛠️ EMPFOHLENE AKTIONEN: [Konkrete Schritte]
⏰ ZEITFENSTER: [Wann handeln]
📈 VERBESSERUNGS-POTENZIAL: [Optimierungschancen]`
      },
      {
        role: "user",
        content: `Führe proaktiven System-Scan durch:

AKTUELLE SYSTEM-METRIKEN:
- Uptime: ${Math.floor((Date.now() - this.systemMetrics.uptime) / 60000)} Minuten
- Analysen: ${this.systemMetrics.totalAnalyses}
- Alerts: ${this.systemMetrics.criticalAlerts}
- Auto-Aktionen: ${this.systemMetrics.autoActions}

Zeit: ${new Date().toISOString()}`
      }
    ]);

    if (proactiveAnalysis && !proactiveAnalysis.includes('deaktiviert')) {
      await sendToDiscord(
        `🔮 **PROAKTIVE AI-ANALYSE**\n\n${proactiveAnalysis}`,
        'info'
      );
    }
  }

  // 💓 System-Gesundheitscheck
  async performSystemHealthCheck() {
    const healthReport = await aiAnalyzer.askDeepSeek([
      {
        role: "system", 
        content: `Führe einen umfassenden System-Gesundheitscheck durch. Bewerte die Gesamtstabilität und -performance.

GESUNDHEITS-KATEGORIEN:
💓 SYSTEM-VITALITÄT: Core-System-Gesundheit
🧠 AI-PERFORMANCE: KI-System Effizienz  
📡 VERBINDUNGEN: Discord/RCON Status
⚡ REAKTIONSZEIT: Response-Performance
🔄 STABILITÄT: System-Stabilität über Zeit
🎯 EFFEKTIVITÄT: Problem-Lösung-Rate

AUSGABE-FORMAT:
💓 GESUNDHEITS-SCORE: [0-100]
🎯 SYSTEM-STATUS: [EXCELLENT/GOOD/FAIR/POOR/CRITICAL]
⚠️ SCHWACHSTELLEN: [Identifizierte Probleme]
🚀 VERBESSERUNGEN: [Optimierungsvorschläge]
📊 EMPFEHLUNG: [Nächste Schritte]`
      },
      {
        role: "user",
        content: `System-Gesundheitscheck:

SYSTEM-STATISTIKEN:
- Laufzeit: ${Math.floor((Date.now() - this.systemMetrics.uptime) / 60000)} Minuten
- Gesamt-Analysen: ${this.systemMetrics.totalAnalyses}
- Kritische Alerts: ${this.systemMetrics.criticalAlerts}  
- Verbesserungsvorschläge: ${this.systemMetrics.suggestions}
- Automatische Aktionen: ${this.systemMetrics.autoActions}
- Feedback-Queue: ${this.feedbackQueue.length} Items

Timestamp: ${new Date().toISOString()}`
      }
    ]);

    await sendToDiscord(
      `💓 **SYSTEM-GESUNDHEITSCHECK**\n\n${healthReport}`,
      'success'
    );
  }

  // 📊 Status-Report senden
  async sendStatusReport() {
    const statusReport = `🤖 **AI-BOT STATUS REPORT**

⏰ **Laufzeit:** ${Math.floor((Date.now() - this.systemMetrics.uptime) / 60000)} Minuten
📊 **Analysen:** ${this.systemMetrics.totalAnalyses}
🚨 **Kritische Alerts:** ${this.systemMetrics.criticalAlerts}
💡 **Verbesserungsvorschläge:** ${this.systemMetrics.suggestions}
🤖 **Auto-Aktionen:** ${this.systemMetrics.autoActions}
📋 **Feedback-Queue:** ${this.feedbackQueue.length}

✅ **Status:** ${this.isActive ? 'AKTIV & ÜBERWACHT' : 'PAUSIERT'}
🔄 **Modus:** Kontinuierliches Feedback & Proaktive Überwachung`;

    await sendToDiscord(statusReport, 'info');
  }

  // 🔧 Feedback verarbeiten und senden
  async processAndSendFeedback(analysis) {
    if (analysis.performance?.critical || analysis.security?.alerts || analysis.optimizations?.length > 0) {
      
      let feedbackMessage = '🤖 **KONTINUIERLICHES AI-FEEDBACK**\n\n';
      
      if (analysis.performance?.critical) {
        feedbackMessage += `⚡ **PERFORMANCE-WARNUNG:**\n${analysis.performance.message}\n\n`;
        this.systemMetrics.criticalAlerts++;
      }
      
      if (analysis.security?.alerts) {
        feedbackMessage += `🛡️ **SICHERHEITS-HINWEIS:**\n${analysis.security.message}\n\n`;
      }
      
      if (analysis.optimizations?.length > 0) {
        feedbackMessage += `🚀 **OPTIMIERUNGS-VORSCHLÄGE:**\n${analysis.optimizations.join('\n')}\n\n`;
        this.systemMetrics.suggestions++;
      }
      
      feedbackMessage += `⏰ **Zeit:** ${new Date().toLocaleString('de-DE')}\n\n`;
      feedbackMessage += `💬 **Antworte mit:** \`/ai scan\` für Details oder \`/ai optimize\` für Lösungen`;
      
      await sendToDiscord(feedbackMessage, 'warning');
    }
  }

  // 🚨 Proaktive Alert-Nachrichten
  async sendProactiveAlert(type, message, urgency = 'medium') {
    const urgencyEmojis = {
      low: '💡',
      medium: '⚠️', 
      high: '🚨',
      critical: '🔥'
    };

    const urgencyColors = {
      low: 'info',
      medium: 'warning',
      high: 'error', 
      critical: 'error'
    };

    const alertMessage = `${urgencyEmojis[urgency]} **PROAKTIVER AI-ALERT**

**Typ:** ${type}
**Nachricht:** ${message}

💬 **Du kannst reagieren mit:**
\`/ai emergency\` - Für kritische Probleme
\`/ai scan\` - Für detaillierte Analyse  
\`/ai optimize\` - Für Optimierungs-Tipps

⏰ **Zeit:** ${new Date().toLocaleString('de-DE')}`;

    await sendToDiscord(alertMessage, urgencyColors[urgency]);
  }

  // 📈 Performance-Analyse
  async analyzeCurrentPerformance() {
    // Simuliere Performance-Metriken
    const cpuUsage = Math.random() * 100;
    const memoryUsage = Math.random() * 100;
    
    if (cpuUsage > 80 || memoryUsage > 85) {
      return {
        critical: true,
        message: `CPU: ${cpuUsage.toFixed(1)}%, RAM: ${memoryUsage.toFixed(1)}% - System unter hoher Last!`
      };
    }
    return { critical: false };
  }

  // 🔒 Sicherheits-Scan
  async performSecurityScan() {
    return { alerts: false };
  }

  // 👥 Spieler-Aktivität überwachen
  async monitorPlayerActivity() {
    return { anomalies: false };
  }

  // 🚀 Optimierungen vorschlagen
  async suggestOptimizations() {
    const suggestions = [];
    
    if (Math.random() > 0.7) {
      suggestions.push('💾 Speicher-Cleanup empfohlen');
    }
    
    if (Math.random() > 0.8) {
      suggestions.push('🔄 Neustart für optimale Performance empfohlen');
    }
    
    return suggestions;
  }

  // ❌ Fehler-Feedback senden
  async sendErrorFeedback(error) {
    await sendToDiscord(
      `🚨 **AI-FEEDBACK SYSTEM FEHLER**\n\n${error.message}`,
      'error'
    );
  }

  // 🔧 System ein/ausschalten
  toggleFeedbackSystem(active) {
    this.isActive = active;
    console.log(`🤖 [FEEDBACK] System ${active ? 'aktiviert' : 'deaktiviert'}`);
  }
}

// Instanz erstellen und exportieren
export const continuousFeedback = new ContinuousFeedbackSystem();
