const fs = require('fs');
const path = require('path');

// Read API Key from hidden file
const TOKEN_PATH = path.join(__dirname, 'TOKEN');
console.log("Reading API Key from:", TOKEN_PATH);
// Read as binary buffer first to detect encoding issues if needed, but let's just clean the string
let fileContent = fs.readFileSync(TOKEN_PATH, 'utf-8');

// Handle Windows UTF-16 artifact (if read as UTF-8, null bytes might be present)
// or just strange BOM characters at the start.
// We will simply extract the valid API key pattern.
// Google API keys usually start with AIza...
const keyMatch = fileContent.match(/(AIza[0-9A-Za-z\-_]{35})/);

let API_KEY;
if (keyMatch) {
    API_KEY = keyMatch[1];
    console.log("Successfully extracted API Key.");
} else {
    // Fallback: try to just clean it
    console.warn("Could not find standard 'AIza' pattern. Using raw cleanup.");
    API_KEY = fileContent.replace(/[^a-zA-Z0-9\-_]/g, '');
}

console.log(`API Key loaded. Length: ${API_KEY.length}, First 4 chars: ${API_KEY.substring(0, 4)}`);
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

const VALID_TAGS = [
    'Urgent',
    'Academic',
    'Social',
    'Career',
    'Arts & Culture',
    'Dining',
    'Technology'
];

async function generateTags(newsItem) {
    const prompt = `
    You are an AI assistant that tags university news and activities.
    
    Here is the list of valid tags you can use:
    ${JSON.stringify(VALID_TAGS)}
    
    Analyze the following item and assign 1 or 2 most relevant tags from the list above.
    Only return a JSON array of strings. Do not include any other text or markdown formatting (like \`\`\`json).
    
    Item:
    Title: ${newsItem.title}
    Summary: ${newsItem.summary}
    Content: ${newsItem.content}
    `;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`API Error Body: ${errorBody}`);
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.candidates && data.candidates.length > 0) {
            let text = data.candidates[0].content.parts[0].text;
            // Clean up potentially md formatted response
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();

            try {
                const tags = JSON.parse(text);
                // Filter to ensure only valid tags are returned
                return tags.filter(t => VALID_TAGS.includes(t));
            } catch (e) {
                console.error("Failed to parse AI response:", text);
                return ['General'];
            }
        }

        return ['General'];

    } catch (error) {
        console.error("Error generating tags:", error);
        return ['General'];
    }
}

async function rankNewsForUser(user, interests, inscriptions, newsItems) {
    // Optimization: Only rank the top 10 items to reduce latency. 
    // The rest will remain in their default chronological order.
    const itemsToRank = newsItems.slice(0, 10);

    // Prepare minimal data to save tokens
    // Resolve inscription event details (titles of events the user has registered for)
    const inscriptionLists = inscriptions.map(insc => {
        // Find the event in the newsItems list to get its title/tags
        // Note: This assumes newsItems contains all relevant events.
        const item = newsItems.find(n => n.id === insc.eventId);
        return item ? { title: item.title, tags: item.tags } : null;
    }).filter(i => i !== null);

    const userProfile = {
        university: user.university,
        program: user.studyProgram,
        year: user.yearOnStudyProgram,
        interests: interests.map(i => i.tag),
        registered_events: inscriptionLists
    };

    const simplifiedNews = itemsToRank.map(item => ({
        id: item.id,
        title: item.title,
        summary: item.summary,
        tags: item.tags,
        type: item.type,
        date: item.eventDate
    }));

    const prompt = `
    You are an intelligent feed ranking assistant.
    Your task is to reorder a list of news and activity items for a specific user based on their profile, interests, and past event registrations to maximize engagement.
    
    User Profile:
    ${JSON.stringify(userProfile)}
    
    Items to Rank:
    ${JSON.stringify(simplifiedNews)}
    
    Return the items in the order they should appear for this user, most relevant first.
    Return ONLY a valid JSON array of item IDs (integers). Do not include any other text or markdown formatting.
    `;

    try {
        const fetchPromise = fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        // Timeout after 2.5 seconds to ensure UI doesn't stall
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('AI Ranking Timeout')), 2500)
        );

        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.candidates && data.candidates.length > 0) {
            let text = data.candidates[0].content.parts[0].text;
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const rankedIds = JSON.parse(text);
            return rankedIds;
        }
        return [];
    } catch (error) {
        if (error.message === 'AI Ranking Timeout') {
            console.warn("AI Ranking timed out - falling back to default order");
        } else {
            console.error("Error ranking news:", error);
        }
        return [];
    }
}

async function generateInterestSuggestions(user, currentInterests, inscriptions, allNews) {
    // Prepare context
    const inscriptionDetails = inscriptions.map(insc => {
        const item = allNews.find(n => n.id === insc.eventId);
        return item ? item.title : null; // Just titles for brevity
    }).filter(titles => titles !== null);

    const userContext = {
        student_info: {
            program: user.studyProgram,
            year: user.yearOnStudyProgram,
            university: user.university
        },
        current_interests: currentInterests.map(i => i.tag),
        past_activities: inscriptionDetails
    };

    const prompt = `
    You are a student life advisor.
    Based on the following student profile, suggest 10 relevant short interest tags (max 30 chars each) that they might want to add to their profile to get better event recommendations.
    
    Student Profile:
    ${JSON.stringify(userContext)}
    
    Do not suggest tags that are already in "current_interests".
    Focus on specific topics, hobbies, skills, or academic fields relevant to this student.
    
    Return ONLY a JSON array of strings (e.g. ["Artificial Intelligence", "Volleyball", "Hackathons"]).
    `;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) throw new Error(response.statusText);

        const data = await response.json();
        if (data.candidates && data.candidates.length > 0) {
            let text = data.candidates[0].content.parts[0].text;
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const suggestions = JSON.parse(text);
            // Ensure strings and length limit
            return suggestions.filter(s => typeof s === 'string' && s.length <= 30).slice(0, 15);
        }
        return [];
    } catch (error) {
        console.error("Error generating interest suggestions:", error);
        // Fallback static suggestions if AI fails
        return ["Coding", "Sports", "Music", "Networking", "Workshops"];
    }
}


async function generateSummary(text) {
    const prompt = `
    You are an expert news summarizer.
    Create a very short summary (maximum 10-15 words) of the following article content.
    The summary MUST be in Spanish.
    The summary should be engaging and informative, suitable for a mobile news feed card.
    
    Article Content:
    ${text.substring(0, 10000)} // Truncate to avoid token limits if necessary
    
    Return ONLY the summary text in Spanish.
    `;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("AI API Error Body:", errorText);
            throw new Error(response.statusText);
        }

        const data = await response.json();
        if (data.candidates && data.candidates.length > 0) {
            return data.candidates[0].content.parts[0].text.trim();
        }
        return null;
    } catch (error) {
        console.error("Error generating summary:", error);
        return null;
    }
}

module.exports = { generateTags, rankNewsForUser, generateInterestSuggestions, generateSummary };
