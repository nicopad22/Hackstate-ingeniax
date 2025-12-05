import { useState, useEffect } from 'react'
import Feed from '../components/Feed'
import LoadingScreen from '../components/LoadingScreen'

function Home({ user, type = 'news' }) {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        let active = true;
        setPage(1);
        setLoading(true);

        const fetchItems = () => {
            let url = `/api/news?page=1&limit=20&type=${type}`;
            if (user) {
                url += `&userId=${user.id}`;
            }

            fetch(url)
                .then(res => {
                    if (!res.ok) throw new Error('Network response was not ok');
                    return res.json();
                })
                .then(data => {
                    if (active) {
                        if (data.length < 20) {
                            setHasMore(false);
                        } else {
                            setHasMore(true);
                        }
                        setItems(data);
                        setLoading(false);
                    }
                })
                .catch(err => {
                    if (active) {
                        console.error('Error fetching data:', err);
                        setLoading(false);
                    }
                });
        };

        fetchItems();
        window.scrollTo(0, 0);

        return () => {
            active = false;
        };
    }, [user, type]);

    const fetchNews = (pageNum) => {
        let url = `/api/news?page=${pageNum}&limit=20&type=${type}`;
        if (user) {
            url += `&userId=${user.id}`;
        }

        // We assume load more doesn't have the race condition issue as severely 
        // because it's user triggered, but ideally we'd manage that too.
        // For the main switching issue, the useEffect above handles it.
        // But we need to keep fetchNews for "Load More".

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
                setItems(prev => [...prev, ...data]);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching data:', err);
                setLoading(false);
            })
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchNews(nextPage, false);
    };

    const title = type === 'news' ? 'Muro de Noticias' : 'Muro de Actividades';

    /* If initial loading and no items, show screen. If loading more, show items + loader/button */
    if (loading && items.length === 0) return <LoadingScreen />

    return (
        <div className="page-container">
            <Feed
                items={items}
                title={title}
                emptyMessage={`No se encontraron ${type === 'news' ? 'noticias' : 'actividades'}.`}
                user={user}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                loading={loading}
            />
        </div>
    )
}

export default Home
