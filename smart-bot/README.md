
# ARK Smart Support Bot System

Ein intelligentes KI-gestütztes Support-System für ARK: Survival Ascended Server, das automatisch Fehler analysiert, Fragen beantwortet und RCON-Logs überwacht.

## 🚀 Features

- **🧠 KI-Integration**: Nutzt DeepSeek AI für intelligente Antworten
- **📊 RCON-Monitoring**: Überwacht Server-Logs in Echtzeit
- **💬 Discord-Integration**: Beantwortet Fragen automatisch
- **🚨 Error-Detection**: Erkennt und analysiert Fehler automatisch
- **🔄 Auto-Reconnect**: Automatische Wiederverbindung bei Verbindungsabbruch

## 📋 Installation

1. **Node.js Dependencies installieren:**
```bash
cd smart-bot
npm install
```

2. **Konfiguration anpassen:**
Bearbeite `config.json` und trage deine API-Keys und Server-Daten ein:

```json
{
  "deepseek_api_key": "DEIN_DEEPSEEK_API_KEY",
  "discord_token": "DEIN_DISCORD_BOT_TOKEN", 
  "discord_channel_id": "DEINE_DISCORD_CHANNEL_ID",
  "rcon_host": "31.214.216.192",
  "rcon_port": 11490,
  "rcon_password": "ServervonPatrick"
}
```

3. **Bot starten:**
```bash
npm start
```

## 🔧 Konfiguration

### DeepSeek API Key
1. Gehe zu [DeepSeek Platform](https://platform.deepseek.com/)
2. Erstelle einen Account und generiere einen API-Key
3. Trage den Key in `config.json` ein

### Discord Bot Token
1. Gehe zur [Discord Developer Portal](https://discord.com/developers/applications)
2. Erstelle eine neue Application/Bot
3. Kopiere den Bot Token
4. Lade den Bot in deinen Server ein mit Message Content Intent

### RCON-Einstellungen
- `rcon_host`: IP-Adresse deines ARK Servers
- `rcon_port`: RCON Port (meist 27020 oder ähnlich)
- `rcon_password`: RCON Passwort aus der Server-Konfiguration

## 💡 Verwendung

### Automatische Features
- **Error Detection**: Erkennt Fehler in RCON-Logs automatisch
- **Player Events**: Überwacht Spieler Join/Leave Events
- **Crash Analysis**: Analysiert Server-Crashes mit KI

### Discord Commands
- Stelle einfach Fragen im konfigurierten Discord-Kanal
- Das System antwortet automatisch mit KI-generierten Antworten
- Beispiele:
  - "Warum crashed mein Server?"
  - "Wie installiere ich Mods?"
  - "Player kann nicht joinen, was tun?"

### RCON Integration
- Sendet automatisch Status-Updates an Discord
- Überwacht kritische Server-Events
- Bietet Lösungsvorschläge für erkannte Probleme

## 🛠️ Entwicklung

### Debug-Modus aktivieren
```json
{
  "debug_mode": true
}
```

### Logs anzeigen
```bash
npm run dev  # Startet mit --watch flag
```

## 📊 System-Architektur

```
smart-bot/
├── index.js          # Haupteinstiegspunkt
├── ai.js             # DeepSeek AI Integration
├── discord.js        # Discord Bot Handler
├── rcon.js           # RCON Monitoring
├── eventHandler.js   # Event-Verarbeitung
├── config.json       # Konfiguration
└── package.json      # Dependencies
```

## 🔒 Sicherheit

- Alle API-Keys werden lokal in `config.json` gespeichert
- RCON-Verbindungen sind verschlüsselt
- Keine sensiblen Daten werden geloggt

## 📞 Support

Bei Fragen oder Problemen:
1. Überprüfe die Logs in der Konsole
2. Stelle sicher, dass alle API-Keys korrekt sind
3. Teste die RCON-Verbindung manuell

## 🔄 Updates

Das System läuft parallel zu deinem Haupt-ARK-Bot und beeinträchtigt diesen nicht.
