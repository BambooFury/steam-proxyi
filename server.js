const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/specials', async (req, res) => {
  try {
    const steamURL = 'https://store.steampowered.com/api/featuredcategories?cc=ua&l=russian';
    const response = await fetch(steamURL);
    const data = await response.json();

    const games = data.specials?.items || [];
    const seenAppIds = new Set(); // Используем Set для отслеживания appid
    const uniqueGames = [];

    for (const game of games) {
      if (game.discount_percent <= 0) continue;
      
      // Проверяем дубликаты по appid
      if (seenAppIds.has(game.id)) continue;

      seenAppIds.add(game.id); // Регистрируем новый appid
      
      uniqueGames.push({
        appid: game.id.toString(),
        name: game.name,
        img: game.header_image,
        old: game.original_price || 0,
        new: game.final_price || 0,
        discount: game.discount_percent,
        url: `https://store.steampowered.com/app/${game.id}/`
      });
    }

    res.json(uniqueGames);
  } catch (err) {
    console.error('Ошибка при загрузке specials:', err);
    res.status(500).json({ error: 'Ошибка загрузки скидок' });
  }
});

app.get('/specials', async (req, res) => {
  try {
    const steamURL = 'https://store.steampowered.com/api/featuredcategories?cc=ua&l=russian';
    const response = await fetch(steamURL);
    const data = await response.json();

    const games = data.specials?.items || [];

    // 🔍 Удаляем дубликаты по IMG (header_image) — 100% надёжно
    // В обработчике данных
const seen = new Set();
const uniqueGames = data.filter(item => {
  if (seen.has(item.appid)) {
    console.warn("Обнаружен дубликат:", item.appid);
    return false;
  }
  seen.add(item.appid);
  return true;
});
      uniqueGames.push({
        appid: game.id.toString(),
        name: game.name,
        img: game.header_image,
        old: game.original_price || 0,
        new: game.final_price || 0,
        discount: game.discount_percent,
        url: `https://store.steampowered.com/app/${game.id}/`
      });
    }

    res.json(uniqueGames);
  } catch (err) {
    console.error('Ошибка при загрузке specials:', err);
    res.status(500).json({ error: 'Ошибка загрузки скидок' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Сервер работает на порту ${PORT}`);
});
