const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(__dirname, 'TOKEN');
console.log("Reading from:", TOKEN_PATH);
let fileContent = fs.readFileSync(TOKEN_PATH, 'utf-8');
const keyMatch = fileContent.match(/(AIza[0-9A-Za-z\-_]{35})/);
let API_KEY = keyMatch ? keyMatch[1] : fileContent.replace(/[^a-zA-Z0-9\-_]/g, '');

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function listModels() {
    try {
        console.log("Fetching models...");
        const response = await fetch(API_URL);
        const data = await response.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
