require('dotenv').config();

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { sendRconCommand, testRCON } = require('./rcon.js');
const { remember, recall, getAllMemories, forgetPlayer, getMemoryStats, learnFromInteraction } = require('./memoryHandler.js');
const { getRandomResponse } = require('./templates.js');
const { CommandValidator } = require('./commandValidator.js');
const config = require('./config.json');
const fs = require('fs');
const { askDeepSeek } = require('./ai.js');
const { ConversationStyler } = require('./conversationStyle.js');

// Command Validator initialisieren
const commandValidator = new CommandValidator();

console.log('🚀 Smart Bot Agilitzia wird gestartet...');

// Test dotenv Konfiguration
console.log('🔍 Teste dotenv Konfiguration...');
console.log('DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? '✅ Geladen' : '❌ Nicht gefunden');
console.log('DISCORD_CHANNEL_ID:', process.env.DISCORD_CHANNEL_ID ? '✅ Geladen' : '❌ Nicht gefunden');
console.log('RCON_HOST:', process.env.RCON_HOST ? '✅ Geladen' : '❌ Nicht gefunden');
console.log('RCON_PORT:', process.env.RCON_PORT ? '✅ Geladen' : '❌ Nicht gefunden');

// Discord Client erstellen
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ] 
});

// 🔄 Gedächtnis-System laden
let memory = {};
const memoryFile = 'smart-bot/memory.json';
if (fs.existsSync(memoryFile)) {
  try {
    memory = JSON.parse(fs.readFileSync(memoryFile, 'utf8'));
    console.log('🧠 Gedächtnis-System geladen:', Object.keys(memory).length, 'Benutzer');
  } catch (error) {
    console.error('❌ Fehler beim Laden des Gedächtnisses:', error);
    memory = {};
  }
} else {
  console.log('🧠 Neues Gedächtnis-System erstellt');
}

// Gedächtnis speichern
function saveMemory() {
  try {
    fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Speichern des Gedächtnisses:', error);
    return false;
  }
}

// Zugriff auf Konfiguration aus Replit Secrets
const token = process.env.DISCORD_TOKEN;
const channelId = process.env.DISCORD_CHANNEL_ID || '1225897570424844329';

// Validierung
if (!token) {
  console.error('❌ DISCORD_TOKEN fehlt in Replit Secrets!');
  console.error('💡 Bitte DISCORD_TOKEN in den Replit Secrets hinzufügen');
  process.exit(1);
}

console.log('✅ Discord Token gefunden');
console.log('✅ Channel ID:', channelId);

// Bot Events
client.once('ready', async () => {
  console.log(`✅ Smart Bot Agilitzia ist eingeloggt als ${client.user.tag}`);

  // Setze Bot-Status mit eindeutigem Namen
  client.user.setActivity('Smart Bot Agilitzia - AI Assistant', { type: 3 });

  // Teste RCON Verbindung
  console.log('🔍 Teste RCON Verbindung...');
  const rconWorking = await testRCON();
  if (rconWorking) {
    console.log('✅ RCON erfolgreich getestet');
  } else {
    console.log('❌ RCON Test fehlgeschlagen');
  }

  // Sende Willkommensnachricht
  const channel = client.channels.cache.get(channelId);
  if (channel) {
    const memoryStats = getMemoryStats();
    const embed = new EmbedBuilder()
      .setColor(0x00AE86)
      .setTitle('🤖 Smart Bot Agilitzia ist online!')
      .setDescription('Intelligenter AI-Assistent für natürliche Gespräche ist bereit!')
      .addFields(
        { name: '💬 Verwendung', value: 'Schreibt einfach eine Nachricht in diesen Kanal', inline: true },
        { name: '🧠 Lernfähig', value: 'Mit `lerne: [info]` könnt ihr mir etwas beibringen', inline: true },
        { name: '🔧 Hilfe', value: 'Ich helfe bei Server-Problemen und Fragen', inline: true },
        { name: '📊 Gedächtnis', value: `${memoryStats.playerCount} Spieler, ${memoryStats.totalEntries} Einträge`, inline: true },
        { name: '🔍 Abrufen', value: 'Fragt "was weißt du über mich?"', inline: true },
        { name: '✅ Status', value: 'Stabil und lernbereit', inline: true }
      )
      .setFooter({ text: 'Smart Bot Agilitzia - Intelligenter ARK Server Assistant' })
      .setTimestamp();

    channel.send({ embeds: [embed] });
  }
});

