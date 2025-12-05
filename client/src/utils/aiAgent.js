
// Simple mock AI agent to generate tags based on content
// In a real app, this would call an LLM API

const TAG_COLORS = {
    URGENT: '#ef4444', // red-500
    ACADEMIC: '#3b82f6', // blue-500
    SOCIAL: '#8b5cf6', // violet-500
    INFO: '#10b981', // emerald-500
    CAREER: '#f59e0b', // amber-500
    ART: '#ec4899', // pink-500
    DEFAULT: '#6b7280' // gray-500
};

export function generateTags(item) {
    const text = (item.title + ' ' + item.summary + ' ' + item.content).toLowerCase();
    const tags = [];

    // Rule-based "AI"
    if (text.includes('urgent') || text.includes('deadline') || text.includes('alert') || text.includes('closure')) {
        tags.push({ text: 'Urgent', color: TAG_COLORS.URGENT });
    }

    if (text.includes('exam') || text.includes('study') || text.includes('library') || text.includes('course') || text.includes('grade')) {
        tags.push({ text: 'Academic', color: TAG_COLORS.ACADEMIC });
    }

    if (text.includes('party') || text.includes('festival') || text.includes('music') || text.includes('social') || text.includes('club')) {
        tags.push({ text: 'Social', color: TAG_COLORS.SOCIAL });
    }

    if (text.includes('career') || text.includes('job') || text.includes('internship') || text.includes('hire')) {
        tags.push({ text: 'Career', color: TAG_COLORS.CAREER });
    }

    if (text.includes('art') || text.includes('painting') || text.includes('exhibition') || text.includes('creative')) {
        tags.push({ text: 'Arts & Culture', color: TAG_COLORS.ART });
    }

    if (text.includes('food') || text.includes('menu') || text.includes('cafeteria')) {
        tags.push({ text: 'Dining', color: TAG_COLORS.INFO });
    }

    if (text.includes('robot') || text.includes('tech') || text.includes('engineer') || text.includes('code')) {
        tags.push({ text: 'Technology', color: TAG_COLORS.ACADEMIC });
    }

    // Default tag if none found
    if (tags.length === 0) {
        tags.push({ text: 'General', color: TAG_COLORS.DEFAULT });
    }

    // Add source as a tag automatically
    if (item.source) {
        tags.push({ text: item.source, color: TAG_COLORS.DEFAULT });
    }

    return tags;
}
