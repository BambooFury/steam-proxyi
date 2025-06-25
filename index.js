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
  const maxPages = 4; // 4 × 50 = до 200 игр
  const countPerPage = 50;

  try {
    const pageUrls = Array.from({ length: maxPages }, (_, i) =>
      `https://store.steampowered.com/search/results/?specials=1&count=${countPerPage}&start=${i * countPerPage}&cc=${region}&l=english&json=1`
    );

    const responses = await Promise.all(
      pageUrls.map(url =>
        fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          }
        }).then(r => r.json())
      )
    );

    const allItems = responses.flatMap(res => res?.results || []);

    const seen = new Set();
    const unique = allItems.filter(item => {
      if (!item?.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    const result = unique.map(item => ({
      name: item.name,
      appid: item.id,
      url: `https://store.steampowered.com/app/${item.id}`,
      img: item.tiny_image || '',
      discount: item.discount_percent,
      old: item.original_price,
      new: item.final_price
    }));

    console.log(`🎯 Отправлено ${result.length} игр со скидками`);
    res.json(result);
  } catch (err) {
    console.error('❌ Ошибка при получении скидок:', err);
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
