export const generateId = () => Math.random().toString(36).substr(2, 9);

export const defaultQrStyle = {
  fgColor: '#000000',
  bgColor: '#ffffff',
  level: 'H',
  size: 256,
  includeMargin: true,
  logoUrl: '',
  logoSize: 22,
};

export const defaultSiteData = {
  id: generateId(),
  theme: 'minimal',
  lang: 'uz', // default language
  qrStyle: { ...defaultQrStyle },
  seo: {
    pageTitle: { uz: '', ru: '', en: '' },
    description: { uz: '', ru: '', en: '' },
    ogImage: '',
  },
  privacy: {
    enabled: false,
    password: '',
    expiresAt: '',
  },
  globalStyle: {
    fontFamily: 'Inter',
    backgroundColor: '#ffffff',
    textColor: '#18181b',
    primaryColor: '#000000',
    borderRadius: '8px',
    buttonStyle: 'filled',
    backgroundGradient: '',
    scrollAnimation: 'none',
    headerButtons: [] // New: customizable header buttons
  },
  content: {
    avatar: '',
    avatarShape: 'circle',
    title: { uz: 'Jane Doe', ru: 'Jane Doe', en: 'Jane Doe' },
    subtitle: { uz: 'Product Designer & Developer', ru: 'Дизайнер продукта и разработчик', en: 'Product Designer & Developer' },
    description: { uz: 'I build beautiful, scalable, and intuitive web applications.', ru: 'Я создаю красивые, масштабируемые и интуитивно понятные веб-приложения.', en: 'I build beautiful, scalable, and intuitive web applications.' },
    sections: [
      {
        id: generateId(),
        type: 'social',
        data: {
          items: [
            { id: generateId(), platform: 'twitter', url: 'https://twitter.com' },
            { id: generateId(), platform: 'instagram', url: 'https://instagram.com' },
            { id: generateId(), platform: 'github', url: 'https://github.com' }
          ]
        }
      },
      {
        id: generateId(),
        type: 'links',
        data: {
          items: [
            { id: generateId(), title: { uz: 'My Portfolio', ru: 'Мое Портфолио', en: 'My Portfolio' }, url: 'https://example.com' },
            { id: generateId(), title: { uz: 'Book a Call', ru: 'Забронировать звонок', en: 'Book a Call' }, url: 'https://example.com/book' },
            { id: generateId(), title: { uz: 'Latest Project', ru: 'Последний проект', en: 'Latest Project' }, url: 'https://example.com/project' },
          ]
        }
      },
      {
        id: generateId(),
        type: 'contact',
        data: {
          items: [
            { id: generateId(), type: 'email', value: 'hello@example.com', label: { uz: 'Email', ru: 'Email', en: 'Email' } },
            { id: generateId(), type: 'phone', value: '+1 234 567 890', label: { uz: 'Telefon', ru: 'Телефон', en: 'Call' } },
            { id: generateId(), type: 'website', value: '', label: { uz: 'Website', ru: 'Сайт', en: 'Website' } }
          ]
        }
      }
    ]
  }
};

/** Yangi loyiha: shablon + barcha id lar yangi (localStorage qoralamasidan mustaqil). */
export function createFreshDefaultSiteData() {
  const fresh = JSON.parse(JSON.stringify(defaultSiteData));
  fresh.id = generateId();
  for (const section of fresh.content.sections) {
    section.id = generateId();
    if (Array.isArray(section.data?.items)) {
      for (const it of section.data.items) {
        it.id = generateId();
      }
    }
  }
  return fresh;
}
