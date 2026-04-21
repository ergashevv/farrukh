export const generateId = () => Math.random().toString(36).substr(2, 9);

export const defaultSiteData = {
  id: generateId(),
  theme: 'minimal',
  globalStyle: {
    fontFamily: 'Inter',
    backgroundColor: '#ffffff',
    textColor: '#18181b',
    primaryColor: '#000000',
    borderRadius: '8px',
    buttonStyle: 'filled',
    backgroundGradient: ''
  },
  content: {
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    title: 'Jane Doe',
    subtitle: 'Product Designer & Developer',
    description: 'I build beautiful, scalable, and intuitive web applications.',
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
            { id: generateId(), title: 'My Portfolio', url: 'https://example.com' },
            { id: generateId(), title: 'Book a Call', url: 'https://example.com/book' },
            { id: generateId(), title: 'Latest Project', url: 'https://example.com/project' },
          ]
        }
      },
      {
        id: generateId(),
        type: 'contact',
        data: {
          email: 'hello@example.com',
          phone: '+1 234 567 890'
        }
      }
    ]
  }
};
