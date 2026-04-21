import React, { useEffect, useState } from 'react';
import { Renderer } from '../components/Renderer/Renderer';
import { defaultSiteData } from '../core/schema';

function loadDraftFromStorage() {
  try {
    const stored = localStorage.getItem('draftSiteData');
    if (stored) return JSON.parse(stored);
  } catch {
    /* ignore */
  }
  return defaultSiteData;
}

export const PreviewPage = () => {
  const [data, setData] = useState(loadDraftFromStorage);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'UPDATE_SITE_DATA') {
        setData(event.data.payload);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleReorder = (sourceIndex, destinationIndex) => {
    window.parent.postMessage({ type: 'SECTION_REORDER', sourceIndex, destinationIndex }, '*');
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        margin: 0,
        padding: 0,
        paddingTop: 'max(4px, env(safe-area-inset-top, 0px))',
        boxSizing: 'border-box'
      }}
    >
      {data && <Renderer data={data} onReorder={handleReorder} />}
    </div>
  );
};
