
const { addNews, initializeDatabase } = require('./database');

async function addDummy() {
    await initializeDatabase();
    await addNews({
        title: "Test Dummy Event",
        summary: "This is a manually added event to verify the database connection.",
        content: "Content for the dummy event.",
        source: "User Test",
        publicationDate: new Date().toISOString(),
        eventDate: new Date().toISOString(),
        imageUrl: "https://via.placeholder.com/300",
        type: "news"
    });
    console.log('Dummy event added.');
}

addDummy().catch(console.error);
