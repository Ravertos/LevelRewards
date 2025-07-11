

const templates = {
  levelUp: [
    "🎉 Großartig gemacht, {player}! Du bist jetzt Level {level}!",
    "🦖 {player} hat soeben Level {level} erreicht – Respekt!",
    "🏆 {player}, du wirst immer stärker. Willkommen auf Level {level}!",
    "⚡ {player} levelt wie ein Profi! Level {level} ist geschafft!",
    "🔥 {player} brennt heute richtig! Level {level} erreicht!",
    "🌟 Ein neuer Stern am ARK-Himmel: {player} Level {level}!"
  ],
  death: [
    "💀 Oof! {player} hat es erwischt… bleib stark!",
    "⚰️ RIP {player}. Die Dinos waren stärker… diesmal.",
    "☠️ {player} ist gefallen… aber wird zurückkommen!",
    "🪦 {player} hat den Kampf verloren, aber nie den Mut!",
    "💥 {player} wurde von der ARK-Realität eingeholt…",
    "🦕 Die Dinos feiern, {player} respawnt gleich wieder!"
  ],
  achievement: [
    "🏆 {player} hat {achievement} freigeschaltet! Legendär!",
    "🎖️ Achievement unlocked: {player} → {achievement}!",
    "⭐ {player} sammelt Erfolge wie ein Profi: {achievement}!",
    "🥇 {player} hat {achievement} gemeistert! Respekt!",
    "🎯 Volltreffer! {player} erreicht {achievement}!"
  ],
  tame: [
    "🦖 {player} hat {dino} gezähmt! Ein neuer Begleiter!",
    "🎯 Perfekt! {player} und {dino} sind jetzt ein Team!",
    "🤝 {player} hat {dino} überzeugt – Freundschaft fürs Leben!",
    "✨ {player} hat {dino} erfolgreich gezähmt! Glückwunsch!",
    "🦕 {dino} folgt jetzt {player} überall hin!"
  ],
  talk: [
    "🗨️ {player} sagt: {message}",
    "💬 {player} meint: {message}",
    "🎙️ {player} spricht: {message}",
    "📢 {player} verkündet: {message}",
    "🗣️ {player} teilt mit: {message}"
  ],
  join: [
    "🎮 {player} betritt die ARK! Willkommen im Überlebenskampf!",
    "👋 Hallo {player}! Bereit für das Abenteuer?",
    "🌍 {player} ist der ARK beigetreten. Viel Erfolg beim Überleben!",
    "🚀 {player} startet das große Abenteuer!",
    "🎊 {player} ist da! Die ARK wird lebendiger!"
  ],
  leave: [
    "👋 {player} verlässt die ARK. Bis zum nächsten Mal!",
    "🚪 {player} ist offline gegangen. Wir sehen uns wieder!",
    "😢 {player} hat uns verlassen… komm gut nach Hause!",
    "🌅 {player} beendet das Abenteuer für heute.",
    "💤 {player} geht schlafen. Träum von Dinos!"
  ],
  build: [
    "🏗️ {player} baut wie ein Architekt! {structure} errichtet!",
    "🔨 {player} hat {structure} gebaut. Impressive!",
    "🏠 {player} erweitert die Basis: {structure} fertiggestellt!",
    "⚒️ Baumeister {player} hat {structure} erschaffen!"
  ],
  craft: [
    "🔧 {player} hat {item} gecraftet! Handwerkskunst!",
    "⚙️ {player} ist fleißig: {item} hergestellt!",
    "🛠️ {player} craftet wie ein Profi: {item} ready!",
    "✨ {player} hat {item} erfolgreich hergestellt!"
  ],
  pvp: [
    "⚔️ {player} dominiert im PvP! {enemy} wurde besiegt!",
    "🥊 {player} vs {enemy} – {player} gewinnt!",
    "🏆 {player} hat {enemy} im Kampf überwältigt!",
    "💪 {player} zeigt {enemy} wer der Boss ist!"
  ],
  tribe: [
    "🤝 {player} ist {tribe} beigetreten! Welcome to the family!",
    "👥 {tribe} hat ein neues Mitglied: {player}!",
    "🏘️ {player} verstärkt jetzt {tribe}!",
    "🎉 {tribe} wächst: {player} ist dabei!"
  ],
  discover: [
    "🗺️ {player} hat {location} entdeckt! Entdecker-Spirit!",
    "🔍 {player} erkundet {location} – mutig!",
    "🌟 {player} hat {location} gefunden! Abenteurer!",
    "🏞️ {player} entdeckt die Geheimnisse von {location}!"
  ],
  boss: [
    "🔥 {player} hat {boss} besiegt! LEGENDARY!",
    "👑 {player} ist der neue Boss-Killer: {boss} defeated!",
    "⚡ {player} vs {boss} – EPISCHER SIEG!",
    "🏆 {player} hat {boss} zur Strecke gebracht!"
  ],
  resource: [
    "⛏️ {player} sammelt fleißig {resource}! Grinder-Mode!",
    "💎 {player} hat {resource} abgebaut. Produktiv!",
    "🪨 {player} farmt {resource} wie ein Profi!",
    "⚒️ {player} sammelt {resource} für große Projekte!"
  ],
  weather: [
    "🌩️ Sturm im Anmarsch! {player}, such dir Schutz!",
    "🌡️ Hitzewelle! {player} braucht Kühlung!",
    "🌨️ Kälteschock! {player}, wärm dich auf!",
    "⛈️ Gewitter! {player}, pass auf die Elektronik auf!"
  ],
  event: [
    "🎃 Halloween Event! {player} sammelt spooky Rewards!",
    "🎄 Weihnachts-Event! {player} findet festliche Geschenke!",
    "💝 Valentinstag! {player} und die Dinos feiern Liebe!",
    "🥚 Oster-Event! {player} sucht bunte Eier!"
  ],
  funny: [
    "😂 {player} macht Quatsch und alle lachen!",
    "🤪 {player} ist heute besonders verrückt!",
    "🎭 {player} entertaint die ganze Server-Community!",
    "😁 {player} sorgt für gute Stimmung auf dem Server!"
  ],
  motivational: [
    "💪 {player}, du schaffst das! Weitermachen!",
    "🌟 {player} ist auf dem richtigen Weg zum Erfolg!",
    "🔥 {player} brennt für ARK – diese Leidenschaft!",
    "⚡ {player} hat Power ohne Ende! Unstoppable!"
  ],
  night: [
    "🌙 {player} überlebt die Nacht. Respekt!",
    "🔦 {player} kämpft sich durch die Dunkelheit!",
    "🌃 {player} baut nachts weiter – Workaholic!",
    "🦇 {player} und die Nacht-Dinos verstehen sich!"
  ],
  morning: [
    "🌅 {player} begrüßt den neuen Tag auf ARK!",
    "☀️ {player} startet energisch in den Morgen!",
    "🐓 {player} ist früh dran – Frühaufsteher!",
    "🌄 {player} genießt den Sonnenaufgang über der ARK!"
  ]
};

