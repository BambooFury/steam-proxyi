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
app.get('/specials', async (req, res) => {
  try {
    const url = 'https://store.steampowered.com/search/results/?specials=1&count=50&cc=us&format=json';
    const response = await fetch(url);
    const json = await response.json();

    const games = (json?.results || []).map(item => ({
      name: item.name,
      url: `https://store.steampowered.com/app/${item.id}`,
      img: item.tiny_image,
      appid: item.id,
      discount: item.discount_percent,
      old: item.original_price,
      new: item.final_price
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(games);
  } catch (err) {
    console.error('Ошибка получения specials:', err);
    res.status(500).json({ error: 'Steam Specials fetch error', details: err.message });
  }
});
