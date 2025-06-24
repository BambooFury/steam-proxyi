import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());

// Список популярных игр — можно расширить
const appIds = [
  1091500, 534380, 990080, 292030, 1145360,
  1196590, 1426210, 275850, 892970, 550
];

app.get('/specials', async (req, res) => {
  try {
    const promises = appIds.map(id =>
      fetch(`https://store.steampowered.com/api/appdetails?appids=${id}&cc=UA&l=ukrainian`)
        .then(r => r.json())
        .catch(() => null)
    );

    const results = await Promise.all(promises);
    const formatted = [];

    for (const r of results) {
      if (!r) continue;
      const key = Object.keys(r)[0];
      const data = r[key].data;

      if (data.price_overview && data.price_overview.discount_percent > 0) {
        const price = data.price_overview;
        formatted.push({
          appid: parseInt(key),
          name: data.name,
          img: data.header_image,
          old: price.initial,
          new: price.final,
          discount: price.discount_percent,
          url: `https://store.steampowered.com/app/${key}/`
        });
      }
    }

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при получении скидок Steam' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Steam UAH proxy работает на порту ${PORT}`));
