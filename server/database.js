const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bcrypt = require('bcrypt');

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
        );

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            university TEXT,
            studyProgram TEXT,
            yearOnStudyProgram INTEGER,
            email TEXT UNIQUE,
            fullName TEXT,
            username TEXT UNIQUE,
            password TEXT,
            accountCreationDate TEXT
        );

        CREATE TABLE IF NOT EXISTS interests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tag TEXT,
            date TEXT,
            userId INTEGER,
            FOREIGN KEY (userId) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS inscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            eventId INTEGER,
            inscriptionDate TEXT,
            FOREIGN KEY (userId) REFERENCES users(id),
            FOREIGN KEY (eventId) REFERENCES news(id)
        );

        CREATE TABLE IF NOT EXISTS news_tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            news_id INTEGER,
            tag_name TEXT,
            FOREIGN KEY (news_id) REFERENCES news(id)
        );
    `);
}

async function getNews(page = null, limit = null, type = null) {
    let query = `
        SELECT n.*, GROUP_CONCAT(nt.tag_name) as tag_string
        FROM news n
        LEFT JOIN news_tags nt ON n.id = nt.news_id
`;

    const params = [];

    if (type) {
        query += ` WHERE n.type = ?`;
        params.push(type);
    }

    query += `
        GROUP BY n.id
        ORDER BY n.id DESC
    `;

    if (page && limit) {
        const offset = (page - 1) * limit;
        query += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);
    }

    const rows = await db.all(query, params);

    return rows.map(row => {
        const { tag_string, ...rest } = row;
        return {
            ...rest,
            tags: tag_string ? tag_string.split(',') : []
        };
    });
}

async function addNews(newsItem) {
    const { title, summary, content, source, publicationDate, eventDate, imageUrl, type } = newsItem;

    if (type !== 'activity' && type !== 'news') {
        throw new Error('Invalid type: ' + type + '. Must be either "activity" or "news".');
    }

    const result = await db.run(
        'INSERT INTO news (title, summary, content, source, publicationDate, eventDate, imageUrl, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [title, summary, content, source, publicationDate, eventDate, imageUrl, type]
    );
    return result.lastID;
}

async function addNewsTag(newsId, tagName) {
    return db.run(
        'INSERT INTO news_tags (news_id, tag_name) VALUES (?, ?)',
        [newsId, tagName]
    );
}

async function clearNewsTags() {
    return db.run('DELETE FROM news_tags');
}

async function clearNews() {
    await clearNewsTags();
    return db.run('DELETE FROM news');
}

async function addUser(user) {
    const { university, studyProgram, yearOnStudyProgram, email, fullName, username, password } = user;
    const hashedPassword = await bcrypt.hash(password, 10);
    const accountCreationDate = new Date().toISOString();

    return db.run(
        'INSERT INTO users (university, studyProgram, yearOnStudyProgram, email, fullName, username, password, accountCreationDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [university, studyProgram, yearOnStudyProgram, email, fullName, username, hashedPassword, accountCreationDate]
    );
}

async function getUser(username) {
    return db.get('SELECT * FROM users WHERE username = ?', [username]);
}

async function addInterest(interest) {
    const { tag, userId } = interest;
    const date = new Date().toISOString();

    return db.run(
        'INSERT INTO interests (tag, date, userId) VALUES (?, ?, ?)',
        [tag, date, userId]
    );
}

async function getInterests(userId) {
    return db.all('SELECT * FROM interests WHERE userId = ?', [userId]);
}

async function verifyUser(username, password) {
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return null;

    const match = await bcrypt.compare(password, user.password);
    if (!match) return null;

    return user;
}

async function addInscription(inscription) {
    const { userId, eventId } = inscription;
    const inscriptionDate = new Date().toISOString();

    return db.run(
        'INSERT INTO inscriptions (userId, eventId, inscriptionDate) VALUES (?, ?, ?)',
        [userId, eventId, inscriptionDate]
    );
}

async function getInscriptionsByUser(userId) {
    return db.all('SELECT * FROM inscriptions WHERE userId = ?', [userId]);
}

async function getInscribedEventsByUser(userId) {
    const rows = await db.all(`
        SELECT n.*, i.inscriptionDate, GROUP_CONCAT(nt.tag_name) as tag_string
        FROM inscriptions i
        JOIN news n ON i.eventId = n.id
        LEFT JOIN news_tags nt ON n.id = nt.news_id
        WHERE i.userId = ?
        GROUP BY n.id, i.inscriptionDate
        ORDER BY i.inscriptionDate DESC
    `, [userId]);

    return rows.map(row => {
        const { tag_string, ...rest } = row;
        return {
            ...rest,
            tags: tag_string ? tag_string.split(',') : []
        };
    });
}

async function deleteInterest(interestId) {
    return db.run('DELETE FROM interests WHERE id = ?', [interestId]);
}

async function getUserById(id) {
    return db.get('SELECT * FROM users WHERE id = ?', [id]);
}

async function deleteBadData() {
    return db.run("DELETE FROM news WHERE title IS NULL OR title = 'undefined'");
}

module.exports = {
    initializeDatabase,
    getNews,
    addNews,
    clearNews,
    addUser,
    getUser,
    getUserById,
    addInterest,
    getInterests,
    verifyUser,
    addInscription,
    getInscriptionsByUser,
    getInscribedEventsByUser,
    deleteInterest,
    addNewsTag,
    clearNewsTags,
    deleteBadData,
    updateNewsSummary
};

async function updateNewsSummary(id, summary) {
    return db.run('UPDATE news SET summary = ? WHERE id = ?', [summary, id]);
}

async function clearActivities() {
    return db.run("DELETE FROM news WHERE type = 'activity'");
}

async function clearInscriptions() {
    return db.run("DELETE FROM inscriptions");
}

async function updateNewsImage(id, imageUrl) {
    return db.run("UPDATE news SET imageUrl = ? WHERE id = ?", [imageUrl, id]);
}

module.exports = {
    initializeDatabase,
    getNews,
    addNews,
    clearNews,
    addUser,
    getUser,
    getUserById,
    addInterest,
    getInterests,
    verifyUser,
    addInscription,
    getInscriptionsByUser,
    getInscribedEventsByUser,
    deleteInterest,
    addNewsTag,
    clearNewsTags,
    deleteBadData,
    updateNewsSummary,
    clearActivities,
    clearInscriptions,
    updateNewsImage
};
