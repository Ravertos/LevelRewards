import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import config from './config.js';
import { handleEvent } from './eventHandler.js';

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ] 
});

let isReady = false;

client.once('ready', () => {
  console.log(`✅ Discord-Bot online: ${client.user.tag}`);
  isReady = true;

  // Status setzen
  client.user.setActivity('Smart Bot - AI für ARK Server', { type: 3 }); // WATCHING = 3

  // Willkommensnachricht senden
  const channel = client.channels.cache.get(config.discord_channel_id);
  if (channel) {
    const embed = new EmbedBuilder()
      .setColor(0x00AE86)
      .setTitle('🤖 Smart Bot ist online!')
      .setDescription('Intelligenter AI-Assistent für ARK: Survival Ascended Server ist bereit!')
      .addFields(
        { name: '💬 Wie nutzen?', value: 'Schreibt einfach eine Nachricht oder Frage in diesen Kanal', inline: true },
        { name: '🔧 AI-Hilfe', value: 'Ich helfe bei Server-Problemen, Fehlern und Fragen', inline: true },
        { name: '🛠️ RCON', value: 'Überwache Server-Status und analysiere Logs', inline: true }
      )
      .setFooter({ text: 'Smart Bot v2.0 - Powered by DeepSeek AI' })
      .setTimestamp();

    channel.send({ embeds: [embed] });
  }
});

client.on('messageCreate', async (message) => {
  // Ignoriere Bot-Nachrichten und falsche Kanäle
  if (message.author.bot || message.channel.id !== config.discord_channel_id) {
    return;
  }

  // Ignore andere Slash-Commands
  if (message.content.startsWith('/') && !message.content.startsWith('/ai')) {
    return;
  }

  try {
    console.log(`[Discord] Verarbeite Nachricht von ${message.author.tag}: ${message.content}`);

    // Typing-Indikator
    await message.channel.sendTyping();

    // Frage an AI weiterleiten
    const reply = await handleEvent({ 
      type: "user_question", 
      content: message.content,
      source: `Discord:${message.author.tag}`
    });

    if (reply) {
      // Kurze Antworten direkt, längere als Embed
      if (reply.length <= 200) {
        await message.reply(`🤖 ${reply}`);
      } else {
        const embed = new EmbedBuilder()
          .setColor(0x00AE86)
          .setTitle('🤖 Smart Bot Antwort')
          .setDescription(reply)
          .setFooter({ 
            text: `Antwort für ${message.author.tag}`, 
            iconURL: message.author.displayAvatarURL() 
          })
          .setTimestamp();

        await message.reply({ embeds: [embed] });
      }
    }

  } catch (error) {
    console.error('[Discord] Fehler beim Verarbeiten der Nachricht:', error);
    await message.reply('❌ Entschuldigung, ich konnte deine Nachricht nicht verarbeiten.');
  }
});

client.on('error', (error) => {
  console.error('[Discord] Client-Fehler:', error);
});

export function sendToDiscord(content, type = 'info') {
  if (!isReady) {
    console.warn('[Discord] Bot ist noch nicht bereit');
    return;
  }

  try {
    const channel = client.channels.cache.get(config.discord_channel_id);
    if (!channel) {
      console.error('[Discord] Kanal nicht gefunden:', config.discord_channel_id);
      return;
    }

    const colors = {
      info: 0x3498db,
      warning: 0xf39c12,
      error: 0xe74c3c,
      success: 0x2ecc71
    };

    const icons = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      success: '✅'
    };

    if (content.length <= 200) {
      channel.send(`${icons[type] || '🤖'} ${content}`);
    } else {
      const embed = new EmbedBuilder()
        .setColor(colors[type] || colors.info)
        .setTitle('🤖 Smart Bot')
        .setDescription(content)
        .setTimestamp();

      channel.send({ embeds: [embed] });
    }

  } catch (error) {
    console.error('[Discord] Fehler beim Senden:', error);
  }
}

export function startDiscordBot() {
  if (!config.discord_token) {
    console.error('❌ Discord Token nicht gefunden! Bitte DISCORD_TOKEN in Secrets setzen.');
    return;
  }

  if (!config.discord_channel_id) {
    console.error('❌ Discord Channel ID nicht gefunden! Bitte DISCORD_CHANNEL_ID in Secrets setzen.');
    return;
  }

  console.log('🔄 Starte Discord Bot...');
  client.login(config.discord_token).catch(error => {
    console.error('❌ Discord Login fehlgeschlagen:', error);
  });
}