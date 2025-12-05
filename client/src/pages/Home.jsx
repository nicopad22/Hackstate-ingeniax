import { useState, useEffect } from 'react'
import Feed from '../components/Feed'
import LoadingScreen from '../components/LoadingScreen'

function Home({ user, type = 'news' }) {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchNews = (pageNum, reset = false) => {
        const url = user ? `/api/news?userId=${user.id}&page=${pageNum}&limit=20` : `/api/news?page=${pageNum}&limit=20`;
        setLoading(true);
        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error('Network response was not ok');
                return res.json();
            })
            .then(data => {
                if (data.length < 20) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }

                if (reset) {
                    setItems(data);
                } else {
                    setItems(prev => [...prev, ...data]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching data:', err);
                setLoading(false);
            })
    };

    useEffect(() => {
        setPage(1);
        fetchNews(1, true);
    }, [user]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchNews(nextPage, false);
    };

    const filteredItems = items.filter(item => item.type === type);
    const title = type === 'news' ? 'News Feed' : 'Activities Feed';

    /* If initial loading and no items, show screen. If loading more, show items + loader/button */
    if (loading && items.length === 0) return <LoadingScreen />

    return (
        <div className="page-container">
            <Feed
                items={filteredItems}
                title={title}
                emptyMessage={`No ${type} items found.`}
                user={user}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                loading={loading}
            />
        </div>
    )
}

export default Home
