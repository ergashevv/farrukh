import React, { useEffect, useState } from 'react';
import { Renderer } from '../components/Renderer/Renderer';
import { defaultSiteData } from '../core/schema';

export const PreviewPage = () => {
  const [data, setData] = useState(defaultSiteData);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'UPDATE_SITE_DATA') {
        setData(event.data.payload);
      }
    };
    window.addEventListener('message', handleMessage);

    // Initial load from local storage if available (useful for direct navigation/publish)
    const stored = localStorage.getItem('draftSiteData');
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch (e) {}
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleReorder = (sourceIndex, destinationIndex) => {
    window.parent.postMessage({ type: 'SECTION_REORDER', sourceIndex, destinationIndex }, '*');
  };

  return (
    <div style={{ width: '100%', height: '100vh', margin: 0, padding: 0 }}>
      {data && <Renderer data={data} onReorder={handleReorder} />}
    </div>
  );
};
