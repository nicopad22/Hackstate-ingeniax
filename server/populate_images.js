const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const https = require('https');
const http = require('http');

const CSV_PATH = path.join(__dirname, '..', 'noticias_uc_5paginas.csv');
const IMAGES_DIR = path.join(__dirname, '..', 'client', 'public', 'news_images');
const DB_PATH = './database.sqlite';

async function fetchHtml(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // Follow redirect
                fetchHtml(res.headers.location).then(resolve).catch(reject);
                return;
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        // Force HTTPS if it's a UC link to avoid mixed content and redirect issues
        // Many UC links are http in OG tags but server supports https
        if (url.startsWith('http://www.uc.cl')) {
            url = url.replace('http://', 'https://');
        }

        const file = fs.createWriteStream(dest);
        const client = url.startsWith('https') ? https : http;

        client.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // Handle redirect for image download
                downloadImage(res.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`Status code ${res.statusCode}`));
                return;
            }
            res.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function run() {
    if (!fs.existsSync(IMAGES_DIR)) {
        fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }

    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    console.log("Reading CSV...");
    const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        bom: true
    });

    console.log(`Found ${records.length} records.`);

    for (const record of records) {
        const title = record['Titulo'];
        const link = record['Link original'];

        if (!link) continue;

        const dbItem = await db.get("SELECT * FROM news WHERE title = ?", [title]);

        if (!dbItem) {
            console.log(`Skipping (not in DB): ${title.substring(0, 30)}...`);
            continue;
        }

        // Check if already has a custom image (not unsplash fallback)
        if (dbItem.imageUrl && !dbItem.imageUrl.includes('unsplash')) {
            console.log(`Skipping (already has image): ${title.substring(0, 30)}...`);
            // continue; // Uncomment if you want to skip re-processing
        }

        console.log(`Processing: ${title.substring(0, 50)}...`);

        try {
            const html = await fetchHtml(link);

            // Regex to find og:image or twitter:image
            const match = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
                html.match(/<meta\s+name="twitter:image"\s+content="([^"]+)"/i);

            if (match && match[1]) {
                let imageUrl = match[1];
                // Fix relative URLs if any
                if (imageUrl.startsWith('/')) {
                    const u = new URL(link);
                    imageUrl = `${u.protocol}//${u.host}${imageUrl}`;
                }

                console.log(`  - Found image URL: ${imageUrl}`);

                const ext = path.extname(imageUrl).split('?')[0] || '.jpg';
                const filename = `news_${dbItem.id}${ext}`;
                const localPath = path.join(IMAGES_DIR, filename);
                const publicPath = `/news_images/${filename}`;

                await downloadImage(imageUrl, localPath);

                await db.run("UPDATE news SET imageUrl = ? WHERE id = ?", [publicPath, dbItem.id]);
                console.log(`  - Downloaded & Updated DB.`);
            } else {
                console.log("  - No image found in metadata.");
            }
        } catch (error) {
            console.error(`  - Error: ${error.message}`);
        }

        // Politeness delay
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log("Done.");
}

run().catch(console.error);
