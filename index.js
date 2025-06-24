const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// Прокси для цены по appid
app.get('/price/:appid/:region', async (req, res) => {
  const { appid, region } = req.params;
  const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=${region}&filters=price_overview`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json({ [appid]: data[appid] });
  } catch (err) {
    res.status(500).json({ error: 'Steam API fetch error', details: err.message });
  }
});

// Прокси для списка скидок
app.get('/specials', async (req, res) => {
  try {
    const response = await fetch('https://store.steampowered.com/search/results/?specials=1&count=50&cc=us&format=json');
    const json = await response.json();

    const games = json?.results?.map(item => ({
      name: item.name,
      url: `https://store.steampowered.com/app/${item.id}`,
      img: item.tiny_image,
      appid: item.id,
      discount: item.discount_percent,
      old: item.original_price,
      new: item.final_price,
    }));

    res.json(games);
  } catch (err) {
    res.status(500).json({ error: 'Steam Specials fetch error', details: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Steam proxy running on port ${PORT}`));
