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
  const region = req.query.cc || 'us';
  try {
    const fcRes = await fetch(`https://store.steampowered.com/api/featuredcategories?cc=${region}`);
    const ftRes = await fetch(`https://store.steampowered.com/api/featured?cc=${region}`);

    const fc = await fcRes.json();
    const ft = await ftRes.json();

    const specials = fc?.specials?.items || [];
    const featured = ft?.featured || [];

    // Объединяем и убираем дубликаты по appid
    const combined = [...specials, ...featured];
    const seen = new Set();
    const unique = combined.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    const games = unique.map(item => ({
      name: item.name,
      appid: item.id,
      url: `https://store.steampowered.com/app/${item.id}`,
      img: item.header_image,
      discount: item.discount_percent,
      old: item.original_price,
      new: item.final_price
    }));

    res.json(games);
  } catch (err) {
    console.error('❌ Ошибка получения specials:', err);
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
