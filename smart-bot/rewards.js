
// 🎁 Smart Bot Belohnungs-System
// Konfiguration für automatische Level-Belohnungen

const rewardConfig = {
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

// Belohnungs-Beschreibungen für bessere Übersicht
const rewardDescriptions = {
  "10": "Stein-Bausatz (10x Steinwände + 10x Steinfundamente)",
  "20": "Metall-Starter-Pack (400x Metallbarren + Industriegrill)",
  "50": "Tek-Generator (High-End Stromversorgung)",
  "100": "Element-Paket (1000x Element für Tek-Technologie)"
};

// Verfügbare Level abrufen
function getAvailableLevels() {
  return Object.keys(rewardConfig).map(level => parseInt(level)).sort((a, b) => a - b);
}

// Belohnung für Level abrufen
function getRewardsForLevel(level) {
  return rewardConfig[level.toString()] || null;
}

// Beschreibung für Level abrufen
function getDescriptionForLevel(level) {
  return rewardDescriptions[level.toString()] || "Keine Beschreibung verfügbar";
}

// Prüfen ob Level Belohnung hat
function hasRewardForLevel(level) {
  return rewardConfig.hasOwnProperty(level.toString());
}

// Alle Belohnungen abrufen
function getAllRewards() {
  return rewardConfig;
}

// Neue Belohnung hinzufügen
function addReward(level, commands) {
  rewardConfig[level.toString()] = commands;
  return true;
}

// Belohnung entfernen
function removeReward(level) {
  if (rewardConfig[level.toString()]) {
    delete rewardConfig[level.toString()];
    delete rewardDescriptions[level.toString()];
    return true;
  }
  return false;
}

module.exports = {
  rewardConfig,
  rewardDescriptions,
  getAvailableLevels,
  getRewardsForLevel,
  getDescriptionForLevel,
  hasRewardForLevel,
  getAllRewards,
  addReward,
  removeReward
};
