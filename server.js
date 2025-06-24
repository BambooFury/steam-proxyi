// 📦 Node.js + Express сервер для постраничной загрузки скидок со Steam

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

let cachedSpecials = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

app.get('/specials', async (req, res) => {
  const offset = parseInt(req.query.offset || '0', 10);
  const limit = parseInt(req.query.limit || '10', 10);

  try {
    // Используем кэш если он свежий
    if (Date.now() - cacheTimestamp > CACHE_DURATION) {
      const response = await fetch('https://store.steampowered.com/api/featuredcategories');
      const data = await response.json();

      if (!data.specials || !Array.isArray(data.specials.items)) {
        throw new Error('Invalid Steam API structure');
      }

      cachedSpecials = data.specials.items.map(item => ({
        appid: item.id,
        name: item.name,
        img: item.header_image,
        old: item.original_price,
        new: item.final_price,
        discount: item.discount_percent,
        url: `https://store.steampowered.com/app/${item.id}/`
      }));

      cacheTimestamp = Date.now();
    }

    const sliced = cachedSpecials.slice(offset, offset + limit);
    res.json(sliced);
  } catch (err) {
    console.error('Ошибка загрузки с Steam:', err);
    res.status(500).json({ error: 'Steam fetch failed' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Steam proxy specials API running on port ${PORT}`);
});
