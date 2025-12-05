
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

// Simple helper to associate colors with tags
// In a real app, this might be dynamic or part of the tag object from DB



const TAG_MAPPING = {
    'Urgent': TAG_COLORS.URGENT,
    'Academic': TAG_COLORS.ACADEMIC,
    'Social': TAG_COLORS.SOCIAL,
    'Career': TAG_COLORS.CAREER,
    'Arts & Culture': TAG_COLORS.ART,
    'Dining': TAG_COLORS.INFO,
    'Technology': TAG_COLORS.ACADEMIC
};

export function getTagColor(tagName) {
    return TAG_MAPPING[tagName] || TAG_COLORS.DEFAULT;
}
