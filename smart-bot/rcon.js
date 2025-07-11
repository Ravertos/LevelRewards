const Rcon = require('rcon');
require('dotenv').config();

const rcon = new Rcon(
  process.env.RCON_HOST,
  parseInt(process.env.RCON_PORT),
  process.env.RCON_PASSWORD
);

rcon.on('auth', () => {
  console.log('✅ RCON verbunden.');
}).on('error', (err) => {
  console.error('❌ RCON Fehler:', err);
});

function sendRconCommand(cmd) {
  return new Promise((resolve, reject) => {
    rcon.connect();
    rcon.on('auth', () => {
      rcon.send(cmd);
    });
    rcon.on('response', (res) => {
      resolve(res);
      rcon.disconnect();
    });
    rcon.on('error', (err) => {
      reject(err);
    });
  });
}

// RCON Manager für bessere Verwaltung
class RCONManager {
  constructor() {
    this.connected = false;
    this.rcon = new Rcon(
      process.env.RCON_HOST,
      parseInt(process.env.RCON_PORT),
      process.env.RCON_PASSWORD
    );

    this.rcon.on('auth', () => {
      console.log('✅ RCON Manager verbunden');
      this.connected = true;
    });

    this.rcon.on('error', (err) => {
      console.error('❌ RCON Manager Fehler:', err);
      this.connected = false;
    });
  }

  async connect() {
    if (!this.connected) {
      return new Promise((resolve, reject) => {
        this.rcon.connect();
        this.rcon.on('auth', () => {
          this.connected = true;
          resolve(true);
        });
        this.rcon.on('error', (err) => {
          this.connected = false;
          reject(err);
        });
      });
    }
    return true;
  }

  async sendCommand(command) {
    try {
      if (!this.connected) {
        await this.connect();
      }

      return new Promise((resolve, reject) => {
        this.rcon.send(command);
        this.rcon.on('response', (response) => {
          console.log(`📤 RCON: ${command}`);
          console.log(`📥 Response: ${response}`);
          resolve(response);
        });
        this.rcon.on('error', (err) => {
          reject(err);
        });
      });
    } catch (error) {
      console.error('❌ RCON Command Fehler:', error);
      throw error;
    }
  }

  disconnect() {
    if (this.rcon) {
      this.rcon.disconnect();
      this.connected = false;
    }
  }
}

// Globaler RCON Manager
const rconManager = new RCONManager();

// Test-Funktion
async function testRCON() {
  try {
    console.log('🔍 Teste RCON Verbindung...');
    const response = await sendRconCommand('ListPlayers');
    console.log('✅ RCON Test erfolgreich:', response);
    return true;
  } catch (error) {
    console.error('❌ RCON Test fehlgeschlagen:', error);
    return false;
  }
}

module.exports = { 
  sendRconCommand, 
  RCONManager, 
  rconManager, 
  testRCON 
};