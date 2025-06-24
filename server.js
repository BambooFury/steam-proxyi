import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/price/:appid/:region', async (req, res) => {
  const { appid, region } = req.params;
  const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=${region}&filters=price_overview`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ [appid]: data[appid] });
  } catch (err) {
    res.status(500).json({ error: 'Steam API fetch error', details: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Proxy server running on port ${PORT}`));
