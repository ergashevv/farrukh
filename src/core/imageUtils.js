/**
 * Downscale large photos so draft fits in localStorage and preview postMessage stays reliable.
 */
export function fileToAvatarDataUrl(file, maxEdge = 512) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const img = new Image();
      img.onload = () => {
        try {
          let w = img.naturalWidth;
          let h = img.naturalHeight;
          if (!w || !h) {
            resolve(dataUrl);
            return;
          }
          if (w <= maxEdge && h <= maxEdge) {
            resolve(dataUrl);
            return;
          }
          const r = Math.min(maxEdge / w, maxEdge / h);
          w = Math.round(w * r);
          h = Math.round(h * r);
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const usePng = file.type === 'image/png';
          resolve(canvas.toDataURL(usePng ? 'image/png' : 'image/jpeg', usePng ? undefined : 0.88));
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}
