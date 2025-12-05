const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const https = require('https');
const http = require('http');
const {
    addNews,
    addNewsTag,
    clearActivities,
    clearInscriptions,
    updateNewsSummary,
    updateNewsImage
} = require('./database');
const { generateSummary, generateTags } = require('./aiService');

const CSV_PATH = path.join(__dirname, '..', 'eventos_uc_8paginas.csv');
const IMAGES_DIR = path.join(__dirname, '..', 'client', 'public', 'news_images');

const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1562774053-701939374585?w=600&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=600&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&auto=format&fit=crop&q=60"
];

function getRandomImage() {
    return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Fetch helpers --- //

async function fetchHtml(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                fetchHtml(res.headers.location).then(resolve).catch(reject);
                return;
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.end();
    });
}

async function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        if (url.startsWith('http://www.uc.cl')) {
            url = url.replace('http://', 'https://');
        }
        const client = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(dest);
        const req = client.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                downloadImage(res.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`Status code ${res.statusCode}`));
                return;
            }
            res.pipe(file);
            file.on('finish', () => file.close(resolve));
        });
        req.on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
        req.end();
    });
}

async function fetchArticleText(url) {
    try {
        const html = await fetchHtml(url);
        // Clean HTML
        let text = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gmi, " ")
            .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gmi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        return { text, html };
    } catch (e) {
        console.error(`Error fetching article text: ${e.message}`);
        return null;
    }
}

// --- Main Migration Logic --- //

async function migrateActivities() {
    console.log("Starting Activities Migration...");

    // 1. Wipe Data
    console.log("Wiping activities and inscriptions...");
    await clearInscriptions();
    await clearActivities();
    console.log("Wiped.");

    // 2. Read CSV
    if (!fs.existsSync(CSV_PATH)) {
        console.error("CSV file not found:", CSV_PATH);
        return;
    }
    const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        bom: true
    });

    console.log(`Found ${records.length} records in CSV.`);

    if (!fs.existsSync(IMAGES_DIR)) {
        fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }

    let count = 0;

    for (const record of records) {
        // Validation
        let title = record['Titulo'];
        const link = record['Link original'];
        if (!link) continue;

        // Skip junk titles if possible, or we will fix them? 
        // "Ver actividadesarrow_forward" seems to be garbage.
        if (title.includes("Ver actividadesarrow_forward")) {
            // Try to extract a better title from URL slug if possible, or just mark as 'Activity'
            // url: .../cine-recobrado -> Cine Recobrado
            const slug = link.split('/').filter(Boolean).pop();
            title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }

        // Synthesize Date (Future date to be relevant)
        const d = new Date();
        d.setDate(d.getDate() + Math.floor(Math.random() * 90) + 1); // 1 to 90 days in future
        const eventDate = d.toISOString().split('T')[0];

        // Construct Content
        const ubicacion = record['Ubicación'] !== 'N/A' ? `Ubicación: ${record['Ubicación']}` : '';
        const reqs = record['Requisitos / Público de interés'] !== 'N/A' ? `Requisitos: ${record['Requisitos / Público de interés']}` : '';
        const content = `${ubicacion}\n${reqs}\n\nFull article: ${link}`.trim();

        // Initial Insert
        const activityItem = {
            title: title,
            summary: title, // Placeholder
            content: content,
            source: 'UC',
            publicationDate: new Date().toISOString().split('T')[0],
            eventDate: eventDate,
            imageUrl: getRandomImage(),
            type: 'activity' // Explicitly activity
        };

        try {
            const id = await addNews(activityItem);
            console.log(`[${id}] Inserted: ${title}`);

            // --- Post-Processing (Image & Summary & Tags) ---

            // 1. Fetch HTML
            const data = await fetchArticleText(link);
            if (data && data.html) {
                // Image
                const html = data.html;
                const match = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
                    html.match(/<meta\s+name="twitter:image"\s+content="([^"]+)"/i);

                if (match && match[1]) {
                    let imageUrl = match[1];
                    if (imageUrl.startsWith('/')) {
                        const u = new URL(link);
                        imageUrl = `${u.protocol}//${u.host}${imageUrl}`;
                    }

                    if (!imageUrl.includes('defecto')) { // check for default placeholders if specific to site
                        const ext = path.extname(imageUrl).split('?')[0] || '.jpg';
                        const filename = `activity_${id}${ext}`;
                        const localPath = path.join(IMAGES_DIR, filename);
                        const publicPath = `/news_images/${filename}`;

                        try {
                            await downloadImage(imageUrl, localPath);
                            await updateNewsImage(id, publicPath);
                            console.log(`  -> Valid image downloaded.`);
                        } catch (err) {
                            console.error(`  -> Failed image download: ${err.message}`);
                        }
                    }
                }

                // Summary (using AI)
                const articleText = data.text;
                if (articleText.length > 200) {
                    // We want summaries in Spanish
                    const summary = await generateSummary(articleText);
                    if (summary) {
                        await updateNewsSummary(id, summary);
                        console.log(`  -> Summary generated.`);
                    }
                }

                // Tags (using AI)
                // Re-construct item with new summary for better tagging
                const updatedItem = { ...activityItem };
                // We don't have the summary in variable, but generateTags uses title/summary/content
                // Let's passed the simplified item
                const tags = await generateTags(updatedItem);
                for (const tag of tags) {
                    await addNewsTag(id, tag);
                }
                console.log(`  -> Tags: ${tags.join(', ')}`);

            }

            count++;
            // Rate limit heavily because we are doing multiple AI calls + Scrapes
            await delay(4000);

        } catch (err) {
            console.error(`Failed to migrate ${title}:`, err);
        }
    }

    console.log(`Migration Finished. Processed ${count} activities.`);
}

const { initializeDatabase } = require('./database');

initializeDatabase().then(migrateActivities).catch(err => console.error(err));
