import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, Monitor, Code, Settings, Link2, Share, Check, X, QrCode, GripVertical, Plus, Trash2, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { defaultSiteData, generateId } from '../core/schema';
import { templates, applyTemplate } from '../core/templates';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const patterns = [
  { id: 'none', name: 'None', url: '' },
  { id: 'moroccan', name: 'Sharqona Naqsh', url: 'url("data:image/svg+xml,%3Csvg width=\\\'60\\\' height=\\\'60\\\' viewBox=\\\'0 0 60 60\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\'%3E%3Cg fill=\\\'none\\\' fill-rule=\\\'evenodd\\\'%3E%3Cg fill=\\\'%23000000\\\' fill-opacity=\\\'0.06\\\'%3E%3Cpath d=\\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' },
  { id: 'adras', name: 'Milliy Adras', url: 'url("data:image/svg+xml,%3Csvg width=\\\'40\\\' height=\\\'40\\\' viewBox=\\\'0 0 40 40\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\'%3E%3Cpath d=\\\'M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z\\\' fill=\\\'%23000000\\\' fill-opacity=\\\'0.05\\\' fill-rule=\\\'evenodd\\\'/%3E%3C/svg%3E")' },
  { id: 'dots', name: 'Nuqtali', url: 'url("data:image/svg+xml,%3Csvg width=\\\'20\\\' height=\\\'20\\\' viewBox=\\\'0 0 20 20\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\'%3E%3Cg fill=\\\'%23000000\\\' fill-opacity=\\\'0.05\\\' fill-rule=\\\'evenodd\\\'%3E%3Ccircle cx=\\\'3\\\' cy=\\\'3\\\' r=\\\'3\\\'/%3E%3Ccircle cx=\\\'13\\\' cy=\\\'13\\\' r=\\\'3\\\'/%3E%3C/g%3E%3C/svg%3E")' }
];

const exampleImages = [
  { id: 'img1', name: 'Silk Adras', url: 'url("/assets/bg_adras.png")' },
  { id: 'img2', name: 'Zarhal Naqsh', url: 'url("/assets/bg_islamic.png")' }
];

