const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'loyalty.json');

function loadData() {
  if (!fs.existsSync(FILE)) {
    return { users: {}, ranks: [] };
  }
  return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
}

function saveData(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function getUserData(telegramId) {
  const data = loadData();
  return data.users[telegramId];
}

function addToTotal(telegramId, username, amount) {
  const data = loadData();
  if (!data.users[telegramId]) {
    data.users[telegramId] = { username, total_spent: 0, manual_discount_percent: 0 };
  }
  data.users[telegramId].total_spent += amount;
  saveData(data);
}

function setManualDiscount(telegramId, percent) {
  const data = loadData();
  if (!data.users[telegramId]) {
    data.users[telegramId] = { username: '', total_spent: 0, manual_discount_percent: percent };
  } else {
    data.users[telegramId].manual_discount_percent = percent;
  }
  saveData(data);
}

function getPriceForUser(telegramId, basePrice) {
  const data = loadData();
  const user = data.users[telegramId] || { total_spent: 0, manual_discount_percent: 0 };
  const total = user.total_spent || 0;

  basePrice = Number(basePrice) || 0;
  let rank = data.ranks[0];

  for (const r of data.ranks) {
    if (total >= r.min_total) rank = r;
  }

  let discount = user.manual_discount_percent || rank.discount_percent;
  const discounted = Math.max(0, Math.round(basePrice * (1 - discount / 100)));

  // ищем следующий ранг
  let nextRank = null;
  for (const r of data.ranks) {
    if (r.min_total > total) {
      nextRank = r;
      break;
    }
  }

  const progressToNext = nextRank
    ? { need: nextRank.min_total - total, nextName: nextRank.rank_name }
    : null;

  return { 
    discountedPrice: discounted,
    rankName: rank.rank_name,
    discountPercent: discount,
    total,
    progressToNext
  };
}

module.exports = { 
  getUserData, 
  addToTotal, 
  setManualDiscount, 
  getPriceForUser 
};