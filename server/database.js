const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

let db;

async function initializeDatabase() {
    db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            summary TEXT,
            content TEXT,
            source TEXT,
            publicationDate TEXT,
            eventDate TEXT,
            imageUrl TEXT,
            type TEXT CHECK(type IN ('activity', 'news'))
        )
    `);
}

async function getNews() {
    return db.all('SELECT * FROM news ORDER BY id DESC');
}

async function addNews(newsItem) {
    const { title, summary, content, source, publicationDate, eventDate, imageUrl, type } = newsItem;

    if (type !== 'activity' && type !== 'news') {
        throw new Error('Invalid type: ' + type + '. Must be either "activity" or "news".');
    }

    return db.run(
        'INSERT INTO news (title, summary, content, source, publicationDate, eventDate, imageUrl, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [title, summary, content, source, publicationDate, eventDate, imageUrl, type]
    );
}

module.exports = {
    initializeDatabase,
    getNews,
    addNews
};
