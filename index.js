const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

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

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
