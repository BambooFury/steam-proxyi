const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// GET /specials — список игр со скидками
app.get('/specials', async (req, res) => {
  try {
    const region = req.query.cc || 'us';
    const url = `https://store.steampowered.com/api/featuredcategories?cc=${region}`;
    const response = await fetch(url);

    const data = await response.json();
    const specials = data?.specials?.items || [];

    const games = specials.map(item => ({
      name: item.name,
      url: `https://store.steampowered.com/app/${item.id}`,
      img: item.header_image,
      appid: item.id,
      discount: item.discount_percent,
      old: item.original_price,
      new: item.final_price
    }));

    res.json(games);
  } catch (err) {
    console.error('Ошибка получения specials:', err);
    res.status(500).json({ error: 'Steam Specials fetch error', details: err.message });
  }
});

// GET /price?appid=123&cc=us — цена для игры
app.get('/price', async (req, res) => {
  const { appid, cc = 'us' } = req.query;
  if (!appid) return res.status(400).json({ error: 'appid is required' });

  try {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=${cc}&filters=price_overview`;
    const response = await fetch(url);
    const json = await response.json();

    const data = json[appid]?.data?.price_overview || null;
    res.json(data);
  } catch (err) {
    console.error('Ошибка получения цены:', err);
    res.status(500).json({ error: 'Steam Price fetch error', details: err.message });
  }
});

// Старт сервера
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});
