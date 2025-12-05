const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { addNews, addNewsTag, getNews, deleteBadData, clearNews } = require('./database');
const { generateTags } = require('./aiService');

const CSV_PATH = path.join(__dirname, '..', 'noticias_uc_5paginas.csv');

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

async function migrateData() {
    console.log("Checking migration status...");

    try {
        await deleteBadData();
        const existing = await getNews();
        if (existing.length > 20) {
            console.log("Database populated (count: " + existing.length + "). Checking activity ratio...");
            const activities = existing.filter(e => e.type === 'activity');
            if (activities.length < 5) {
                console.log("Not enough activities. Wiping to re-migrate with better logic.");
                await clearNews();
            } else {
                console.log("Database OK. Skipping.");
                return;
            }
        }
    } catch (e) {
        console.log("Could not check existing news, proceeding...", e);
    }

    if (!fs.existsSync(CSV_PATH)) {
        console.error("CSV file not found at:", CSV_PATH);
        return;
    }

    console.log("Starting migration process in background...");

    try {
        const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            bom: true
        });

        console.log(`Found ${records.length} records to process.`);

        for (const record of records) {
            let isEvent = record['Fecha del evento'] && record['Fecha del evento'] !== 'N/A';
            let eventDate = isEvent ? record['Fecha del evento'] : null;

            // Synthetic Activity Generation for Demo
            if (!isEvent && Math.random() < 0.3) {
                isEvent = true;
                const d = new Date();
                d.setDate(d.getDate() + Math.floor(Math.random() * 90));
                eventDate = d.toISOString().split('T')[0];
            }

            const link = record['Link original'] || '';
            const content = (record['Contenido completo'] && record['Contenido completo'] !== 'N/A' ? record['Contenido completo'] : '') + (link ? `\n\nFull article: ${link}` : '');
            const source = (record['Fuentes/origen'] && record['Fuentes/origen'] !== 'N/A') ? record['Fuentes/origen'] : 'UC';

            const newsItem = {
                title: record['Titulo'],
                summary: (record['Resumen breve'] && record['Resumen breve'] !== 'N/A') ? record['Resumen breve'] : record['Titulo'],
                content: content,
                source: source,
                publicationDate: (record['Fecha publicación'] && record['Fecha publicación'] !== 'N/A') ? record['Fecha publicación'] : new Date().toISOString().split('T')[0],
                eventDate: eventDate,
                imageUrl: getRandomImage(),
                type: isEvent ? 'activity' : 'news'
            };

            try {
                const id = await addNews(newsItem);

                // Rate limit
                await new Promise(resolve => setTimeout(resolve, 4500));

                const tags = await generateTags(newsItem);
                for (const tag of tags) {
                    await addNewsTag(id, tag);
                }

                console.log(`Migrated: "${newsItem.title}" [${tags.join(', ')}]`);

            } catch (err) {
                console.error(`Failed to migrate "${newsItem.title}":`, err.message);
            }
        }
        console.log("Migration completed successfully.");

    } catch (error) {
        console.error("Migration fatal error:", error);
    }
}

module.exports = migrateData;
