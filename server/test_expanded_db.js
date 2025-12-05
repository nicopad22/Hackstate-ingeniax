const database = require('./database');
const bcrypt = require('bcrypt');

async function testDatabaseExpansion() {
    try {
        console.log('Initializing database...');
        await database.initializeDatabase();
        console.log('Database initialized.');

        const testUser = {
            university: 'Test University',
            studyProgram: 'Computer Science',
            yearOnStudyProgram: 3,
            email: 'test@example.com',
            fullName: 'Test User',
            username: 'testuser',
            password: 'password123'
        };

        console.log('Adding test user...');
        await database.addUser(testUser);
        console.log('Test user added.');

        console.log('Retrieving test user...');
        const user = await database.getUser('testuser');
        console.log('User retrieved:', user);

        if (!user) {
            throw new Error('User not found in database.');
        }

        console.log('Verifying password...');
        const passwordMatch = await bcrypt.compare('password123', user.password);
        if (passwordMatch) {
            console.log('Password verified successfully.');
        } else {
            throw new Error('Password verification failed.');
        }

        const testInterest = {
            tag: 'Coding',
            userId: user.id
        };

        console.log('Adding interest...');
        await database.addInterest(testInterest);
        console.log('Interest added.');

        console.log('Retrieving interests...');
        const interests = await database.getInterests(user.id);
        console.log('Interests retrieved:', interests);

        if (interests.length > 0 && interests[0].tag === 'Coding') {
            console.log('Interest verified successfully.');
        } else {
            throw new Error('Interest verification failed.');
        }

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testDatabaseExpansion();
