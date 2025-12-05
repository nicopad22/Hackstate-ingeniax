const { addNews, getNews } = require('./database');

const dummyNews = [
    {
        title: "University library extends hours for finals",
        summary: "The main library will be open 24/7 starting next week.",
        content: "In preparation for the upcoming final exams, the university administration has decided to keep the main library open 24 hours a day, 7 days a week. This change will take effect starting next Monday and will continue through the end of the exam period. Students are creating study groups and reserving rooms in advance.",
        source: "Administration",
        date: "2024-05-20",
        imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=60", // Library image
        type: "news"
    },
    {
        title: "Engineers win national robotics competition",
        summary: "Our robotics team took first place in the annual tech challenge.",
        content: "The university's robotics team, the 'Robo-Hawks', secured first place at the National Tech Challenge held in San Francisco. Their robot, named 'Phoenix', outperformed 50 other teams in tasks involving navigation, object manipulation, and autonomous problem-solving. The team will be honored at a ceremony next Friday.",
        source: "Engineering Dept",
        date: "2024-05-18",
        imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format&fit=crop&q=60", // Robot/Tech image
        type: "news"
    },
    {
        title: "New cafeteria menu for Spring semester",
        summary: "More vegan and gluten-free options are now available.",
        content: "Dining Services is excited to announce a revamped menu for the Spring semester. Based on student feedback, the new menu features a significantly expanded selection of vegan, vegetarian, and gluten-free options. Highlights include a new quinoa bowl station and a daily rotating vegan curry.",
        source: "Dining Services",
        date: "2024-05-15",
        imageUrl: "https://images.unsplash.com/photo-1598514983318-2f64f8f4796c?w=600&auto=format&fit=crop&q=60", // Food image
        type: "news"
    },
    {
        title: "Campus Art Festival seeking submissions",
        summary: "Student artists are invited to submit their work for the annual showcase.",
        content: "The Department of Arts is calling for submissions for the upcoming Campus Art Festival. Works in all media—painting, sculpture, digital art, and photography—are welcome. Selected pieces will be displayed in the Student Center gallery for a month. The deadline for submission is June 1st.",
        source: "Arts Dept",
        date: "2024-05-22",
        imageUrl: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&auto=format&fit=crop&q=60", // Art image
        type: "activity"
    }
];

module.exports = async function seed() {
    const existing = await getNews();
    if (existing.length === 0) {
        console.log('Seeding database...');
        for (const item of dummyNews) {
            await addNews(item);
        }
        console.log('Database seeded!');
    } else {
        console.log('Database already has data, skipping seed.');
    }
};
