` tags:

```text
// Load Discord token from Replit Secrets and update configurations.
<replit_final_file>
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { fileManager } from './fileManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lade .env Datei
dotenv.config({ path: join(__dirname, '.env') });

// Sichere Konfiguration aus .env Datei
const defaultConfig = {
  deepseek_api_key: process.env.DEEPSEEK_API_KEY || '',
  deepseek_model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  deepseek_api_url: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
  discord_token: process.env.DISCORD_TOKEN || '',
  discord_channel_id: process.env.DISCORD_CHANNEL_ID || '1225897570424844329',
  rcon_host: process.env.RCON_HOST || '31.214.216.149',
  rcon_port: parseInt(process.env.RCON_PORT) || 11030,
  rcon_password: process.env.RCON_PASSWORD || '',
  backup_rcon_host: process.env.BACKUP_RCON_HOST || '',
  backup_rcon_port: parseInt(process.env.BACKUP_RCON_PORT) || 11990,
  system_prompt: process.env.SYSTEM_PROMPT || 'Du bist Smart Bot - ein intelligenter AI-Assistent für ARK: Survival Ascended Server. Du hilfst bei Server-Problemen, RCON-Befehlen, Mod-Installation und technischen Fragen. Du bist freundlich, kompetent und gibst präzise Lösungen.',
  max_message_history: parseInt(process.env.MAX_MESSAGE_HISTORY) || 50,
  ai_enabled: process.env.AI_ENABLED !== 'false',
  debug_mode: process.env.DEBUG_MODE === 'true',
  continuous_feedback: process.env.CONTINUOUS_FEEDBACK === 'true',
  discord_command_integration: process.env.DISCORD_COMMAND_INTEGRATION === 'true',
  auto_execute_commands: process.env.AUTO_EXECUTE_COMMANDS === 'true',
  proactive_suggestions: process.env.PROACTIVE_SUGGESTIONS === 'true',
  command_execution_delay: parseInt(process.env.COMMAND_EXECUTION_DELAY) || 2000,
  auto_repair_enabled: process.env.AUTO_REPAIR_ENABLED === 'true',
  player_welcome_enabled: process.env.PLAYER_WELCOME_ENABLED === 'true',
  performance_optimization_enabled: process.env.PERFORMANCE_OPTIMIZATION_ENABLED === 'true'
};

let config = defaultConfig;

// Versuche config.json zu laden
try {
  const configPath = join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    const configFile = fs.readFileSync(configPath, 'utf8');
    const jsonConfig = JSON.parse(configFile);
    config = { ...defaultConfig, ...jsonConfig };
    console.log('✅ Config.json erfolgreich geladen');
  } else {
    console.log('⚠️ Config.json nicht gefunden, verwende Umgebungsvariablen');
  }
} catch (error) {
  console.error('❌ Fehler beim Laden der config.json:', error);
  console.log('📦 Verwende Fallback-Konfiguration');
}

// Validiere kritische Einstellungen aus .env
console.log('🔍 Validiere Umgebungsvariablen...');

if (!config.discord_token) {
  console.error('❌ DISCORD_TOKEN fehlt in .env Datei!');
  console.error('💡 Bitte DISCORD_TOKEN in .env eintragen');
}

if (!config.deepseek_api_key) {
  console.warn('⚠️ DEEPSEEK_API_KEY fehlt in .env - AI-Funktionen deaktiviert');
  config.ai_enabled = false;
} else {
  console.log('✅ DeepSeek API Key: Geladen aus .env');
}

if (!config.rcon_password) {
  console.warn('⚠️ RCON_PASSWORD fehlt in .env - RCON deaktiviert');
}

console.log('✅ Konfiguration erfolgreich aus .env geladen');

export default config;