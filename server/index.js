const express = require('express');
const cors = require('cors');
const { getNews, initializeDatabase, addUser, verifyUser, getUserById, getInterests, getInscriptionsByUser, getInscribedEventsByUser, addInterest, deleteInterest, addInscription } = require('./database');
const { rankNewsForUser, generateInterestSuggestions } = require('./aiService');

const app = express();
const PORT = 3000;

// ... (middleware and init)

// ... (existing endpoints)



app.use(cors());
app.use(express.json());

// Initialize DB
const migrateData = require('./migrate');

// ...

// Initialize DB
initializeDatabase().then(() => {
    console.log('Database initialized');
    // require('./seed')(); // Disabled to persist real data
    migrateData(); // Run migration in background
}).catch(err => {
    console.error('Failed to initialize database:', err);
});

app.get('/api/news', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const type = req.query.type;

        let news = await getNews(page, limit, type);
        const userId = req.query.userId;

        if (userId) {
            try {
                const user = await getUserById(userId);
                if (user) {
                    const [interests, inscriptions] = await Promise.all([
                        getInterests(userId),
                        getInscriptionsByUser(userId)
                    ]);

                    // Rank the fetched page (or we'd need to fetch more to rank better)
                    const rankedIds = await rankNewsForUser(user, interests, inscriptions, news);

                    if (rankedIds && rankedIds.length > 0) {
                        const newsMap = new Map(news.map(item => [item.id, item]));
                        const sortedNews = [];

                        for (const id of rankedIds) {
                            if (newsMap.has(id)) {
                                sortedNews.push(newsMap.get(id));
                                newsMap.delete(id);
                            }
                        }

                        for (const item of newsMap.values()) {
                            sortedNews.push(item);
                        }

                        news = sortedNews;
                    }
                }
            } catch (personalizationError) {
                console.error('Error personalizing news feed:', personalizationError);
            }
        }

        res.json(news);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const user = req.body;
        // Simple validation
        if (!user.username || !user.password || !user.email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        await addUser(user);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await verifyUser(username, password);

        if (user) {
            // Don't send password back
            const { password, ...userWithoutPassword } = user;

            // Fetch interests
            try {
                const interests = await require('./database').getInterests(user.id);
                userWithoutPassword.interests = interests.map(i => i.tag); // Just send the tags
            } catch (err) {
                console.error('Error fetching interests:', err);
                userWithoutPassword.interests = [];
            }

            res.json({ message: 'Login successful', user: userWithoutPassword });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});


app.get('/api/inscriptions/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const inscriptions = await getInscribedEventsByUser(userId);
        res.json(inscriptions);
    } catch (error) {
        console.error('Error fetching inscriptions:', error);
        res.status(500).json({ error: 'Failed to fetch inscriptions' });
    }
});

app.post('/api/inscriptions', async (req, res) => {
    try {
        const { userId, eventId } = req.body;
        if (!userId || !eventId) return res.status(400).json({ error: 'Missing userId or eventId' });

        await addInscription({ userId, eventId });
        res.status(201).json({ message: 'Inscription added' });
    } catch (error) {
        console.error('Error adding inscription:', error);
        res.status(500).json({ error: 'Failed to add inscription' });
    }
});

app.post('/api/interests', async (req, res) => {
    try {
        const { userId, tag } = req.body;
        if (!userId || !tag) return res.status(400).json({ error: 'Missing userId or tag' });

        // Basic validation for tag length
        if (tag.length > 30) return res.status(400).json({ error: 'Tag too long' });

        await addInterest({ userId, tag });
        res.status(201).json({ message: 'Interest added' });
    } catch (error) {
        console.error('Error adding interest:', error);
        res.status(500).json({ error: 'Failed to add interest' });
    }
});

app.delete('/api/interests/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await deleteInterest(id);
        res.json({ message: 'Interest deleted' });
    } catch (error) {
        console.error('Error deleting interest:', error);
        res.status(500).json({ error: 'Failed to delete interest' });
    }
});

app.get('/api/suggestions/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await getUserById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const interests = await getInterests(userId);
        const inscriptions = await getInscriptionsByUser(userId); // Just need IDs
        const news = await getNews();

        const suggestions = await generateInterestSuggestions(user, interests, inscriptions, news);
        res.json(suggestions);
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
