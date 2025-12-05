
const { initializeDatabase } = require('./database');
const seed = require('./seed');

async function run() {
    await initializeDatabase();
    await seed();
}

run().catch(console.error);
