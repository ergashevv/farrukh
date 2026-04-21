import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Renderer } from '../components/Renderer/Renderer';

export const LivePage = () => {
  const { slug } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Try local storage first (for instant load of own sites)
      const locallyPublished = localStorage.getItem(`published_${slug}`);
      if (locallyPublished) {
        try {
          setData(JSON.parse(locallyPublished));
        } catch (e) { console.error(e); }
      }

      // 2. Fetch from database (required for other devices like phone)
      try {
        const response = await fetch(`/api/get-site?slug=${slug}`);
        if (response.ok) {
          const remoteData = await response.json();
          setData(remoteData);
        }
      } catch (error) {
        console.error('Failed to fetch from DB:', error);
      }
    };

    fetchData();
  }, [slug]);

  if (!data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter' }}>
        <h2>Page not found</h2>
        <p style={{ color: '#71717a' }}>This site might have been moved or deleted.</p>
        <Link to="/" style={{ marginTop: '1rem', color: '#0ea5e9' }}>Bosh sahifa</Link>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh' }}>
      <Renderer data={data} />
    </div>
  );
};
