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
    const specialsUrl = 'https://store.steampowered.com/api/featuredcategories?cc=ua&l=russian';
    const response = await fetch(specialsUrl);
    const json = await response.json();
    const specials = json.specials.items;

    // ✅ удаление дубликатов по имени игры
    const seen = new Set();
    const filtered = specials
      .filter(item => {
        const key = item.name.trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return item.discount_percent > 0;
      })
      .map(game => ({
        appid: game.id.toString(),
        name: game.name,
        img: game.header_image,
        old: game.original_price || 0,
        new: game.final_price || 0,
        discount: game.discount_percent,
        url: `https://store.steampowered.com/app/${game.id}/`
      }));

    res.json(filtered);
  } catch (error) {
    console.error('Ошибка получения specials:', error);
    res.status(500).json({ error: 'Ошибка загрузки акций со Steam' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
