const { initializeDatabase, getNews } = require('./database');
const seed = require('./seed');

async function test() {
    try {
        await initializeDatabase();
        await seed();
        const news = await getNews();
        console.log("News count:", news.length);
        console.log("First item:", news[0]);

        // Assertions
        if (news.length !== 4) throw new Error("Expected 4 items");
        if (!news.find(n => n.type === 'activity').eventDate) throw new Error("Activity should have eventDate");
        if (news.find(n => n.type === 'news' && n.eventDate !== null)) throw new Error("News should have null eventDate");

        console.log("Verification Passed!");
    } catch (err) {
        console.error("Verification Failed:", err);
        process.exit(1);
    }
}

test();
