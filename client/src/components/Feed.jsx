import { useState } from 'react';
import FullScreenCard from './FullScreenCard';
import Card from './Card';

function Feed({ items, title, emptyMessage, user, onLoadMore, hasMore, loading }) {
    const [viewMode, setViewMode] = useState('fullscreen'); // 'fullscreen' | 'list'

    // Early return removed to allow Load More on empty filtered lists
    // if (items.length === 0) { ... }

    return (
        <div className={`feed-container mode-${viewMode}`}>
            {/* Floating Toggle for View Mode */}
            <div className="floating-view-toggle">
                <button
                    onClick={() => setViewMode('fullscreen')}
                    className={`toggle-pill ${viewMode === 'fullscreen' ? 'active' : ''}`}
                    aria-label="Fullscreen View"
                >
                    Completo
                </button>
                <button
                    onClick={() => setViewMode('list')}
                    className={`toggle-pill ${viewMode === 'list' ? 'active' : ''}`}
                    aria-label="List View"
                >
                    Lista
                </button>
            </div>

            <div className="feed-content-area">
                {items.length === 0 && !loading && !hasMore ? (
                    <div className="empty-state-container" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                        <p>{emptyMessage || 'No se encontraron elementos.'}</p>
                    </div>
                ) : viewMode === 'fullscreen' ? (
                    <div className="snap-scroll-container">
                        {items.map(item => (
                            <FullScreenCard key={item.id} item={item} user={user} />
                        ))}
                        {hasMore ? (
                            <div className="fullscreen-card load-more-slide" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'black' }}>
                                <button
                                    onClick={onLoadMore}
                                    className="fullscreen-action-btn"
                                    disabled={loading}
                                >
                                    {loading ? 'Cargando...' : 'Cargar Más Registros'}
                                </button>
                            </div>
                        ) : (
                            <div className="fullscreen-card load-more-slide" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'black' }}>
                                <p style={{ color: 'white' }}>No hay más registros.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="list-scroll-container container">
                        <h2 className="list-title">{title}</h2>
                        <div className="card-grid list">
                            {items.map(item => (
                                <Card key={item.id} item={item} layout="list" user={user} />
                            ))}
                        </div>
                        {hasMore ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                                <button
                                    onClick={onLoadMore}
                                    className="fullscreen-action-btn"
                                    style={{ background: '#002674', color: 'white' }}
                                    disabled={loading}
                                >
                                    {loading ? 'Cargando...' : 'Cargar Más'}
                                </button>
                            </div>
                        ) : (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
                                <p>No hay más registros.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Feed;
