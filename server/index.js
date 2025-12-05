const express = require('express');
const cors = require('cors');
const { getNews, initializeDatabase } = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize DB
initializeDatabase().then(() => {
    console.log('Database initialized');
    require('./seed')(); // Run seed on startup for now
}).catch(err => {
    console.error('Failed to initialize database:', err);
});

app.get('/api/news', async (req, res) => {
    try {
        const news = await getNews();
        res.json(news);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
