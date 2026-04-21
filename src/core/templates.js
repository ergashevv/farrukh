export const templates = [
  {
    id: 'minimal',
    name: 'Minimal Light',
    style: {
      fontFamily: 'Inter',
      backgroundColor: '#f9fafb',
      textColor: '#1f2937',
      primaryColor: '#000000',
      borderRadius: '8px',
      buttonStyle: 'filled',
      backgroundGradient: ''
    }
  },
  {
    id: 'dark',
    name: 'Midnight Dark',
    style: {
      fontFamily: 'Inter',
      backgroundColor: '#0f172a',
      textColor: '#f8fafc',
      primaryColor: '#38bdf8',
      borderRadius: '12px',
      buttonStyle: 'soft',
      backgroundGradient: ''
    }
  },
  {
    id: 'glass',
    name: 'Glassmorphism',
    style: {
      fontFamily: 'Outfit',
      backgroundColor: '#ffffff',
      backgroundGradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      textColor: '#1e293b',
      primaryColor: '#ec4899',
      borderRadius: '24px',
      buttonStyle: 'glass',
    }
  },
  {
    id: 'luxury',
    name: 'Luxury Elegance',
    style: {
      fontFamily: 'Outfit',
      backgroundColor: '#1c1917',
      textColor: '#fef3c7',
      primaryColor: '#d97706',
      borderRadius: '0px',
      buttonStyle: 'outline',
      backgroundGradient: ''
    }
  },
  {
    id: 'colorful',
    name: 'Bold Colorful',
    style: {
      fontFamily: 'Outfit',
      backgroundColor: '#4f46e5',
      textColor: '#ffffff',
      primaryColor: '#fbbf24',
      borderRadius: '9999px',
      buttonStyle: 'filled',
      backgroundGradient: ''
    }
  }
];

export const applyTemplate = (siteData, templateId) => {
  const template = templates.find(t => t.id === templateId);
  if (!template) return siteData;
  return {
    ...siteData,
    theme: templateId,
    globalStyle: {
      ...template.style,
      scrollAnimation: siteData.globalStyle?.scrollAnimation ?? 'none',
    },
  };
};
