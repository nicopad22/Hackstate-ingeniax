import { useState } from 'react';
import FullScreenCard from './FullScreenCard';
import Card from './Card';

function Feed({ items, title, emptyMessage, user, onLoadMore, hasMore, loading }) {
    const [viewMode, setViewMode] = useState('fullscreen'); // 'fullscreen' | 'list'

    if (items.length === 0) {
        return (
            <div className="empty-state-container">
                <p>{emptyMessage || 'No items found.'}</p>
            </div>
        );
    }

    return (
        <div className={`feed-container mode-${viewMode}`}>
            {/* Floating Toggle for View Mode */}
            <div className="floating-view-toggle">
                <button
                    onClick={() => setViewMode('fullscreen')}
                    className={`toggle-pill ${viewMode === 'fullscreen' ? 'active' : ''}`}
                    aria-label="Fullscreen View"
                >
                    Full
                </button>
                <button
                    onClick={() => setViewMode('list')}
                    className={`toggle-pill ${viewMode === 'list' ? 'active' : ''}`}
                    aria-label="List View"
                >
                    List
                </button>
            </div>

            <div className="feed-content-area">
                {viewMode === 'fullscreen' ? (
                    <div className="snap-scroll-container">
                        {items.map(item => (
                            <FullScreenCard key={item.id} item={item} user={user} />
                        ))}
                        {hasMore && (
                            <div className="fullscreen-card load-more-slide" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#black' }}>
                                <button
                                    onClick={onLoadMore}
                                    className="fullscreen-action-btn"
                                    disabled={loading}
                                >
                                    {loading ? 'Loading...' : 'Load More Records'}
                                </button>
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
                        {hasMore && (
                            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                                <button
                                    onClick={onLoadMore}
                                    className="fullscreen-action-btn"
                                    style={{ background: '#002674', color: 'white' }}
                                    disabled={loading}
                                >
                                    {loading ? 'Loading...' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Feed;
