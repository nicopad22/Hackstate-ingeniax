
import { useState, useEffect } from 'react'
import Card from './components/Card'
import './App.css'

function App() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

  useEffect(() => {
    fetch('/api/news')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setLoading(false);
      })
  }, [])

  const activities = items.filter(item => item.type === 'activity')
  const news = items.filter(item => item.type === 'news')

  const toggleView = (mode) => setViewMode(mode)

  if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading events...</div>

  return (
    <div className="app-container">
      {/* Header */}
      <header className="main-header">
        <div className="container header-content">
          <div className="logo-section">
            <h1 className="logo-title">Hackstate Ingeniax</h1>
            <p className="logo-subtitle">Events & News Portal</p>
          </div>

          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => toggleView('grid')}
              aria-label="Grid View"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
            <button
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => toggleView('list')}
              aria-label="List View"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </header>



      <main className="container main-content">


        {/* Activities Section */}
        {activities.length > 0 && (
          <section className="feed-section">
            <h2 className="section-title">Upcoming Activities</h2>
            <div className={`card-grid ${viewMode}`}>
              {activities.map(item => (
                <Card key={item.id} item={item} layout={viewMode} />
              ))}
            </div>
          </section>
        )}

        {/* News Section */}
        {news.length > 0 && (
          <section className="feed-section">
            <h2 className="section-title">Latest News</h2>
            <div className={`card-grid ${viewMode}`}>
              {news.map(item => (
                <Card key={item.id} item={item} layout={viewMode} />
              ))}
            </div>
          </section>
        )}

        {items.length === 0 && (
          <div className="empty-state">
            <p>No events found. Please check back later.</p>
          </div>
        )}

      </main>

      <footer className="main-footer">
        <div className="container">
          <p>&copy; 2024 Hackstate Ingeniax. Powered by AI Agents.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
