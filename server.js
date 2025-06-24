const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/price/:appid/:region', async (req, res) => {
  const { appid, region } = req.params;
  try {
    const steamURL = `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=${region}&l=russian`;
    const response = await fetch(steamURL);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(`Ошибка Steam API для ${appid}:`, err);
    res.status(500).json({ error: 'Steam API fetch error' });
  }
});

app.get('/specials', async (req, res) => {
  try {
    const steamURL = 'https://store.steampowered.com/api/featuredcategories?cc=ua&l=russian';
    const response = await fetch(steamURL);
    const data = await response.json();

    const games = data.specials?.items || [];

    // 🔍 Удаляем дубликаты по IMG (header_image) — 100% надёжно
    const seenImages = new Set();
    const uniqueGames = [];

    for (const game of games) {
      if (game.discount_percent <= 0) continue;
      if (seenImages.has(game.header_image)) continue;

      seenImages.add(game.header_image);

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
