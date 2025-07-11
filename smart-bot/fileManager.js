
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  getDataPath, 
  getConfigPath, 
  getLogsPath, 
  getCachePath, 
  getBackupsPath, 
  getTempPath,
  safeWriteFile,
  safeReadFile,
  createBackup 
} from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FileManager {
  constructor() {
    this.dataDir = getDataPath();
    this.configDir = getConfigPath();
    this.logsDir = getLogsPath();
    this.cacheDir = getCachePath();
    this.backupsDir = getBackupsPath();
    this.tempDir = getTempPath();
  }

  // Konfigurationsdateien
  saveConfig(name, data) {
    const filePath = getConfigPath(`${name}.json`);
    const content = JSON.stringify(data, null, 2);
    
    // Erstelle Backup der alten Konfiguration
    if (fs.existsSync(filePath)) {
      createBackup(filePath, `config-${name}-backup.json`);
    }
    
    return safeWriteFile(filePath, content);
  }

  loadConfig(name, defaultValue = null) {
    const filePath = getConfigPath(`${name}.json`);
    const content = safeReadFile(filePath);
    
    if (content) {
      try {
        return JSON.parse(content);
      } catch (error) {
        console.error(`❌ Fehler beim Parsen der Konfiguration ${name}:`, error);
        return defaultValue;
      }
    }
    
    return defaultValue;
  }

  // Datendateien
  saveData(name, data) {
    const filePath = getDataPath(`${name}.json`);
    const content = JSON.stringify(data, null, 2);
    return safeWriteFile(filePath, content);
  }

  loadData(name, defaultValue = null) {
    const filePath = getDataPath(`${name}.json`);
    const content = safeReadFile(filePath);
    
    if (content) {
      try {
        return JSON.parse(content);
      } catch (error) {
        console.error(`❌ Fehler beim Parsen der Daten ${name}:`, error);
        return defaultValue;
      }
    }
    
    return defaultValue;
  }

  // Cache-Funktionen
  setCache(key, data, ttl = 3600000) { // TTL in Millisekunden (default: 1 Stunde)
    const cacheData = {
      data: data,
      timestamp: Date.now(),
      ttl: ttl
    };
    
    const filePath = getCachePath(`${key}.cache`);
    const content = JSON.stringify(cacheData);
    return safeWriteFile(filePath, content);
  }

  getCache(key) {
    const filePath = getCachePath(`${key}.cache`);
    const content = safeReadFile(filePath);
    
    if (content) {
      try {
        const cacheData = JSON.parse(content);
        const now = Date.now();
        
        // Prüfe ob Cache noch gültig ist
        if (now - cacheData.timestamp < cacheData.ttl) {
          return cacheData.data;
        } else {
          // Cache abgelaufen, lösche Datei
          fs.unlinkSync(filePath);
          return null;
        }
      } catch (error) {
        console.error(`❌ Fehler beim Laden des Cache ${key}:`, error);
        return null;
      }
    }
    
    return null;
  }

  // Temp-Dateien
  createTempFile(name, content) {
    const timestamp = Date.now();
    const filename = `${name}-${timestamp}.tmp`;
    const filePath = getTempPath(filename);
    
    if (safeWriteFile(filePath, content)) {
      return filePath;
    }
    
    return null;
  }

  // Log-Funktionen
  writeLog(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    const logFile = getLogsPath(`smart-bot-${new Date().toISOString().split('T')[0]}.log`);
    
    return safeWriteFile(logFile, logEntry, { flag: 'a' });
  }

  // Dateisystem-Info
  getDirectoryInfo() {
    const info = {
      dataDir: this.dataDir,
      configDir: this.configDir,
      logsDir: this.logsDir,
      cacheDir: this.cacheDir,
      backupsDir: this.backupsDir,
      tempDir: this.tempDir,
      exists: {}
    };

    // Prüfe welche Ordner existieren
    Object.keys(info).forEach(key => {
      if (key !== 'exists' && typeof info[key] === 'string') {
        info.exists[key] = fs.existsSync(info[key]);
      }
    });

    return info;
  }

  // Aufräumfunktionen
  cleanOldLogs(daysToKeep = 7) {
    try {
      const files = fs.readdirSync(this.logsDir);
      const now = Date.now();
      const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

      files.forEach(file => {
        if (file.endsWith('.log') && file !== '.gitkeep') {
          const filePath = path.join(this.logsDir, file);
          const stats = fs.statSync(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Alte Log-Datei gelöscht: ${file}`);
          }
        }
      });
    } catch (error) {
      console.error('❌ Fehler beim Aufräumen der Logs:', error);
    }
  }

  cleanOldBackups(backupsToKeep = 10) {
    try {
      const files = fs.readdirSync(this.backupsDir);
      const backupFiles = files
        .filter(file => file.startsWith('backup-') && file !== '.gitkeep')
        .map(file => ({
          name: file,
          path: path.join(this.backupsDir, file),
          mtime: fs.statSync(path.join(this.backupsDir, file)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime);

      // Behalte nur die neuesten Backups
      if (backupFiles.length > backupsToKeep) {
        const filesToDelete = backupFiles.slice(backupsToKeep);
        
        filesToDelete.forEach(file => {
          fs.unlinkSync(file.path);
          console.log(`🗑️ Altes Backup gelöscht: ${file.name}`);
        });
      }
    } catch (error) {
      console.error('❌ Fehler beim Aufräumen der Backups:', error);
    }
  }
}

// Singleton-Instanz exportieren
export const fileManager = new FileManager();
export default fileManager;
