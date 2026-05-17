const EDITION_PATTERN = /^(.+?) \(([^()]+)\)$/;
const EDITION_PRIORITY = {
  "Standard Edition": 1,
  "Deluxe Edition": 2,
  "Ultimate Edition": 3,
};

function splitGameTitle(name) {
  const match = name.match(EDITION_PATTERN);
  if (!match) return [name, ""];
  return [match[1], match[2]];
}

function groupGamesByBase(games) {
  const grouped = {};
  for (const game of games) {
    const [baseName, edition] = splitGameTitle(game.name);
    if (!grouped[baseName]) grouped[baseName] = [];
    grouped[baseName].push({ game, edition });
  }
  for (const baseName of Object.keys(grouped)) {
    grouped[baseName].sort((a, b) => {
      const pa = EDITION_PRIORITY[a.edition] ?? 99;
      const pb = EDITION_PRIORITY[b.edition] ?? 99;
      if (pa !== pb) return pa - pb;
      return a.game.id - b.game.id;
    });
  }
  return grouped;
}

function buildCatalogEntries(games) {
  const grouped = groupGamesByBase(games);
  const entries = [];
  for (const [baseName, versions] of Object.entries(grouped)) {
    const representative = versions[0].game;
    const prices = versions.map((v) => v.game.price);
    entries.push({
      base_name: baseName,
      game: representative,
      versions_count: versions.length,
      min_price: Math.min(...prices),
      max_price: Math.max(...prices),
    });
  }
  return entries;
}

function buildAdminGameCards(games) {
  const grouped = groupGamesByBase(games);
  const cards = [];
  for (const [baseName, versions] of Object.entries(grouped)) {
    const representative = versions[0].game;
    const prices = versions.map((v) => v.game.price);
    cards.push({
      game_id: representative.id,
      base_name: baseName,
      versions_count: versions.length,
      min_price: Math.min(...prices),
      max_price: Math.max(...prices),
    });
  }
  cards.sort((a, b) => a.game_id - b.game_id);
  cards.forEach((card, index) => {
    card.card_id = index + 1;
  });
  return cards;
}

function getVersionsForBase(games, baseName) {
  return games
    .filter((g) => {
      const [base] = splitGameTitle(g.name);
      return base === baseName;
    })
    .sort((a, b) => a.id - b.id);
}

function formatPrice(value) {
  return `${Number(value).toFixed(2)} ₽`;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function isValidEmail(email) {
  return /^[\w.-]+@[\w.-]+\.\w+$/.test(email);
}
