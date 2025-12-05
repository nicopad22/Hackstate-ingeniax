import { useState } from 'react';
import Tag from './Tag';
import { getTagColor } from '../utils/aiAgent';

function FullScreenCard({ item, user }) {
    const [registering, setRegistering] = useState(false);
    const [registered, setRegistered] = useState(false);

    const handleInscription = async (e) => {
        e.stopPropagation();
        if (!user) {
            alert("Por favor inicia sesión para registrarte en actividades.");
            return;
        }
        setRegistering(true);
        try {
            const res = await fetch('/api/inscriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, eventId: item.id })
            });
            if (res.ok) {
                setRegistered(true);
            } else {
                const data = await res.json();
                alert(data.error || "Error al registrarse.");
            }
        } catch (err) {
            console.error(err);
            alert("Error registrando.");
        } finally {
            setRegistering(false);
        }
    };

    return (
        <div className="fullscreen-card" style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.9) 100%), url(${item.imageUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'})` }}>
            <div className="fullscreen-content-wrapper">
                <div className="fullscreen-top">
                    {/* Placeholder for top actions if needed */}
                </div>

                <div className="fullscreen-bottom">
                    <div className="fullscreen-tags">
                        {item.tags && item.tags.map(tag => (
                            <Tag key={tag} text={tag} color={getTagColor(tag)} />
                        ))}
                    </div>

                    <h2 className="fullscreen-title">{item.title}</h2>

                    <div className="fullscreen-meta">
                        <span className="meta-date">
                            {new Date(item.eventDate || item.publicationDate).toLocaleDateString()}
                        </span>
                        {item.type === 'activity' && (
                            <span className="meta-badge">Actividad</span>
                        )}
                    </div>

                    <p className="fullscreen-summary">
                        {item.summary}
                    </p>

                    <div className="fullscreen-actions" style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                        <button className="fullscreen-action-btn">
                            Leer Más
                        </button>
                        {item.type === 'activity' && (
                            <button
                                className="fullscreen-action-btn primary"
                                onClick={handleInscription}
                                disabled={registering || registered}
                                style={{
                                    background: registered ? '#10b981' : '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    cursor: registered ? 'default' : 'pointer'
                                }}
                            >
                                {registered ? 'Inscrito' : (registering ? '...' : 'Inscribirse')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FullScreenCard;
