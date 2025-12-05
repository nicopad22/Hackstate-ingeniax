
import React from 'react';
import Tag from './Tag';
import { generateTags } from '../utils/aiAgent';

const Card = ({ item, layout = 'grid' }) => {
    const tags = generateTags(item);

    // Formatting date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    };

    const isList = layout === 'list';

    // Styles objects
    const cardStyle = {
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        display: 'flex',
        flexDirection: isList ? 'row' : 'column',
        height: '100%',
        border: '1px solid #e5e7eb',
    };

    const imageStyle = {
        width: isList ? '250px' : '100%',
        height: isList ? '100%' : '200px',
        objectFit: 'cover',
        flexShrink: 0
    };

    const contentStyle = {
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexGrow: 1
    };

    const titleStyle = {
        fontSize: '1.25rem',
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: '0.5rem',
        lineHeight: 1.4
    };

    const summaryStyle = {
        color: '#4b5563',
        marginBottom: '1rem',
        flexGrow: 1,
        lineHeight: 1.5,
        display: '-webkit-box',
        WebkitLineClamp: isList ? 3 : 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
    };

    const footerStyle = {
        marginTop: 'auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '1rem',
        borderTop: '1px solid #f3f4f6',
        fontSize: '0.875rem',
        color: '#9ca3af'
    };

    return (
        <article className="card-hover" style={cardStyle}>
            {item.imageUrl && (
                <img src={item.imageUrl} alt={item.title} style={imageStyle} />
            )}
            <div style={contentStyle}>
                <div>
                    <div style={{ marginBottom: '0.75rem' }}>
                        {tags.map((tag, idx) => (
                            <Tag key={idx} text={tag.text} color={tag.color} />
                        ))}
                    </div>
                    <h3 style={titleStyle}>{item.title}</h3>
                    <p style={summaryStyle}>{item.summary}</p>
                </div>

                <div style={footerStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>Pub: {formatDate(item.publicationDate)}</span>
                        {item.eventDate && item.type === 'activity' && <span style={{ fontSize: '0.8em', color: '#2563eb' }}>Event: {formatDate(item.eventDate)}</span>}
                    </div>
                    <span style={{ fontWeight: 500 }}>{item.type === 'activity' ? 'Activity' : 'News'}</span>
                </div>
            </div>
        </article>
    );
};

export default Card;
