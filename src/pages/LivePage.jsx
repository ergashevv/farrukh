import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Renderer } from '../components/Renderer/Renderer';

export const LivePage = () => {
  const { slug } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    // In a real app, this would fetch from a database by slug
    const published = localStorage.getItem(`published_${slug}`);
    if (published) {
      try {
        setData(JSON.parse(published));
      } catch (e) {
        console.error(e);
      }
    }
  }, [slug]);

  if (!data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter' }}>
        <h2>Page not found</h2>
        <p style={{ color: '#71717a' }}>This site might have been moved or deleted.</p>
        <Link to="/" style={{ marginTop: '1rem', color: '#0ea5e9' }}>Go to Builder</Link>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh' }}>
      <Renderer data={data} />
    </div>
  );
};
