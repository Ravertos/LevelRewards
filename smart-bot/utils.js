
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatische Ordnerstruktur-Erstellung
export function ensureDirectoryStructure() {
  const requiredDirectories = [
    'logs',
    'data',
    'config',
    'modules',
    'cache',
    'backups',
    'temp'
  ];

  console.log('📁 Erstelle/Prüfe Ordnerstruktur...');

  requiredDirectories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Ordner erstellt: ${dir}/`);
        
        // Erstelle .gitkeep Datei für leere Ordner
        const gitkeepPath = path.join(dirPath, '.gitkeep');
        if (!fs.existsSync(gitkeepPath)) {
          fs.writeFileSync(gitkeepPath, '# Dieser Ordner wird für Smart Bot benötigt\n');
        }
      } catch (error) {
        console.error(`❌ Fehler beim Erstellen von ${dir}:`, error.message);
      }
    } else {
      console.log(`✅ Ordner existiert: ${dir}/`);
    }
  });

  console.log('📁 Ordnerstruktur-Check abgeschlossen!');
}

// Verbesserte Pfad-Funktionen
export function getDataPath(filename = '') {
  const dataDir = path.join(__dirname, 'data');
  return filename ? path.join(dataDir, filename) : dataDir;
}

export function getConfigPath(filename = '') {
  const configDir = path.join(__dirname, 'config');
  return filename ? path.join(configDir, filename) : configDir;
}

export function getLogsPath(filename = '') {
  const logsDir = path.join(__dirname, 'logs');
  return filename ? path.join(logsDir, filename) : logsDir;
}

export function getCachePath(filename = '') {
  const cacheDir = path.join(__dirname, 'cache');
  return filename ? path.join(cacheDir, filename) : cacheDir;
}

export function getBackupsPath(filename = '') {
  const backupsDir = path.join(__dirname, 'backups');
  return filename ? path.join(backupsDir, filename) : backupsDir;
}

export function getTempPath(filename = '') {
  const tempDir = path.join(__dirname, 'temp');
  return filename ? path.join(tempDir, filename) : tempDir;
}

// Sichere Datei-Operationen
export function safeWriteFile(filePath, content, options = {}) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, content, options);
    return true;
  } catch (error) {
    console.error(`❌ Fehler beim Schreiben von ${filePath}:`, error.message);
    return false;
  }
}

export function safeReadFile(filePath, options = { encoding: 'utf8' }) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Datei nicht gefunden: ${filePath}`);
      return null;
    }
    
    return fs.readFileSync(filePath, options);
  } catch (error) {
    console.error(`❌ Fehler beim Lesen von ${filePath}:`, error.message);
    return null;
  }
}

export function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export function formatMemoryUsage(bytes) {
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
}

export function createEmbed(title, description, color = 0x0099ff) {
  return {
    color: color,
    title: title,
    description: description,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Smart Bot v2.0'
    }
  };
}

export function logToFile(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  
  try {
    const logFile = getLogsPath(`smart-bot-${new Date().toISOString().split('T')[0]}.log`);
    
    // Verwende sichere Schreibfunktion
    safeWriteFile(logFile, logEntry, { flag: 'a' });
  } catch (error) {
    console.error('❌ Fehler beim Schreiben der Log-Datei:', error);
  }
}

export function validateConfig(config) {
  const required = ['discord_token'];
  const missing = required.filter(field => !config[field]);
  
  if (missing.length > 0) {
    throw new Error(`Fehlende Konfiguration: ${missing.join(', ')}`);
  }
  
  return true;
}

// Cache-Management
export function clearCache() {
  try {
    const cacheDir = getCachePath();
    if (fs.existsSync(cacheDir)) {
      const files = fs.readdirSync(cacheDir);
      files.forEach(file => {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(cacheDir, file));
        }
      });
      console.log('✅ Cache geleert');
    }
  } catch (error) {
    console.error('❌ Fehler beim Leeren des Cache:', error);
  }
}

// Backup-Funktionen
export function createBackup(sourceFile, backupName = null) {
  try {
    if (!fs.existsSync(sourceFile)) {
      return false;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = backupName || `backup-${path.basename(sourceFile)}-${timestamp}`;
    const backupPath = getBackupsPath(fileName);
    
    fs.copyFileSync(sourceFile, backupPath);
    console.log(`✅ Backup erstellt: ${fileName}`);
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Backups:', error);
    return false;
  }
}

// Temp-Dateien aufräumen
export function cleanTempFiles() {
  try {
    const tempDir = getTempPath();
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => {
        if (file !== '.gitkeep') {
          const filePath = path.join(tempDir, file);
          const stats = fs.statSync(filePath);
          const now = Date.now();
          const fileAge = now - stats.mtime.getTime();
          
          // Lösche Temp-Dateien älter als 1 Stunde
          if (fileAge > 3600000) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Temp-Datei gelöscht: ${file}`);
          }
        }
      });
    }
  } catch (error) {
    console.error('❌ Fehler beim Aufräumen der Temp-Dateien:', error);
  }
}
