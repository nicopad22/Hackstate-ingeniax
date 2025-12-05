
import React from 'react';

const Tag = ({ text, color }) => {
    const style = {
        backgroundColor: color + '20', // 20% opacity for background
        color: color,
        border: `1px solid ${color}40`,
        borderRadius: '9999px',
        padding: '0.25rem 0.75rem',
        fontSize: '0.75rem',
        fontWeight: '600',
        display: 'inline-block',
        marginRight: '0.5rem',
        marginBottom: '0.5rem',
        whiteSpace: 'nowrap'
    };

    return (
        <span style={style}>
            {text}
        </span>
    );
};

export default Tag;