// Zusätzliche Hilfsfunktion für zeitbasierte Responses
function getTimeBasedResponse(player) {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) {
    return getRandomResponse('morning', { player });
  } else if (hour >= 22 || hour < 6) {
    return getRandomResponse('night', { player });
  } else if (Math.random() < 0.3) {
    return getRandomResponse('motivational', { player });
  } else if (Math.random() < 0.1) {
    return getRandomResponse('funny', { player });
  }

  return null;
}

// Nachrichten verarbeiten
client.on('messageCreate', async (message) => {
  // Ignoriere Bot-Nachrichten
  if (message.author.bot) {
    return;
  }

  const content = message.content.trim();
  const isInConfiguredChannel = message.channel.id === channelId;
  
  // Flag um mehrfache Antworten zu verhindern
  let hasResponded = false;

  // 🎁 Belohnungs-Konfiguration aus config.json laden
  const rewardConfig = config.rewards || {
    "10": [
      "giveitemtoplayer {player} Blueprint'/Game/Structures/Stone/StoneWall.StoneWall' 10 0 0 false",
      "giveitemtoplayer {player} Blueprint'/Game/Structures/Stone/StoneFoundation.StoneFoundation' 10 0 0 false"
    ],
    "20": [
      "giveitemtoplayer {player} Blueprint'/Game/PrimalEarth/CoreBlueprints/Items/MetalIngot.MetalIngot' 400 0 0 false",
      "giveitemtoplayer {player} Blueprint'/Game/Structures/Cooking/IndustrialGrill.IndustrialGrill' 1 0 0 false"
    ],
    "50": [
      "giveitemtoplayer {player} Blueprint'/Game/Weapons/Tek/TekGenerator.TekGenerator' 1 0 0 false"
    ],
    "100": [
      "giveitemtoplayer {player} Blueprint'/Game/Element/PrimalItemResource_Element.PrimalItemResource_Element' 1000 0 0 false"
    ]
  };

  // 🤖 Helena-Bot Nachrichten automatisch lernen (alle Channels) - OHNE Antworten
  
  // Spieler erreicht Level - nur lernen, nicht antworten (Hauptbot macht das)
  const levelUpMatch = content.match(/^\[(.+?)\] erreicht Level (\d+)/);
  if (levelUpMatch) {
    const player = levelUpMatch[1];
    const level = parseInt(levelUpMatch[2]);
    remember(player, 'level', level);
    console.log(`📚 Gelernt: ${player} ist jetzt Level ${level}`);
    return; // Keine Antwort - Hauptbot übernimmt das
  }

  // Andere Events nur lernen, nicht antworten
  const achievementMatch = content.match(/^\[(.+?)\] hat (.+?) freigeschaltet/);
  if (achievementMatch) {
    const player = achievementMatch[1];
    const achievement = achievementMatch[2];
    remember(player, 'achievement', achievement);
    console.log(`🏆 Gelernt: ${player} hat ${achievement} freigeschaltet`);
    return;
  }

  const deathMatch = content.match(/^\[(.+?)\] wurde von/i);
  if (deathMatch) {
    const player = deathMatch[1];
    remember(player, 'last_death', { timestamp: new Date().toISOString() });
    console.log(`💀 Gelernt: ${player} ist gestorben`);
    return;
  }

  // Nur auf konfigurierten Channel für Smart Bot Interaktion reagieren
  if (!isInConfiguredChannel) {
    return;
  }

  // Ignoriere Slash-Commands komplett (außer /ai)
  if (content.startsWith('/') && !content.startsWith('/ai')) {
    return;
  }

  try {
    const userId = message.author.id;
    const content = message.content.trim();

    console.log(`[Smart Bot] ${message.author.tag}: ${content}`);

    // 🧠 Lern-Funktion: "lerne: Ich spiele gerne ARK"
    if (content.toLowerCase().startsWith("lerne:")) {
      const info = content.slice(6).trim();
      if (info.length > 0) {
        const timestamp = new Date().toISOString();
        remember(message.author.tag, timestamp, {
          info: info,
          timestamp: timestamp,
          channel: message.channel.name
        });

        await message.reply("🧠 Okay, hab ich mir gemerkt! Du kannst mich mit 'was weißt du über mich?' testen.");
        return;
      } else {
        await message.reply("🤔 Du musst mir etwas sagen! Zum Beispiel: `lerne: Ich spiele gerne ARK`");
        return;
      }
    }

    // 🔍 Abrufen: "was weißt du über mich?"
    if (content.toLowerCase().includes("was weißt du über mich")) {
      const userMemories = getAllMemories(message.author.tag);
      const memoryEntries = Object.values(userMemories);

      if (memoryEntries.length > 0) {
        const userInfo = memoryEntries.map(item => item.info).join('\n• ');
        const embed = new EmbedBuilder()
          .setColor(0x00AE86)
          .setTitle('🧠 Was ich über dich gelernt habe:')
          .setDescription(`• ${userInfo}`)
          .setFooter({ 
            text: `${memoryEntries.length} gespeicherte Informationen`, 
            iconURL: message.author.displayAvatarURL() 
          })
          .setTimestamp();

        await message.reply({ embeds: [embed] });
        return;
      } else {
        await message.reply("🤷‍♂️ Ich weiß noch nichts über dich. Sag mir etwas mit `lerne: [deine Info]`!");
        return;
      }
    }

    // 🗑️ Gedächtnis löschen: "vergiss mich"
    if (content.toLowerCase().includes("vergiss mich") || content.toLowerCase().includes("lösche mein gedächtnis")) {
      if (forgetPlayer(message.author.tag)) {
        await message.reply("🗑️ Okay, ich habe alles über dich vergessen. Wir können von vorne anfangen!");
      } else {
        await message.reply("🤷‍♂️ Ich habe sowieso nichts über dich gespeichert.");
      }
      return;
    }

    // Verhindern Sie mehrfache Antworten
    if (hasResponded) return;

    try {
      // Zeige Typing-Indikator
      await message.channel.sendTyping();

      const lowerContent = content.toLowerCase();

      // Einfache ARK-spezifische Befehle
      if (lowerContent.includes("spieler liste") || lowerContent.includes("player list")) {
        try {
          const players = await sendRconCommand('ListPlayers');
          await message.reply(`🎮 **Aktuelle Spieler:**\n\`\`\`${players}\`\`\``);
          hasResponded = true;
          return;
        } catch (error) {
          await message.reply("❌ Konnte Spielerliste nicht abrufen.");
          hasResponded = true;
          return;
        }
      }

      // Server Status
      if (lowerContent.includes("server status")) {
        try {
          const info = await sendRconCommand('GetServerInfo');
          await message.reply(`🖥️ **Server Info:**\n\`\`\`${info}\`\`\``);
          hasResponded = true;
          return;
        } catch (error) {
          await message.reply("❌ Konnte Server-Info nicht abrufen.");
          hasResponded = true;
          return;
        }
      }

    // AI-Commands
    if (content.toLowerCase().startsWith("/ai ")) {
      const aiCommand = content.slice(4).trim();

      switch(aiCommand.toLowerCase()) {
        case "status":
          const stats = getMemoryStats();
          await message.reply(`🤖 **AI-System Status:**\n✅ Smart Bot AI ist online\n✅ RCON-Integration aktiv\n✅ Discord-Commands verfügbar\n🧠 Gedächtnis: ${stats.playerCount} Spieler, ${stats.totalEntries} Einträge`);
		  return;

        case "help":
          const helpEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🤖 Smart Bot Agilitzia - AI-System Hilfe')
            .addFields(
              { name: '📊 System Commands', value: '• `/ai status` - AI-System Status\n• `/ai scan` - Vollständiger System-Scan\n• `/ai validate` - Command-Validierung', inline: false },
              { name: '🎮 Server Commands', value: '• `Spieler` - Aktuelle Spieler anzeigen\n• `Server Status` - Server-Informationen\n• `test eos` - EOS-System testen', inline: false },
              { name: '🧠 Lern-System', value: '• `lerne: [info]` - Info über dich speichern\n• `was weißt du über mich?` - Gespeicherte Infos anzeigen\n• `vergiss mich` - Gedächtnis löschen', inline: false },
              { name: '🎁 Reward-System', value: '• `/ai belohnung [spieler] [level]` - Manuelle Belohnung\n• `check commands` - Command-System testen', inline: false },
              { name: '🔍 Diagnose', value: '• `/ai emergency` - Notfall-Analyse\n• `/ai validate` - System-Validierung', inline: false }
            )
            .setFooter({ text: 'Smart Bot Agilitzia v2.0 - ARK Server AI Assistant' })
            .setTimestamp();

          await message.reply({ embeds: [helpEmbed] });
		  return;

        case "validate":
          await message.reply("🔍 Starte Command-Validierung...");

          try {
            const validation = await commandValidator.runFullValidation();
            const summary = commandValidator.getValidationSummary();

            const validationEmbed = new EmbedBuilder()
              .setColor(summary.status === 'healthy' ? 0x00FF00 : 0xFF9900)
              .setTitle('🔍 Command-System Validierung')
              .addFields(
                { name: '🔌 RCON Verbindung', value: summary.summary.rconWorking ? '✅ Funktioniert' : '❌ Fehler', inline: true },
                { name: '👥 Spieler Online', value: summary.summary.playersOnline.toString(), inline: true },
                { name: '🆔 EOS Validierung', value: summary.summary.eosValidation, inline: true },
                { name: '🎁 Reward System', value: summary.summary.rewardSystemWorking ? '✅ Aktiv' : '❌ Fehler', inline: true },
                { name: '📊 System Status', value: summary.status === 'healthy' ? '✅ Alle Systeme funktional' : '⚠️ Probleme erkannt', inline: true },
                { name: '⏰ Validiert um', value: new Date().toLocaleTimeString('de-DE'), inline: true }
              );

            if (summary.issues.length > 0) {
              validationEmbed.addFields({ 
                name: '⚠️ Gefundene Probleme', 
                value: summary.issues.map(issue => `• ${issue}`).join('\n'), 
                inline: false 
              });
            }

            await message.reply({ embeds: [validationEmbed] });
          } catch (error) {
            await message.reply(`❌ **Validierungs-Fehler:**\n\`\`\`${error.message}\`\`\``);
          }
          return;

        case "emergency":
          await message.reply("🚨 Starte Notfall-Analyse...");

          try {
            const emergencyCheck = await commandValidator.runFullValidation();
            const criticalIssues = [];

            if (!emergencyCheck.rcon.success) {
              criticalIssues.push("🔴 KRITISCH: RCON-Verbindung unterbrochen");
            }

            if (!emergencyCheck.players.success) {
              criticalIssues.push("🟡 WARNUNG: Spieler-Daten nicht abrufbar");
            }

            if (!emergencyCheck.rewards.success) {
              criticalIssues.push("🟡 WARNUNG: Reward-System nicht erreichbar");
            }

            const emergencyEmbed = new EmbedBuilder()
              .setColor(criticalIssues.length > 0 ? 0xFF0000 : 0x00FF00)
              .setTitle('🚨 Notfall-Analyse Ergebnis')
              .addFields(
                { name: '🔍 Analyse Status', value: criticalIssues.length === 0 ? '✅ Keine kritischen Probleme' : `❌ ${criticalIssues.length} Problem(e) gefunden`, inline: false }
              );

            if (criticalIssues.length > 0) {
              emergencyEmbed.addFields({ 
                name: '🚨 Kritische Probleme', 
                value: criticalIssues.join('\n'), 
                inline: false 
              });

              emergencyEmbed.addFields({ 
                name: '🔧 Empfohlene Aktionen', 
                value: '• RCON-Verbindung prüfen\n• Server-Status überprüfen\n• Bot-Neustarterwägen\n• Administrator kontaktieren', 
                inline: false 
              });
            }

            await message.reply({ embeds: [emergencyEmbed] });
          } catch (error) {
            await message.reply(`❌ **Notfall-Analyse Fehler:**\n\`\`\`${error.message}\`\`\``);
          }
          return;

        case "scan":
          try {
            const players = await sendRconCommand('ListPlayers');
            const serverInfo = await sendRconCommand('GetServerInfo');

            // Analysiere Spieler-Daten
            let playerCount = 0;
            let eosAnalysis = { valid: 0, invalid: 0, total: 0 };

            if (players && !players.includes('No Players Connected')) {
              const lines = players.split('\n').filter(line => line.trim());
              playerCount = lines.length;

              lines.forEach(line => {
                const match = line.match(/(\d+)\.\s+([^,]+),\s+(\w+)/);
                if (match) {
                  eosAnalysis.total++;
                  const eosId = match[3];
                  if (eosId.length === 32 && eosId.match(/^[a-f0-9]+$/i)) {
                    eosAnalysis.valid++;
                  } else {
                    eosAnalysis.invalid++;
                  }
                }
              });
            }

            const embed = new EmbedBuilder()
              .setColor(0x00AE86)
              .setTitle('🔍 Vollständiger System-Scan')
              .addFields(
                { name: '🌐 RCON Status', value: '✅ Verbindung aktiv', inline: true },
                { name: '🤖 Discord Bot', value: '✅ Online & funktional', inline: true },
                { name: '👥 Spieler Online', value: playerCount.toString(), inline: true },
                { name: '🆔 EOS ID Analyse', value: `✅ ${eosAnalysis.valid} gültig\n❌ ${eosAnalysis.invalid} ungültig`, inline: true },
                { name: '🧠 Memory System', value: `${Object.keys(memory).length} Einträge gespeichert`, inline: true },
                { name: '🎁 Reward System', value: Object.keys(config.rewards || {}).length > 0 ? '✅ Aktiv' : '⚠️ Minimal', inline: true },
                { name: '📊 Server Info', value: serverInfo ? '✅ Erreichbar' : '⚠️ Begrenzt', inline: true },
                { name: '🔄 System Health', value: eosAnalysis.invalid === 0 ? '✅ Optimal' : '⚠️ Aufmerksamkeit erforderlich', inline: true }
              )
              .setTimestamp()
              .setFooter({ text: 'System-Scan abgeschlossen' });

            await message.reply({ embeds: [embed] });
          } catch (error) {
            const errorEmbed = new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle('❌ System-Scan Fehler')
              .addFields(
                { name: '🔌 RCON Status', value: '❌ Verbindungsfehler', inline: true },
                { name: '🤖 Discord Bot', value: '✅ Online (lokaler Modus)', inline: true },
                { name: '⚠️ Fehler Details', value: `\`\`\`${error.message}\`\`\``, inline: false }
              )
              .setTimestamp();

            await message.reply({ embeds: [errorEmbed] });
          }
		  return;

        default:
          // Prüfe auf Belohnungs-Command: "/ai belohnung [spieler] [level]"
          if (aiCommand.toLowerCase().startsWith("belohnung ")) {
            const parts = aiCommand.split(" ");
            if (parts.length >= 3) {
              const player = parts[1];
              const level = parseInt(parts[2]);

              // Verwende die bereits geladene Reward-Konfiguration
              const currentRewardConfig = rewardConfig;

              if (currentRewardConfig[level.toString()]) {
                try {
                  const rewards = currentRewardConfig[level.toString()];
                  let successCount = 0;

                  for (const rewardCmd of rewards) {
                    const cmd = rewardCmd.replace('{player}', player);
                    const res = await sendRconCommand(cmd);
                    if (res) successCount++;
                  }

                  if (successCount === rewards.length) {
                    await message.reply(`🎁 **Belohnung erfolgreich!**\n✅ ${player} hat alle Level ${level} Belohnungen erhalten (${rewards.length} Items)`);
                    remember(player, 'manual_reward', { level, timestamp: new Date().toISOString(), giver: message.author.tag });
                  } else {
                    await message.reply(`⚠️ **Teilweise erfolgreich**\n${successCount}/${rewards.length} Belohnungen für ${player} (Level ${level})`);
                  }
                } catch (error) {
                  await message.reply(`❌ **Fehler bei Belohnung**\nKonnte Belohnung für ${player} (Level ${level}) nicht vergeben`);
                }
              } else {
                await message.reply(`❌ **Ungültiges Level**\nLevel ${level} ist nicht konfiguriert. Verfügbare Level: 10, 20, 50, 100`);
              }
            } else {
              await message.reply("❓ **Falsche Syntax**\nNutze: `/ai belohnung [spielername] [level]`\nBeispiel: `/ai belohnung Max 50`");
            }
            return;
          }

          await message.reply("❓ Unbekannter AI-Command. Nutze `/ai help` für Hilfe.");
		  return;
      }
    }

    // 🔍 Server-Status und Command-Überprüfung
    if (content.toLowerCase().includes("check commands") || content.toLowerCase().includes("teste commands")) {
      try {
        // Teste RCON-Verbindung
        const rconTest = await sendRconCommand('GetServerInfo');
        const playersTest = await sendRconCommand('ListPlayers');

        const embed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('🔍 Command-System Status Check')
          .addFields(
            { name: '🔌 RCON Verbindung', value: rconTest ? '✅ Aktiv' : '❌ Fehler', inline: true },
            { name: '👥 Spieler-Abfrage', value: playersTest ? '✅ Funktioniert' : '❌ Fehler', inline: true },
            { name: '🤖 Smart Bot', value: '✅ Online', inline: true },
            { name: '📡 Discord Integration', value: '✅ Aktiv', inline: true },
            { name: '🧠 Memory System', value: `✅ ${Object.keys(memory).length} Einträge`, inline: true },
            { name: '🎁 Reward System', value: Object.keys(config.rewards || {}).length > 0 ? '✅ Konfiguriert' : '⚠️ Minimal', inline: true }
          )
          .setTimestamp();

        await message.reply({ embeds: [embed] });
        return;
      } catch (error) {
        await message.reply(`❌ **Command-System Fehler:**\n\`\`\`${error.message}\`\`\``);
        return;
      }
    }

    // 🔍 EOS System Test
    if (content.toLowerCase().includes("test eos") || content.toLowerCase().includes("teste eos")) {
      try {
        const players = await sendRconCommand('ListPlayers');
        let eosCount = 0;
        let validEosCount = 0;

        if (players && !players.includes('No Players Connected')) {
          const lines = players.split('\n');
          for (const line of lines) {
            const match = line.match(/(\d+)\.\s+([^,]+),\s+(\w+)/);
            if (match) {
              eosCount++;
              const eosId = match[3];
              if (eosId.length === 32 && eosId.match(/^[a-f0-9]+$/i)) {
                validEosCount++;
              }
            }
          }
        }

        const embed = new EmbedBuilder()
          .setColor(0x0099FF)
          .setTitle('🔍 EOS System Test')
          .addFields(
            { name: '👥 Spieler Online', value: eosCount.toString(), inline: true },
            { name: '✅ Gültige EOS IDs', value: validEosCount.toString(), inline: true },
            { name: '📊 EOS Erfolgsrate', value: eosCount > 0 ? `${((validEosCount/eosCount)*100).toFixed(1)}%` : 'N/A', inline: true },
            { name: '🔧 System Status', value: validEosCount === eosCount ? '✅ Alle IDs gültig' : '⚠️ Prüfung erforderlich', inline: false }
          )
          .setTimestamp();

        await message.reply({ embeds: [embed] });
        return;
      } catch (error) {
        await message.reply(`❌ **EOS Test Fehler:**\n\`\`\`${error.message}\`\`\``);
        return;
      }
    }

    // Einfache Begrüßungen
      if (lowerContent.includes("hallo") || lowerContent.includes("hi") || lowerContent.includes("hey")) {
        const greetings = [
          "🤖 Hallo! Wie kann ich dir helfen?",
          "👋 Hi! Brauchst du Hilfe mit dem ARK Server?",
          "🦖 Hallo Survivor! Was kann ich für dich tun?"
        ];
        await message.reply(greetings[Math.floor(Math.random() * greetings.length)]);
        hasResponded = true;
        return;
      }

      // Hilfe-Anfragen
      if (lowerContent.includes("help") || lowerContent.includes("hilfe")) {
        await message.reply("🆘 **Ich kann dir helfen bei:**\n• ARK Server-Problemen\n• Spieler-Commands\n• Allgemeine Fragen\n• Nutze `lerne:` um mir etwas beizubringen!");
        hasResponded = true;
        return;
      }

      // Dankbarkeit
      if (lowerContent.includes("danke") || lowerContent.includes("thanks")) {
        const thanks = [
          "😊 Gerne! Immer da für euch!",
          "🤖 Kein Problem! Dafür bin ich da!",
          "👍 Freut mich, dass ich helfen konnte!"
        ];
        await message.reply(thanks[Math.floor(Math.random() * thanks.length)]);
        hasResponded = true;
        return;
      }

    // AI Conversation für alle anderen Nachrichten (keine Commands)
      if (!content.startsWith('/') && !content.startsWith('!') && !hasResponded) {
        try {
          // Erweiterte Kontext-Informationen sammeln
          const userContext = {
            userId: message.author.id,
            username: message.author.username,
            userRole: message.member?.permissions.has('Administrator') ? 'owner' : 'player',
            channelType: message.channel.type,
            messageHistory: recall(message.author.username, 'recent_messages') || []
          };

          // Lerne aus der Interaktion
          remember(message.author.username, 'last_question', content);
          remember(message.author.username, 'last_interaction', new Date().toISOString());

          // Vorherige Interaktionen für Kontext
          const previousQuestions = recall(message.author.username, 'question_history') || [];
          previousQuestions.push(content);
          if (previousQuestions.length > 5) previousQuestions.shift();
          remember(message.author.username, 'question_history', previousQuestions);

          const contextInfo = {
            userRole: userContext.userRole,
            previousInteractions: previousQuestions.slice(-2).join('; '),
            userPreferences: recall(message.author.username, 'preferences') || {}
          };

          // Verwende AI-System für Antwort
          const { answerQuestion } = require('./ai.js');
          const baseResponse = await answerQuestion(content, contextInfo);

          // Personalisiere die Antwort
          const conversationStyler = new ConversationStyler();
          const personalizedResponse = conversationStyler.adaptResponseStyle(
            message.author.username, 
            baseResponse, 
            contextInfo
          );

          // Lerne aus der erfolgreichen Antwort
          remember(message.author.username, 'last_ai_response', personalizedResponse);
          remember(message.author.username, 'successful_interactions', 
            (recall(message.author.username, 'successful_interactions') || 0) + 1);

          await message.reply(`🤖 ${personalizedResponse}`);
          hasResponded = true;

        } catch (error) {
          console.error('AI Conversation Error:', error);

          // Fallback für AI-Fehler
          const fallbackResponses = [
            "Entschuldige! Gerade kann ich nicht richtig denken. Kannst du das nochmal fragen?",
            "Ups, da ist mir etwas durcheinander geraten! 🤖 Probier's nochmal.",
            "Sorry, meine AI hat gerade einen kleinen Aussetzer! Was wolltest du wissen?",
            "Oje, da ist etwas schiefgelaufen! Frag mich gerne nochmal."
          ];

          const randomFallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
          await message.reply(randomFallback);
          hasResponded = true;
        }
      }

  } catch (error) {
      console.error('❌ Fehler beim Verarbeiten der Nachricht:', error);
      if (!hasResponded) {
        await message.reply('❌ Sorry, ich konnte deine Nachricht nicht verarbeiten.');
      }
    }
});

// Fehlerbehandlung
client.on('error', (error) => {
  console.error('❌ Discord Client Fehler:', error);
});

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Smart Bot wird beendet...');
  client.destroy();
  process.exit(0);
});

// Bot starten
console.log('🔄 Verbinde mit Discord...');
client.login(token).catch(error => {
  console.error('❌ Discord Login fehlgeschlagen:', error);
  process.exit(1);
});