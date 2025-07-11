
# 🔧 Discord-Bot Setup Anleitung

## 📋 **Benötigte Credentials:**

### **1. Discord Bot Token:**
1. Gehe zu https://discord.com/developers/applications
2. Erstelle eine neue Application oder wähle deine bestehende
3. Gehe zu "Bot" im linken Menü
4. Kopiere den "Token"
5. Füge ihn in Replit Secrets als `DISCORD_TOKEN` hinzu

### **2. Discord Channel ID:**
1. Aktiviere "Developer Mode" in Discord (User Settings > Advanced > Developer Mode)
2. Rechtsklick auf deinen gewünschten Kanal
3. "Copy Channel ID" 
4. Füge sie in Replit Secrets als `DISCORD_CHANNEL_ID` hinzu

### **3. DeepSeek API Key:**
1. Gehe zu https://platform.deepseek.com/
2. Erstelle einen Account oder logge dich ein
3. Generiere einen API-Key
4. Füge ihn in Replit Secrets als `DEEPSEEK_API_KEY` hinzu

## 🚀 **Bot-Berechtigungen:**
Der Bot braucht diese Permissions in Discord:
- Send Messages
- Use Slash Commands  
- Read Message History
- Embed Links
- Add Reactions

## ✅ **Nach dem Setup:**
1. Starte den Bot neu mit dem Run-Button
2. Der Bot sollte sich mit einer Willkommensnachricht melden
3. Teste mit `/ai status` oder schreibe einfach "Hallo"
