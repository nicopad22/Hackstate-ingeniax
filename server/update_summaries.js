const { initializeDatabase, getNews, updateNewsSummary } = require('./database');
const { generateSummary } = require('./aiService');

// Native fetch is available in Node 18+, but if the environment is older we might need issues.
// Assuming node 18+ as aiService uses fetch.

const RATE_LIMIT_DELAY = 4000; // 4 seconds between AI calls to be safe and polite to websites

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchArticleText(url) {
    try {
        console.log(`Fetching URL: ${url}`);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            console.error(`Failed to fetch ${url}: ${response.statusText}`);
            return null;
        }

        const html = await response.text();

        // Very basic text extraction: remove script/style, then strip tags
        let text = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gmi, " ")
            .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gmi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        return text;
    } catch (e) {
        console.error(`Error fetching article: ${e.message}`);
        return null;
    }
}

async function processSummaries() {
    console.log("Initializing database...");
    await initializeDatabase();

    console.log("Fetching news items...");
    // Get all news (assuming getNews without pagination returns all, or we might need to paginate)
    // database.js getNews: if (page && limit) ... else returns all. Good.
    const newsItems = await getNews();

    console.log(`Found ${newsItems.length} items.`);

    let processedCount = 0;

    for (const item of newsItems) {
        // Check if content has the link
        const linkMatch = item.content.match(/Full article: (https?:\/\/[^\s]+)/);

        if (linkMatch && linkMatch[1]) {
            const url = linkMatch[1];
            console.log(`\nProcessing Item ID ${item.id}: "${item.title}"`);
            console.log(`Found Source Link: ${url}`);

            // Check if summary is already "good" (not just title). 
            // The prompt says "summaries are currently just parts of the title".
            // So we should probably update all of them or maybe check if summary == title or similar.
            // But let's just force update as requested.

            const articleText = await fetchArticleText(url);

            if (articleText && articleText.length > 200) { // arbitrary min length check
                console.log("Generating summary with AI...");
                const newSummary = await generateSummary(articleText);

                if (newSummary) {
                    console.log(`New Summary: ${newSummary}`);
                    await updateNewsSummary(item.id, newSummary);
                    console.log("Database updated.");
                    processedCount++;
                } else {
                    console.log("Failed to generate summary.");
                }

                // Rate limiting
                await delay(RATE_LIMIT_DELAY);
            } else {
                console.log("Could not extract sufficient text from article.");
            }

        } else {
            console.log(`Skipping Item ID ${item.id}: No link found in content.`);
        }
    }

    console.log(`\nDone. Updated ${processedCount} summaries.`);
}

processSummaries().catch(console.error);