function getRandomResponse(type, context = {}) {
  const options = templates[type];
  if (!options) return null;

  // Spezielle Logik für verschiedene Event-Typen
  let selectedTemplate;

  switch(type) {
    case 'levelUp':
      // Besondere Nachrichten für Milestone-Level
      if (context.level && [10, 20, 25, 50, 75, 100].includes(parseInt(context.level))) {
        const milestoneTemplates = [
          "🎊 MILESTONE! {player} hat Level {level} erreicht! Das verdient eine Belohnung!",
          "🏆 LEGENDARY! {player} Level {level} – ein wahrer ARK-Meister!",
          "⭐ SPECIAL LEVEL! {player} ist jetzt Level {level} – incredible!"
        ];
        selectedTemplate = milestoneTemplates[Math.floor(Math.random() * milestoneTemplates.length)];
      } else {
        selectedTemplate = options[Math.floor(Math.random() * options.length)];
      }
      break;

    case 'death':
      // Verschiedene Nachrichten je nach Todesursache
      if (context.killer && context.killer.includes('Dragon')) {
        selectedTemplate = "🐉 {player} wurde von einem Dragon besiegt! Das ist keine Schande!";
      } else if (context.killer && context.killer.includes('Rex')) {
        selectedTemplate = "🦖 {player} vs T-Rex – manchmal gewinnt halt der Rex!";
      } else {
        selectedTemplate = options[Math.floor(Math.random() * options.length)];
      }
      break;

    case 'tame':
      // Spezielle Nachrichten für seltene Dinos
      if (context.dino && (context.dino.includes('Rex') || context.dino.includes('Dragon'))) {
        selectedTemplate = "🔥 EPIC TAME! {player} hat {dino} gezähmt! Das ist LEGENDARY!";
      } else {
        selectedTemplate = options[Math.floor(Math.random() * options.length)];
      }
      break;

    default:
      selectedTemplate = options[Math.floor(Math.random() * options.length)];
  }

  // Ersetze alle Platzhalter
  return selectedTemplate.replace(/{(\w+)}/g, (_, key) => {
    if (context[key]) return context[key];
    
    // Fallback-Werte für fehlende Kontexte
    const fallbacks = {
      player: 'Survivor',
      level: 'X',
      dino: 'unknown creature',
      achievement: 'something amazing',
      structure: 'something epic',
      item: 'something useful',
      enemy: 'opponent',
      tribe: 'a tribe',
      location: 'somewhere new',
      boss: 'a mighty boss',
      resource: 'resources',
      message: 'something important'
    };

    return fallbacks[key] || `{${key}}`;
  });
}

module.exports = { getRandomResponse, templates };