export const Builder = () => {
  const [siteData, setSiteData] = useState(() => {
    const saved = localStorage.getItem('draftSiteData');
    return saved ? JSON.parse(saved) : defaultSiteData;
  });
  
  const [activeTab, setActiveTab] = useState('design');
  const [previewMode, setPreviewMode] = useState('mobile');
  const [publishModal, setPublishModal] = useState({ open: false, slug: '', copied: false });
  const iframeRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('draftSiteData', JSON.stringify(siteData));
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'UPDATE_SITE_DATA', payload: siteData }, '*');
    }
  }, [siteData]);

  useEffect(() => {
    const handleIframeMessage = (e) => {
      if (e.data?.type === 'SECTION_REORDER') {
        setSiteData(prev => {
          const newSections = Array.from(prev.content.sections || []);
          const [moved] = newSections.splice(e.data.sourceIndex, 1);
          newSections.splice(e.data.destinationIndex, 0, moved);
          return { ...prev, content: { ...prev.content, sections: newSections } };
        });
      }
    };
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  const handleIframeLoad = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'UPDATE_SITE_DATA', payload: siteData }, '*');
    }
  };

  const handleTemplateSelect = (templateId) => setSiteData(applyTemplate(siteData, templateId));

  const handleGlobalStyleChange = (key, value) => {
    setSiteData({ ...siteData, globalStyle: { ...siteData.globalStyle, [key]: value } });
  };

  const handleContentChange = (key, value) => {
    setSiteData({ ...siteData, content: { ...siteData.content, [key]: value } });
  };

  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
       handleGlobalStyleChange('backgroundImage', `url(${event.target.result})`);
    };
    reader.readAsDataURL(file);
  };

  // Sections management
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    if (result.type === 'item') {
      const sectionId = result.source.droppableId.replace('items-', '');
      const section = siteData.content.sections.find(s => s.id === sectionId);
      if (!section) return;
      const newItems = Array.from(section.data.items || []);
      const [moved] = newItems.splice(result.source.index, 1);
      newItems.splice(result.destination.index, 0, moved);
      updateSectionData(sectionId, { items: newItems });
      return;
    }

    const newSections = Array.from(siteData.content.sections || []);
    const [reorderedItem] = newSections.splice(result.source.index, 1);
    newSections.splice(result.destination.index, 0, reorderedItem);
    handleContentChange('sections', newSections);
  };

  const moveSection = (index, direction) => {
    const newSections = [...siteData.content.sections];
    if (direction === 'up' && index > 0) {
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    } else if (direction === 'down' && index < newSections.length - 1) {
      [newSections[index + 1], newSections[index]] = [newSections[index], newSections[index + 1]];
    }
    handleContentChange('sections', newSections);
  };

  const removeSection = (index) => {
    const newSections = [...siteData.content.sections];
    newSections.splice(index, 1);
    handleContentChange('sections', newSections);
  };

  const addSection = (type) => {
    const newSection = { id: generateId(), type, data: {} };
    if (type === 'links' || type === 'social') newSection.data.items = [{ id: generateId(), title: 'New Item', url: 'https://', platform: 'twitter' }];
    if (type === 'contact') newSection.data = { email: '', phone: '' };
    if (type === 'text') newSection.data = { text: 'New text block' };
    
    handleContentChange('sections', [...siteData.content.sections, newSection]);
  };

  const updateSectionData = (sectionId, updatedData) => {
    const newSections = siteData.content.sections.map(s => s.id === sectionId ? { ...s, data: updatedData } : s);
    handleContentChange('sections', newSections);
  };

  // Publish
  const handlePublish = () => {
    const defaultSlug = siteData.content.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || generateId();
    setPublishModal({ open: true, slug: defaultSlug, copied: false });
  };

  const confirmPublish = async () => {
    setPublishModal(prev => ({ ...prev, isPublishing: true }));
    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: publishModal.slug,
          data: siteData
        })
      });

      if (!response.ok) throw new Error('Failed to publish');

      const liveUrl = `${window.location.origin}/${publishModal.slug}`;
      localStorage.setItem(`published_${publishModal.slug}`, JSON.stringify(siteData)); // Keep local as cache
      setPublishModal({ ...publishModal, publishedUrl: liveUrl, isPublishing: false });
    } catch (error) {
      console.error('Publish error:', error);
      alert('Failed to publish site. Please try again.');
      setPublishModal(prev => ({ ...prev, isPublishing: false }));
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Editor */}
      <div className="editor-sidebar">
        <div className="editor-header">
          <div className="flex items-center gap-2">
            <QrCode className="text-primary-color" size={24} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Mini Site Builder</h2>
          </div>
          <button className="btn btn-primary" onClick={handlePublish}>Publish</button>
        </div>

        <div className="flex border-b" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', position: 'sticky', top: '73px', zIndex: 9 }}>
          <button 
            style={{ flex: 1, padding: '1rem', borderBottom: activeTab === 'design' ? '2px solid var(--primary-color)' : '2px solid transparent', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', fontWeight: 600, color: activeTab === 'design' ? 'var(--primary-color)' : 'var(--text-secondary)' }}
            onClick={() => setActiveTab('design')}
          >
            Design
          </button>
          <button 
            style={{ flex: 1, padding: '1rem', borderBottom: activeTab === 'content' ? '2px solid var(--primary-color)' : '2px solid transparent', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', fontWeight: 600, color: activeTab === 'content' ? 'var(--primary-color)' : 'var(--text-secondary)' }}
            onClick={() => setActiveTab('content')}
          >
            Content
          </button>
        </div>

        {activeTab === 'design' && (
          <div>
            <div className="editor-section">
              <span className="label">Templates</span>
              <div className="template-grid mt-4">
                {templates.map(t => (
                  <div 
                    key={t.id} 
                    className={`card template-card ${siteData.theme === t.id ? 'active' : ''}`}
                    onClick={() => handleTemplateSelect(t.id)}
                    style={{
                      background: t.style.backgroundGradient || t.style.backgroundColor,
                      color: t.style.textColor, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80px', fontFamily: t.style.fontFamily === 'Outfit' ? '"Outfit", sans-serif' : '"Inter", sans-serif',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="editor-section">
              <span className="label">Colors</span>
              <div className="flex-col gap-3 mt-4">
                <div className="flex justify-between items-center">
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Background</span>
                  <input type="color" value={siteData.globalStyle.backgroundColor} onChange={(e) => handleGlobalStyleChange('backgroundColor', e.target.value)} style={{ width: '40px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Text</span>
                  <input type="color" value={siteData.globalStyle.textColor} onChange={(e) => handleGlobalStyleChange('textColor', e.target.value)} style={{ width: '40px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Primary / Accent</span>
                  <input type="color" value={siteData.globalStyle.primaryColor} onChange={(e) => handleGlobalStyleChange('primaryColor', e.target.value)} style={{ width: '40px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                </div>
              </div>
            </div>

            <div className="editor-section">
              <span className="label">Background & Patterns</span>
              <div className="flex-col gap-3 mt-4">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Patterns</span>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {patterns.map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => handleGlobalStyleChange('backgroundImage', p.url)}
                      className={`btn ${siteData.globalStyle.backgroundImage === p.url ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '0.4rem', fontSize: '0.7rem' }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Example Layouts</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                   {exampleImages.map(img => (
                      <div 
                         key={img.id}
                         onClick={() => handleGlobalStyleChange('backgroundImage', img.url)}
                         style={{
                            height: '60px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundImage: img.url,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            cursor: 'pointer',
                            border: siteData.globalStyle.backgroundImage === img.url ? '2px solid var(--primary-color)' : '2px solid transparent',
                            display: 'flex', alignItems: 'flex-end', padding: '4px'
                         }}
                      >
                         <span style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '10px', padding: '2px 4px', borderRadius: '4px' }}>{img.name}</span>
                      </div>
                   ))}
                </div>

                <div style={{ position: 'relative', width: '100%', marginTop: '0.5rem' }}>
                  <label htmlFor="bg-upload" className="btn btn-secondary w-full" style={{ borderStyle: 'dashed', borderWidth: '2px', borderColor: 'var(--border-color)', padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-tertiary)', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>Upload Custom Image</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>JPG, PNG or WEBP</span>
                  </label>
                  <input id="bg-upload" type="file" accept="image/*" onChange={handleBgUpload} style={{ display: 'none' }} />
                </div>
              </div>
            </div>

            <div className="editor-section">
              <span className="label">Styling</span>
              <div className="flex-col gap-3 mt-4">
                <div>
                  <span style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Button Style</span>
                  <select className="input-field" value={siteData.globalStyle.buttonStyle} onChange={(e) => handleGlobalStyleChange('buttonStyle', e.target.value)}>
                    <option value="filled">Filled</option>
                    <option value="outline">Outline</option>
                    <option value="soft">Soft</option>
                    <option value="glass">Glassmorphism</option>
                  </select>
                </div>
                <div>
                  <span style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Border Radius</span>
                  <select className="input-field" value={siteData.globalStyle.borderRadius} onChange={(e) => handleGlobalStyleChange('borderRadius', e.target.value)}>
                    <option value="0px">Sharp</option>
                    <option value="8px">Rounded</option>
                    <option value="16px">Smooth</option>
                    <option value="9999px">Pill</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div>
            <div className="editor-section">
              <span className="label">Profile Information</span>
              <div className="flex-col gap-3 mt-4">
                <input type="text" placeholder="Avatar URL" className="input-field" value={siteData.content.avatar} onChange={(e) => handleContentChange('avatar', e.target.value)} />
                <input type="text" placeholder="Title / Name" className="input-field" value={siteData.content.title} onChange={(e) => handleContentChange('title', e.target.value)} />
                <input type="text" placeholder="Subtitle" className="input-field" value={siteData.content.subtitle} onChange={(e) => handleContentChange('subtitle', e.target.value)} />
                <textarea placeholder="Description" className="input-field" style={{ minHeight: '80px', resize: 'vertical' }} value={siteData.content.description} onChange={(e) => handleContentChange('description', e.target.value)} />
              </div>
            </div>

            <div className="editor-section">
              <span className="label">Sections</span>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="sections-list" type="section">
                  {(provided) => (
                    <div className="flex-col gap-3 mt-4" {...provided.droppableProps} ref={provided.innerRef}>
                      {siteData.content.sections?.map((section, idx) => (
                        <Draggable key={section.id} draggableId={section.id} index={idx}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef} 
                              {...provided.draggableProps}
                              className="card relative p-4 flex-col gap-3" 
                              style={{ 
                                background: 'var(--bg-primary)', 
                                opacity: snapshot.isDragging ? 0.9 : 1,
                                boxShadow: snapshot.isDragging ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                                ...provided.draggableProps.style 
                              }}
                            >
                              <div className="flex justify-between items-center border-b pb-2 mb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <div className="flex items-center gap-2">
                                  <div {...provided.dragHandleProps} style={{ cursor: 'grab', display: 'flex', color: 'var(--text-muted)' }}>
                                    <GripVertical size={16} />
                                  </div>
                                  <span style={{ fontWeight: 600, textTransform: 'capitalize', fontSize: '0.875rem' }}>{section.type} Block</span>
                                </div>
                                <div className="flex gap-1">
                                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => moveSection(idx, 'up')}><ArrowUp size={16} /></button>
                                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => moveSection(idx, 'down')}><ArrowDown size={16} /></button>
                                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} onClick={() => removeSection(idx)}><Trash2 size={16} /></button>
                                </div>
                              </div>

                    {(section.type === 'links' || section.type === 'social') && (
                      <Droppable droppableId={`items-${section.id}`} type="item">
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className="flex-col gap-2">
                            {section.data.items?.map((item, i) => (
                              <Draggable key={item.id} draggableId={item.id} index={i}>
                                {(provided, snapshot) => (
                                  <div 
                                    ref={provided.innerRef} 
                                    {...provided.draggableProps} 
                                    className={`flex${section.type === 'links' ? '-col' : ''} gap-2 p-2`} 
                                    style={{ 
                                      background: 'var(--bg-secondary)', 
                                      borderRadius: 'var(--radius-sm)', 
                                      border: '1px solid var(--border-color)',
                                      opacity: snapshot.isDragging ? 0.9 : 1,
                                      ...provided.draggableProps.style 
                                    }}
                                  >
                                    {section.type === 'links' ? (
                                      <>
                                        <div className="flex gap-2 items-center">
                                          <div {...provided.dragHandleProps} style={{ cursor: 'grab', display: 'flex' }}><GripVertical size={16} color="var(--text-muted)" /></div>
                                          <input type="text" className="input-field" value={item.title} onChange={(e) => {
                                            const newItems = [...section.data.items]; newItems[i].title = e.target.value; updateSectionData(section.id, { items: newItems });
                                          }} placeholder="Link Title" />
                                        </div>
                                        <input type="text" className="input-field" value={item.url} onChange={(e) => {
                                          const newItems = [...section.data.items]; newItems[i].url = e.target.value; updateSectionData(section.id, { items: newItems });
                                        }} placeholder="URL" />
                                      </>
                                    ) : (
                                      <div className="flex gap-2 items-center w-full">
                                        <div {...provided.dragHandleProps} style={{ cursor: 'grab', display: 'flex' }}><GripVertical size={16} color="var(--text-muted)" /></div>
                                        <select className="input-field" style={{ width: '40%' }} value={item.platform} onChange={(e) => {
                                            const newItems = [...section.data.items]; newItems[i].platform = e.target.value; updateSectionData(section.id, { items: newItems });
                                        }}>
                                            <option value="twitter">Twitter</option>
                                            <option value="instagram">Instagram</option>
                                            <option value="github">Github</option>
                                            <option value="linkedin">LinkedIn</option>
                                            <option value="youtube">YouTube</option>
                                            <option value="telegram">Telegram</option>
                                        </select>
                                        <input type="text" className="input-field" style={{ width: '60%' }} value={item.url} onChange={(e) => {
                                          const newItems = [...section.data.items]; newItems[i].url = e.target.value; updateSectionData(section.id, { items: newItems });
                                        }} placeholder="URL" />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    )}

                    {section.type === 'links' && (
                       <button className="btn btn-secondary w-full mt-2" style={{ fontSize: '0.75rem' }} onClick={() => updateSectionData(section.id, { items: [...section.data.items, { id: generateId(), title: 'New Link', url: '' }] })}>+ Add Link</button>
                    )}

                    {section.type === 'social' && (
                       <button className="btn btn-secondary w-full" style={{ fontSize: '0.75rem' }} onClick={() => updateSectionData(section.id, { items: [...section.data.items, { id: generateId(), platform: 'twitter', url: '' }] })}>+ Add Social</button>
                    )}

                    {section.type === 'text' && (
                      <textarea className="input-field" style={{ minHeight: '80px', resize: 'vertical' }} value={section.data.text} onChange={(e) => updateSectionData(section.id, { text: e.target.value })} placeholder="Write something..." />
                    )}

                    {section.type === 'contact' && (
                      <div className="flex-col gap-2">
                        <input type="email" className="input-field" value={section.data.email} onChange={(e) => updateSectionData(section.id, { ...section.data, email: e.target.value })} placeholder="Email address" />
                        <input type="text" className="input-field" value={section.data.phone} onChange={(e) => updateSectionData(section.id, { ...section.data, phone: e.target.value })} placeholder="Phone number" />
                      </div>
                    )}
                  </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
                
              <div className="flex gap-2 mt-4" style={{ flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary flex-1" onClick={() => addSection('links')}><Plus size={14}/> Links</button>
                  <button className="btn btn-secondary flex-1" onClick={() => addSection('social')}><Plus size={14}/> Social</button>
                  <button className="btn btn-secondary flex-1" onClick={() => addSection('text')}><Plus size={14}/> Text</button>
                  <button className="btn btn-secondary flex-1" onClick={() => addSection('contact')}><Plus size={14}/> Contact</button>
                </div>
              </div>
            </div>
        )}
      </div>

      {/* Live Preview Container */}
      <div className="preview-container" style={{ background: '#e4e4e7', backgroundImage: 'radial-gradient(#d4d4d8 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        <div className="preview-toolbar">
          <button className={`btn ${previewMode === 'desktop' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem' }} onClick={() => setPreviewMode('desktop')} title="Desktop View"><Monitor size={18} /></button>
          <button className={`btn ${previewMode === 'mobile' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem' }} onClick={() => setPreviewMode('mobile')} title="Mobile View"><Smartphone size={18} /></button>
        </div>

        <div className={`preview-wrapper ${previewMode}`}>
          <iframe ref={iframeRef} src="/preview" title="Live Preview" style={{ width: '100%', height: '100%', border: 'none' }} onLoad={handleIframeLoad} />
        </div>
      </div>

      {/* Publish Modal */}
      {publishModal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '480px', maxWidth: '90%', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
            <button style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setPublishModal({ open: false, slug: '', copied: false })}><X size={24} /></button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Publish Your Site</h2>
            
            {!publishModal.publishedUrl ? (
              <>
                <div>
                  <span className="label">Custom URL Slug</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span style={{ color: 'var(--text-secondary)' }}>edevzi.xyz/</span>
                    <input type="text" className="input-field" value={publishModal.slug} onChange={(e) => setPublishModal({ ...publishModal, slug: e.target.value })} />
                  </div>
                </div>
                                <button 
                  className="btn btn-primary w-full" 
                  style={{ padding: '0.75rem', fontSize: '1rem', opacity: publishModal.isPublishing ? 0.7 : 1 }} 
                  onClick={confirmPublish}
                  disabled={publishModal.isPublishing}
                >
                  {publishModal.isPublishing ? 'Publishing...' : 'Confirm & Deploy'}
                </button>

              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Check size={20} /><span>Site Published Successfully!</span></div>
                <div style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}><QRCodeSVG value={publishModal.publishedUrl} size={180} level="H" includeMargin={true} /></div>
                <div className="w-full flex items-center justify-between p-2" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)' }}>
                  <span style={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px', color: 'var(--text-secondary)' }}>{publishModal.publishedUrl}</span>
                  <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem' }} onClick={() => { navigator.clipboard.writeText(publishModal.publishedUrl); setPublishModal({ ...publishModal, copied: true }); }}>
                    {publishModal.copied ? <Check size={16}/> : <Share size={16}/>}
                  </button>
                </div>
                <a className="btn btn-secondary w-full" href={`/${publishModal.slug}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>Open Live Site <ExternalLink size={16} /></a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
