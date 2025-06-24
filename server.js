const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

app.use(cors());

// 📦 Получение цены по appid
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

// 🎮 Получение игр со скидками
app.get('/specials', async (req, res) => {
  try {
    const steamURL = 'https://store.steampowered.com/api/featuredcategories?cc=ua&l=russian';
    const response = await fetch(steamURL);
    const data = await response.json();

    const games = data.specials?.items || [];

    // ✂ Удаляем дубликаты по очищенному названию (без знаков, регистра и пробелов)
    const normalize = str => str.toLowerCase().replace(/\s+/g, '').replace(/[^a-zа-яё0-9]/gi, '');
    const seen = new Set();
    const unique = [];

    for (const game of games) {
      if (game.discount_percent <= 0) continue;
      const key = normalize(game.name);
      if (seen.has(key)) continue;
      seen.add(key);

      unique.push({
        appid: game.id.toString(),
        name: game.name,
        img: game.header_image,
        old: game.original_price || 0,
        new: game.final_price || 0,
        discount: game.discount_percent,
        url: `https://store.steampowered.com/app/${game.id}/`
      });
    }

    res.json(unique);
  } catch (err) {
    console.error('Ошибка загрузки данных со Steam:', err);
    res.status(500).json({ error: 'Ошибка при получении списка акций' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
});
