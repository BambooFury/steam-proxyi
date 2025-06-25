const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// GET /specials — скрейп до 200 игр со скидками
app.get('/specials', async (req, res) => {
  const region = req.query.cc || 'us';
  const maxPages = 4; // 4 x 50 = до 200 игр
  const pageUrls = Array.from({ length: maxPages }, (_, i) =>
    `https://store.steampowered.com/search/results/?specials=1&count=50&start=${i * 50}&cc=${region}`
  );

  try {
    const htmls = await Promise.all(
      pageUrls.map(url =>
        fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        }).then(r => r.text())
      )
    );

    const games = [];
    const seen = new Set();

    htmls.forEach(html => {
      const $ = cheerio.load(html);
      $('#search_resultsRows a.search_result_row').each((_, el) => {
        const el$ = $(el);
        const url = el$.attr('href');
        const match = url.match(/app\/(\d+)/);
        if (!match) return;
        const id = Number(match[1]);
if (seen.has(id)) return;
seen.add(id);

const name = el$.find('.search_name .title').text().trim();
const img = `https://cdn.akamai.steamstatic.com/steam/apps/${id}/placeholder.png`;

        const discount = parseInt(el$.find('.search_discount span').text().replace('%', ''), 10) || 0;

        const priceText = el$.find('.search_price').text().trim().replace(/\s+/g, ' ');
        const prices = priceText.match(/(\d+[.,]?\d*)/g) || [];
        const old = parseFloat(prices[0]?.replace(',', '.') || 0);
        const newP = parseFloat(prices[1]?.replace(',', '.') || prices[0] || 0);

        games.push({
          name,
          appid: id,
          url,
          img,
          discount,
          old: Math.round(old * 100),
          new: Math.round(newP * 100)
        });
      });
    });

    console.log(`🎯 Найдено ${games.length} игр`);
    res.json(games);
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

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});
