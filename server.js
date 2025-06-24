const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/price/:appid/:region', async (req, res) => {
  const { appid, region } = req.params;
  try {
    const steamURL = `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=${region}&l=russian`;
    const response = await fetch(steamURL);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(`Ошибка Steam API для ${appid}:`, err);
    res.status(500).json({ error: 'Steam API fetch error' });
  }
});

app.get('/specials', async (req, res) => {
  const sample = [
    {
      appid: "289070",
      name: "Civilization VI",
      img: "https://cdn.cloudflare.steamstatic.com/steam/apps/289070/capsule_616x353.jpg",
      old: 83986,
      new: 4186,
      discount: 95,
      url: "https://store.steampowered.com/app/289070/"
    }
  ];
  res.json(sample);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
