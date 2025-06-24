const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

app.use(cors());

// Middleware для логирования всех запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

app.get('/price/:appid/:region', async (req, res) => {
  const { appid, region } = req.params;
  try {
    console.log(`Запрос цены для appid=${appid}, регион=${region}`);
    const steamURL = `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=${region}&l=russian`;
    const response = await fetch(steamURL);
    
    if (!response.ok) {
      throw new Error(`Steam API ответил с кодом ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(`Ошибка Steam API для ${appid}:`, err);
    res.status(500).json({ 
      error: 'Steam API fetch error',
      message: err.message 
    });
  }
});

app.get('/specials', async (req, res) => {
  try {
    console.log('Запрос специальных предложений...');
    const steamURL = 'https://store.steampowered.com/api/featuredcategories?cc=ua&l=russian';
    const response = await fetch(steamURL);
    
    if (!response.ok) {
      throw new Error(`Steam API ответил с кодом ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.specials || !data.specials.items) {
      throw new Error('Неверный формат ответа от Steam API');
    }
    
    const games = data.specials.items;
    console.log(`Получено ${games.length} игр со скидками`);
    
    const seenAppIds = new Set();
    const uniqueGames = [];
    const duplicates = [];

    for (const game of games) {
      // Пропускаем игры без скидки
      if (!game.discount_percent || game.discount_percent <= 0) {
        continue;
      }
      
      const appid = game.id.toString();
      
      // Проверка дубликатов
      if (seenAppIds.has(appid)) {
        duplicates.push({
          appid,
          name: game.name,
          img: game.header_image
        });
        continue;
      }
      
      seenAppIds.add(appid);
      
      uniqueGames.push({
        appid,
        name: game.name,
        img: game.header_image,
        old: game.original_price || 0,
        new: game.final_price || 0,
        discount: game.discount_percent,
        url: `https://store.steampowered.com/app/${game.id}/`
      });
    }
    
    console.log(`Уникальные игры: ${uniqueGames.length}`);
    console.log(`Дубликаты: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
      console.log('Найденные дубликаты:');
      duplicates.forEach(dup => {
        console.log(`- ${dup.appid}: ${dup.name} (${dup.img})`);
      });
    }
    
    res.json(uniqueGames);
  } catch (err) {
    console.error('Ошибка при загрузке specials:', err);
    res.status(500).json({ 
      error: 'Ошибка загрузки скидок',
      message: err.message 
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Сервер работает на порту ${PORT}`);
  console.log(`URL для проверки: http://localhost:${PORT}/specials`);
});
