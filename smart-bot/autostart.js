import { spawn } from 'child_process';
import { watch } from 'fs';
import path from 'path';

class AutoStartSystem {
  constructor() {
    this.processes = new Map();
    this.restartCount = 0;
    this.maxRestarts = 10;
    this.restartDelay = 5000; // 5 seconds
    this.watchedFiles = [
      'config.json',
      'index.js',
      'ai.js',
      'discord.js',
      'rcon.js',
      'eventHandler.js',
      'continuousFeedback.js'
    ];
    this.isRestarting = false;
  }

  async startSystem() {
    console.log('🚀 Auto-Start System wird initialisiert...');

    // Starte File Watcher
    this.setupFileWatcher();

    // Starte Smart Bot
    await this.startSmartBot();

    // Überwache Prozesse
    this.monitorProcesses();

    console.log('✅ Auto-Start System aktiv - Überwacht alle Komponenten');
  }

  startSmartBot() {
    if (this.isRestarting) return;

    console.log('🚀 Starte Smart Bot System mit Discord-Command-Recovery...');

    try {
      // Forced NPM install with auto-yes
      const installProcess = spawn('npm', ['install', '--yes', '--silent'], {
        cwd: './smart-bot',
        stdio: 'inherit'
      });

      installProcess.on('close', (code) => {
        console.log(`📦 NPM Install completed with code: ${code}`);

        const smartBotProcess = spawn('npm', ['start'], {
          cwd: './smart-bot',
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, NODE_ENV: 'production', FORCE_COLOR: '1' }
        });

        const processInfo = {
          name: 'Smart Bot',
          process: smartBotProcess,
          startTime: Date.now(),
          restarts: 0,
          lastDiscordCommand: null,
          commandHistory: []
        };

        this.processes.set('smart-bot', processInfo);

        smartBotProcess.stdout.on('data', (data) => {
          const message = data.toString();
          console.log(`🤖 Smart Bot Output: ${message}`);
          // Logik, um Discord-Befehle zu erkennen und zu speichern
        });

        smartBotProcess.stderr.on('data', (data) => {
          console.error(`❌ Smart Bot Error: ${data}`);
        });

        smartBotProcess.on('exit', (code) => {
          console.log(`⚠️ Smart Bot beendet mit Code: ${code}`);
          this.handleProcessExit('smart-bot', code);
        });

        smartBotProcess.on('error', (error) => {
          console.error('❌ Smart Bot Fehler:', error);
          this.handleProcessError('smart-bot', error);
        });
      });
    } catch (error) {
      console.error('❌ Fehler beim Starten des Smart Bots:', error);
    }
  }

  setupFileWatcher() {
    console.log('👁️ File Watcher wird aktiviert...');

    this.watchedFiles.forEach(filename => {
      const filePath = path.join(process.cwd(), filename);

      try {
        watch(filePath, { persistent: true }, (eventType) => {
          if (eventType === 'change' && !this.isRestarting) {
            console.log(`📝 Datei geändert: ${filename} - Neustart wird eingeleitet...`);
            this.scheduleRestart();
          }
        });
        console.log(`👁️ Überwache: ${filename}`);
      } catch (error) {
        console.log(`⚠️ Kann ${filename} nicht überwachen:`, error.message);
      }
    });
  }

  scheduleRestart() {
    if (this.isRestarting) return;

    this.isRestarting = true;
    console.log('🔄 Automatischer Neustart in 3 Sekunden...');

    setTimeout(async () => {
      await this.restartSystem();
      this.isRestarting = false;
    }, 3000);
  }

  async restartSystem() {
    console.log('🔄 System wird neu gestartet...');

    // Stoppe alle Prozesse
    for (const [name, processInfo] of this.processes.entries()) {
      this.stopProcess(name);
    }

    // Warte kurz
    await this.delay(2000);

    // Starte Smart Bot neu
    await this.startSmartBot();

    this.restartCount++;
    console.log(`✅ System erfolgreich neu gestartet (${this.restartCount}x)`);
  }

  handleProcessExit(processName, exitCode) {
    const processInfo = this.processes.get(processName);
    if (!processInfo) return;

    if (exitCode !== 0 && !this.isRestarting) {
      console.log(`⚠️ ${processInfo.name} unerwartet beendet - Automatischer Neustart...`);

      if (processInfo.restarts < this.maxRestarts) {
        processInfo.restarts++;
        setTimeout(() => {
          this.startSmartBot();
        }, this.restartDelay);
      } else {
        console.error(`❌ ${processInfo.name} zu oft neu gestartet - Stoppe Auto-Restart`);
      }
    }
  }

  handleProcessError(processName, error) {
    const processInfo = this.processes.get(processName);
    if (!processInfo) return;

    console.error(`❌ ${processInfo.name} Fehler:`, error.message);

    if (!this.isRestarting) {
      console.log('🔄 Automatischer Neustart aufgrund von Fehler...');
      this.scheduleRestart();
    }
  }

  stopProcess(processName) {
    const processInfo = this.processes.get(processName);
    if (!processInfo) return;

    console.log(`🛑 Stoppe ${processInfo.name}...`);

    try {
      processInfo.process.kill('SIGTERM');
      setTimeout(() => {
        if (!processInfo.process.killed) {
          processInfo.process.kill('SIGKILL');
        }
      }, 5000);
    } catch (error) {
      console.error(`❌ Fehler beim Stoppen von ${processInfo.name}:`, error.message);
    }

    this.processes.delete(processName);
  }

  monitorProcesses() {
    setInterval(() => {
      console.log('💓 System Health Check...');

      for (const [name, processInfo] of this.processes.entries()) {
        const uptime = Math.floor((Date.now() - processInfo.startTime) / 1000);
        console.log(`✅ ${processInfo.name}: Läuft seit ${uptime}s (${processInfo.restarts} Neustarts)`);
      }

      // Überprüfe ob Prozesse noch laufen
      for (const [name, processInfo] of this.processes.entries()) {
        if (processInfo.process.killed) {
          console.log(`⚠️ ${processInfo.name} ist nicht mehr aktiv - Neustart...`);
          this.handleProcessExit(name, 1);
        }
      }
    }, 30000); // Alle 30 Sekunden
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async shutdown() {
    console.log('🛑 Auto-Start System wird heruntergefahren...');

    for (const [name] of this.processes.entries()) {
      this.stopProcess(name);
    }

    console.log('✅ Auto-Start System beendet');
  }
}

// Starte das Auto-Start System
const autoStart = new AutoStartSystem();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutdown Signal erhalten...');
  await autoStart.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Termination Signal erhalten...');
  await autoStart.shutdown();
  process.exit(0);
});

// Starte das System
autoStart.startSystem().catch(error => {
  console.error('❌ Fehler beim Starten des Auto-Start Systems:', error);
  process.exit(1);
});
```