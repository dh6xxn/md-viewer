import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { open, save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import {
  Code2, FileText, FolderOpen, Image, List, ListOrdered, Moon, Plus, Quote, Search, Settings, Sun, Type,
  Bold, Italic, Link, Save, Columns3, X, CheckSquare, MoreHorizontal, Maximize2, FilePlus2, Wand2,
  GripVertical, Heading, Table, Minus, LayoutTemplate,
} from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import Widget from './Widget';
import { autoFormat } from './autoFormat';
import { parseBlocks, serializeBlocks, blockLabel, newBlock, BLOCK_TEMPLATES, type Block, type BlockType } from './blocks';
import { TEMPLATES } from './templates';
import './styles.css';

const blockIcon = (t: BlockType) => ({ heading: Heading, list: List, quote: Quote, code: Code2, table: Table, image: Image, paragraph: Type }[t]);
const insertOptions: { type: keyof typeof BLOCK_TEMPLATES; label: string; icon: typeof Heading }[] = [
  { type: 'heading', label: 'Heading', icon: Heading },
  { type: 'paragraph', label: 'Paragraph', icon: Type },
  { type: 'list', label: 'List', icon: List },
  { type: 'quote', label: 'Quote', icon: Quote },
  { type: 'code', label: 'Code', icon: Code2 },
  { type: 'table', label: 'Table', icon: Table },
  { type: 'image', label: 'Image', icon: Image },
  { type: 'divider', label: 'Divider', icon: Minus },
];

const starter = '# Markdown Viewer\n\nOpen a Markdown file to begin. Everything is saved locally on your computer.\n\n## Getting started\n\n- Use **Open File** to open a `.md` file.\n- Use **Open Folder** to browse a documentation folder.\n- Edit the Markdown and press **Ctrl+S** to save.\n- Switch between Edit, Preview and Split views.\n- Right-click any block in Preview to bold, italic, color or delete it.\n';

type ViewMode = 'edit' | 'preview' | 'split';
type Heading = { text: string; level: number; id: string };

function slugify(text: string, index: number) {
  const slug = text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
  return `${slug || 'section'}-${index}`;
}

function App() {
  const [content, setContent] = useState(starter);
  const [mode, setMode] = useState<ViewMode>('split');
  const [dark, setDark] = useState(true);
  const [sidebar, setSidebar] = useState(true);
  const [search, setSearch] = useState('');
  const [fontScale, setFontScale] = useState(1);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState('Untitled.md');
  const [files, setFiles] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Ready');
  const [rightTab, setRightTab] = useState<'toc' | 'blocks' | 'templates'>('toc');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [rightWidth, setRightWidth] = useState(245);

  const startRightResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX, startWidth = rightWidth;
    const onMove = (ev: MouseEvent) => setRightWidth(Math.min(480, Math.max(200, startWidth + (startX - ev.clientX))));
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const blocks = useMemo<Block[]>(() => parseBlocks(content), [content]);

  const { headings, anchorByBlockId } = useMemo(() => {
    let n = 0;
    const list: Heading[] = [];
    const map = new Map<string, string>();
    for (const b of blocks) {
      if (b.type !== 'heading') continue;
      const m = b.text.match(/^(#{1,6})\s+(.+)$/);
      if (!m || m[1].length > 3) continue;
      const id = slugify(m[2].trim(), n++);
      list.push({ text: m[2].trim(), level: m[1].length, id });
      map.set(b.id, id);
    }
    return { headings: list, anchorByBlockId: map };
  }, [blocks]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const showError = (e: unknown) => setMessage((e instanceof Error ? e.message : String(e)).replace(/^Error:\s*/i, ''));

  const reorderBlocks = (from: number, to: number) => {
    if (from === to) return;
    const next = blocks.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setContent(serializeBlocks(next));
    setDirty(true);
  };
  const updateBlockText = (id: string, text: string) => { setContent(serializeBlocks(blocks.map(b => (b.id === id ? { ...b, text } : b)))); setDirty(true); };
  const deleteBlock = (id: string) => { setContent(serializeBlocks(blocks.filter(b => b.id !== id))); setDirty(true); };
  const duplicateBlock = (id: string) => { const i = blocks.findIndex(b => b.id === id); if (i < 0) return; const next = blocks.slice(); next.splice(i + 1, 0, { ...blocks[i], id: `${blocks[i].id}-copy-${Date.now()}` }); setContent(serializeBlocks(next)); setDirty(true); };
  const insertBlock = (type: keyof typeof BLOCK_TEMPLATES) => { setContent(serializeBlocks([...blocks, newBlock(type)])); setDirty(true); setRightTab('blocks'); };
  const insertTemplate = (text: string) => { setContent(c => `${c.replace(/\n+$/, '')}\n\n${text}\n`); setDirty(true); setMessage('Template inserted'); };
  const runAutoFormat = () => { setContent(c => autoFormat(c)); setDirty(true); setMessage('Auto-formatted'); };

  const openFile = async (path?: string) => {
    try {
      setBusy(true);
      const selected = path ?? await open({ multiple: false, directory: false, filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }] });
      if (!selected || Array.isArray(selected)) return;
      const text = await invoke<string>('read_markdown', { path: selected });
      setContent(text); setFilePath(selected); setFileName(selected.split(/[\\/]/).pop() || 'Untitled.md'); setDirty(false); setMessage('Opened');
    } catch (e) { showError(e); } finally { setBusy(false); }
  };
  const openFolder = async () => {
    try {
      setBusy(true);
      const selected = await open({ directory: true, multiple: false });
      if (!selected || Array.isArray(selected)) return;
      const found = await invoke<string[]>('list_markdown_files', { folder: selected });
      setFiles(found);
      if (found.length) await openFile(found[0]); else setMessage('No Markdown files found in this folder');
    } catch (e) { showError(e); } finally { setBusy(false); }
  };
  const saveFile = async () => {
    try {
      setBusy(true);
      let target = filePath;
      if (!target) {
        const selected = await save({ defaultPath: fileName || 'Untitled.md', filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }] });
        if (!selected) return;
        target = /\.(md|markdown)$/i.test(selected) ? selected : `${selected}.md`;
      }
      const finalTarget = target;
      await invoke('write_markdown', { path: finalTarget, content });
      setFilePath(finalTarget); setFileName(finalTarget.split(/[\\/]/).pop() || 'Untitled.md'); setDirty(false); setMessage('Saved successfully');
      if (!files.length) setFiles([finalTarget]);
    } catch (e) { showError(e); } finally { setBusy(false); }
  };
  const newFile = () => {
    if (dirty && !window.confirm('You have unsaved changes. Start a new file anyway?')) return;
    setContent('# New Markdown File\n\n'); setFilePath(null); setFileName('Untitled.md'); setDirty(true); setMessage('New unsaved file'); setMode('edit');
  };
  const insert = (before: string, after = '', placeholder = 'text') => { setContent(c => `${c}${c.endsWith('\n') ? '' : '\n'}${before}${placeholder}${after}\n`); setDirty(true); };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); void saveFile(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') { e.preventDefault(); void openFile(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') { e.preventDefault(); newFile(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const navigateToHeading = (id: string) => requestAnimationFrame(() => document.getElementById(`preview-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));

  return (
    <div className={dark ? 'app dark' : 'app light'}>
      <header className="titlebar">
        <div className="brand">
          <div className="brand-mark"><FileText size={20}/></div>
          <div><strong>Markdown Viewer</strong><span>Read. Write. Anywhere. Offline.</span></div>
        </div>
        <div className="global-search">
          <Search size={16}/>
          <input placeholder="Search files..." value={search} onChange={e => setSearch(e.target.value)}/>
          <kbd>Ctrl K</kbd>
        </div>
        <div className="title-actions">
          <button className="icon-btn" onClick={() => setDark(v => !v)} title="Toggle theme">{dark ? <Moon size={17}/> : <Sun size={17}/>}</button>
          <div className="mode-switch">
            <button onClick={() => setMode('edit')} className={mode === 'edit' ? 'active' : ''}>Edit</button>
            <button onClick={() => setMode('preview')} className={mode === 'preview' ? 'active' : ''}>Preview</button>
            <button onClick={() => setMode('split')} className={mode === 'split' ? 'active' : ''}><Columns3 size={14}/> Split</button>
          </div>
          <button className="icon-btn" onClick={() => setSidebar(v => !v)} title="Toggle sidebar"><Settings size={17}/></button>
        </div>
      </header>

      <div className="workspace">
        {sidebar && (
          <aside className="left-sidebar">
            <div className="actions-stack">
              <button className="primary-action" onClick={newFile} disabled={busy}><Plus size={16}/> New File</button>
              <button className="secondary-action" onClick={() => void openFile()} disabled={busy}><FolderOpen size={16}/> Open File</button>
              <button className="secondary-action" onClick={() => void openFolder()} disabled={busy}><FolderOpen size={16}/> Open Folder</button>
            </div>
            <div className="section-title">Files {files.length > 0 && <span>({files.length})</span>}</div>
            {files.length
              ? files.filter(p => !search || p.toLowerCase().includes(search.toLowerCase())).map(path => (
                  <button key={path} className={path === filePath ? 'tree-file selected' : 'tree-file'} onClick={() => void openFile(path)} disabled={busy}>
                    <FileText size={15}/><span>{path.split(/[\\/]/).pop()}</span>
                  </button>
                ))
              : <div className="empty-files">Open a folder to browse Markdown files.</div>}
            <div className="recent-card">
              <div className="section-title">Current File</div>
              <div className="recent-row"><FileText size={14}/><span>{fileName}</span><small>{dirty ? 'Unsaved' : message}</small></div>
            </div>
            <div className="offline-card"><span className="status-dot"/> Offline <small>No account required</small></div>
          </aside>
        )}

        <main className="main-panel">
          <div className="tabbar">
            <div className="file-tab"><FileText size={15}/><span>{fileName}</span>{dirty && <span className="dirty-dot"/>}<button className="tab-close" title="Start a new document" onClick={newFile}><X size={13}/></button></div>
          </div>

          <div className="toolbar">
            <button onClick={() => insert('# ', '', 'Heading')} title="Heading"><Type size={15}/></button>
            <button onClick={() => insert('**', '**', 'bold')} title="Bold"><Bold size={15}/></button>
            <button onClick={() => insert('*', '*', 'italic')} title="Italic"><Italic size={15}/></button>
            <button onClick={() => insert('`', '`', 'code')} title="Inline code"><Code2 size={15}/></button>
            <button onClick={() => insert('[', '](https://)', 'link')} title="Link"><Link size={15}/></button>
            <button onClick={() => insert('![', '](image.png)', 'alt text')} title="Image"><Image size={15}/></button>
            <button onClick={() => insert('- ', '', 'item')} title="List"><List size={15}/></button>
            <button onClick={() => insert('1. ', '', 'item')} title="Numbered list"><ListOrdered size={15}/></button>
            <button onClick={() => insert('- [ ] ', '', 'task')} title="Task"><CheckSquare size={15}/></button>
            <button onClick={() => insert('> ', '', 'quote')} title="Quote"><Quote size={15}/></button>
            <button title="More"><MoreHorizontal size={15}/></button>
            <div className="toolbar-spacer"/>
            <button className="autoformat-btn" onClick={runAutoFormat} title="Auto-format: turn pasted text into structured Markdown"><Wand2 size={14}/> Auto-format</button>
            <span className="meta">{wordCount} words · {content.split('\n').length} lines</span>
            <button className="save-btn" onClick={() => void saveFile()} disabled={busy}><Save size={14}/> {busy ? 'Working…' : 'Save'} <kbd>Ctrl S</kbd></button>
          </div>

          <div className="document-area" style={{ fontSize: `${fontScale}em` }}>
            {(mode === 'edit' || mode === 'split') && (
              <section className={mode === 'split' ? 'editor-pane split' : 'editor-pane full'}>
                <CodeMirror value={content} height="100%" theme={dark ? oneDark : undefined} extensions={[markdown()]} onChange={v => { setContent(v); setDirty(true); }} basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }}/>
              </section>
            )}
            {(mode === 'preview' || mode === 'split') && (
              <section className={mode === 'split' ? 'preview-pane split' : 'preview-pane full'}>
                <article className="markdown">
                  {blocks.length
                    ? blocks.map(b => (
                        <Widget
                          key={b.id}
                          block={b}
                          dark={dark}
                          anchorId={anchorByBlockId.has(b.id) ? `preview-${anchorByBlockId.get(b.id)}` : undefined}
                          onChange={updateBlockText}
                          onDelete={deleteBlock}
                          onDuplicate={duplicateBlock}
                        />
                      ))
                    : <div className="empty-preview">Nothing to preview yet — start writing in Edit mode.</div>}
                </article>
              </section>
            )}
          </div>

          <div className="statusbar">
            <span>{dirty ? 'Unsaved changes' : message}</span>
            <span>Markdown</span>
            <span>UTF-8</span>
            <div className="status-spacer"/>
            <span>Live Preview</span>
            <span className="toggle on"/>
            <button className="icon-btn tiny"><Maximize2 size={14}/></button>
          </div>
        </main>

        <div className="col-resize-handle" onMouseDown={startRightResize} title="Drag to resize"/>
        <aside className="right-sidebar" style={{ width: rightWidth }}>
          <div className="right-tabs">
            <button className={rightTab === 'toc' ? 'active' : ''} onClick={() => setRightTab('toc')}>Contents</button>
            <button className={rightTab === 'blocks' ? 'active' : ''} onClick={() => setRightTab('blocks')}>Blocks</button>
            <button className={rightTab === 'templates' ? 'active' : ''} onClick={() => setRightTab('templates')}>Templates</button>
          </div>

          {rightTab === 'toc' && (
            <div className="toc">
              {headings.length
                ? headings.map(h => <button key={h.id} onClick={() => navigateToHeading(h.id)} className={`toc-item level-${h.level}`} title={`Go to ${h.text}`}>{h.text}</button>)
                : <div className="empty-toc">Headings will appear here.</div>}
            </div>
          )}

          {rightTab === 'blocks' && (
            <div className="blocks-tab">
              <div className="section-title">Insert block</div>
              <div className="insert-grid">
                {insertOptions.map(o => (
                  <button key={o.type} className="insert-tile" onClick={() => insertBlock(o.type)} title={`Insert ${o.label}`}>
                    <o.icon size={15}/><span>{o.label}</span>
                  </button>
                ))}
              </div>
              <div className="section-title">Document blocks</div>
              <div className="blocks-panel">
                {blocks.length ? blocks.map((b, i) => {
                  const Icon = blockIcon(b.type);
                  return (
                    <div
                      key={b.id}
                      className={`block-card ${dragIndex === i ? 'dragging' : ''}`}
                      draggable
                      onDragStart={() => setDragIndex(i)}
                      onDragEnd={() => setDragIndex(null)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); if (dragIndex !== null) reorderBlocks(dragIndex, i); setDragIndex(null); }}
                      title="Drag to reorder — updates the Markdown source"
                    >
                      <GripVertical size={13} className="grip"/>
                      <Icon size={13}/>
                      <span className="block-type">{b.type}</span>
                      <span className="block-label">{blockLabel(b)}</span>
                      <button className="block-remove" title="Delete block" onClick={() => deleteBlock(b.id)}><X size={12}/></button>
                    </div>
                  );
                }) : <div className="empty-toc">Blocks will appear here as you write.</div>}
              </div>
            </div>
          )}

          {rightTab === 'templates' && (
            <div className="templates-tab">
              <div className="section-title">README widgets</div>
              <div className="template-list">
                {TEMPLATES.map(t => (
                  <button key={t.id} className="template-card" onClick={() => insertTemplate(t.text)} title="Insert into document">
                    <div className="template-card-head"><LayoutTemplate size={14}/><span>{t.label}</span></div>
                    <p>{t.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="file-info">
            <div className="section-title">File Info</div>
            <div className="info-row"><FileText size={14}/><span>Name</span><b>{fileName}</b></div>
            <div className="info-row"><Type size={14}/><span>Status</span><b>{dirty ? 'Unsaved' : 'Saved'}</b></div>
            <div className="info-row"><FilePlus2 size={14}/><span>Words</span><b>{wordCount}</b></div>
          </div>
        </aside>
      </div>

      <div className="quick-controls">
        <button onClick={() => setFontScale(v => Math.max(.85, v - .05))}>A−</button>
        <span>{Math.round(fontScale * 100)}%</span>
        <button onClick={() => setFontScale(v => Math.min(1.35, v + .05))}>A+</button>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
