import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { open, save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { Code2, FileText, FolderOpen, Image, List, ListOrdered, Moon, Plus, Quote, Search, Settings, Sun, Type, Bold, Italic, Link, Save, Columns3, X, CheckSquare, MoreHorizontal, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import './styles.css';

const starter = '# Markdown Viewer\n\nOpen a Markdown file to begin. Everything is saved locally on your computer.\n\n## Getting started\n\n- Use **Open File** to open a `.md` file.\n- Use **Open Folder** to browse a documentation folder.\n- Edit the Markdown and press **Ctrl+S** to save.\n- Switch between Edit, Preview and Split views.\n';

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

  const headings = useMemo<Heading[]>(() => {
    let headingIndex = 0;
    return content.split('\n').flatMap((line) => {
      const match = line.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/);
      if (!match) return [];
      const text = match[2];
      return [{ text, level: match[1].length, id: slugify(text, headingIndex++) }];
    });
  }, [content]);
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const showError = (error: unknown) => {
    const text = error instanceof Error ? error.message : String(error);
    setMessage(text.replace(/^Error:\s*/i, ''));
  };

  const openFile = async (path?: string) => {
    try {
      setBusy(true);
      const selected = path ?? await open({ multiple: false, directory: false, filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }] });
      if (!selected || Array.isArray(selected)) return;
      const text = await invoke<string>('read_markdown', { path: selected });
      setContent(text);
      setFilePath(selected);
      setFileName(selected.split(/[\\/]/).pop() || 'Untitled.md');
      setDirty(false);
      setMessage('Opened');
    } catch (error) { showError(error); }
    finally { setBusy(false); }
  };

  const openFolder = async () => {
    try {
      setBusy(true);
      const selected = await open({ directory: true, multiple: false });
      if (!selected || Array.isArray(selected)) return;
      const found = await invoke<string[]>('list_markdown_files', { folder: selected });
      setFiles(found);
      if (found.length > 0) {
        await openFile(found[0]);
      } else {
        setMessage('No Markdown files found in this folder');
      }
    } catch (error) { showError(error); }
    finally { setBusy(false); }
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
      await invoke('write_markdown', { path: target, content });
      setFilePath(target);
      setFileName(target.split(/[\\/]/).pop() || 'Untitled.md');
      setDirty(false);
      setMessage('Saved successfully');
      if (files.length === 0) setFiles([target]);
    } catch (error) { showError(error); }
    finally { setBusy(false); }
  };

  const newFile = async () => {
    try {
      if (dirty && !window.confirm('You have unsaved changes. Start a new file anyway?')) return;
      setContent('# New Markdown File\n\n');
      setFilePath(null);
      setFileName('Untitled.md');
      setDirty(true);
      setMessage('New unsaved file');
      setMode('edit');
    } catch (error) { showError(error); }
  };

  const insert = (before: string, after = '', placeholder = 'text') => {
    setContent((current) => `${current}${current.endsWith('\n') ? '' : '\n'}${before}${placeholder}${after}\n`);
    setDirty(true);
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); void saveFile(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'o') { event.preventDefault(); void openFile(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') { event.preventDefault(); void newFile(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const navigateToHeading = (id: string) => {
    requestAnimationFrame(() => document.getElementById(`preview-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return <div className={dark ? 'app dark' : 'app light'}>
    <header className="titlebar">
      <div className="brand"><div className="brand-mark"><FileText size={21}/></div><div><strong>Markdown Viewer</strong><span>Read. Write. Anywhere. Offline.</span></div></div>
      <div className="global-search"><Search size={17}/><input placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)}/><kbd>Ctrl K</kbd></div>
      <div className="title-actions">
        <button className="icon-btn" onClick={() => setDark((v) => !v)} title="Toggle theme">{dark ? <Moon size={18}/> : <Sun size={18}/>}</button>
        <div className="mode-switch"><button onClick={() => setMode('edit')} className={mode === 'edit' ? 'active' : ''}>Edit</button><button onClick={() => setMode('preview')} className={mode === 'preview' ? 'active' : ''}>Preview</button><button onClick={() => setMode('split')} className={mode === 'split' ? 'active' : ''}><Columns3 size={15}/> Split</button></div>
        <button className="icon-btn" onClick={() => setSidebar((v) => !v)} title="Toggle sidebar"><Settings size={18}/></button>
      </div>
    </header>
    <div className="workspace">
      {sidebar && <aside className="left-sidebar">
        <div className="actions-stack"><button className="primary-action" onClick={() => void newFile()} disabled={busy}><Plus size={17}/> New File</button><button className="secondary-action" onClick={() => void openFile()} disabled={busy}><FolderOpen size={17}/> Open File</button><button className="secondary-action" onClick={() => void openFolder()} disabled={busy}><FolderOpen size={17}/> Open Folder</button></div>
        <div className="section-title">Files {files.length > 0 && <span>({files.length})</span>}</div>
        {files.length ? files.filter((p) => !search || p.toLowerCase().includes(search.toLowerCase())).map((path) => <button key={path} className={path === filePath ? 'tree-file selected' : 'tree-file'} onClick={() => void openFile(path)} disabled={busy}><FileText size={16}/><span>{path.split(/[\\/]/).pop()}</span></button>) : <div className="empty-files">Open a folder to browse Markdown files.</div>}
        <div className="recent-card"><div className="section-title">Current File</div><div className="recent-row"><FileText size={15}/><span>{fileName}</span><small>{dirty ? 'Unsaved' : message}</small></div></div>
        <div className="offline-card"><span className="status-dot"/> Offline <small>No account required</small></div>
      </aside>}
      <main className="main-panel">
        <div className="tabbar"><div className="file-tab"><FileText size={16}/><span>{fileName}</span>{dirty && <span className="dirty-dot"/>}<button className="tab-close" title="Start a new document" onClick={() => void newFile()}><X size={14}/></button></div></div>
        <div className="toolbar">
          <button onClick={() => insert('# ', '', 'Heading')} title="Heading"><Type size={16}/></button><button onClick={() => insert('**', '**', 'bold')} title="Bold"><Bold size={16}/></button><button onClick={() => insert('*', '*', 'italic')} title="Italic"><Italic size={16}/></button><button onClick={() => insert('`', '`', 'code')} title="Inline code"><Code2 size={16}/></button><button onClick={() => insert('[', '](https://)', 'link')} title="Link"><Link size={16}/></button><button onClick={() => insert('![', '](image.png)', 'alt text')} title="Image"><Image size={16}/></button><button onClick={() => insert('- ', '', 'item')} title="List"><List size={16}/></button><button onClick={() => insert('1. ', '', 'item')} title="Numbered list"><ListOrdered size={16}/></button><button onClick={() => insert('- [ ] ', '', 'task')} title="Task"><CheckSquare size={16}/></button><button onClick={() => insert('> ', '', 'quote')} title="Quote"><Quote size={16}/></button><button title="More"><MoreHorizontal size={16}/></button><div className="toolbar-spacer"/><span className="meta">Words: {wordCount} &nbsp; Lines: {content.split('\n').length}</span><button className="save-btn" onClick={() => void saveFile()} disabled={busy}><Save size={15}/> {busy ? 'Working…' : 'Save'} <kbd>Ctrl S</kbd></button>
        </div>
        <div className="document-area" style={{fontSize: `${fontScale}em`}}>
          {(mode === 'edit' || mode === 'split') && <section className={mode === 'split' ? 'editor-pane split' : 'editor-pane full'}><CodeMirror value={content} height="100%" theme={dark ? oneDark : undefined} extensions={[markdown()]} onChange={(value) => { setContent(value); setDirty(true); }} basicSetup={{lineNumbers: true, foldGutter: true, highlightActiveLine: true}}/></section>}
          {(mode === 'preview' || mode === 'split') && <section className={mode === 'split' ? 'preview-pane split' : 'preview-pane full'}><article className="markdown">{content.split('\n').map((line, i) => { const match = line.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/); if (!match) return null; const h = headings.find((item) => item.text === match[2]); return h ? <div key={`anchor-${i}`} id={`preview-${h.id}`} className="heading-anchor"/> : null; })}<ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown></article></section>}
        </div>
        <div className="statusbar"><span>{dirty ? 'Unsaved changes' : message}</span><span>Markdown</span><span>UTF-8</span><div className="status-spacer"/><span>Live Preview</span><span className="toggle on"/><button className="icon-btn tiny"><Maximize2 size={15}/></button></div>
      </main>
      <aside className="right-sidebar"><div className="right-tabs"><button className="active">Table of Contents</button></div><div className="toc">{headings.length ? headings.map((h) => <button key={h.id} onClick={() => navigateToHeading(h.id)} className={`toc-item level-${h.level}`} title={`Go to ${h.text}`}>{h.text}</button>) : <div className="empty-toc">Headings will appear here.</div>}</div><div className="file-info"><div className="section-title">File Info</div><div className="info-row"><FileText size={15}/><span>Name</span><b>{fileName}</b></div><div className="info-row"><Type size={15}/><span>Status</span><b>{dirty ? 'Unsaved' : 'Saved'}</b></div><div className="info-row"><FilePlus2 size={15}/><span>Words</span><b>{wordCount}</b></div></div></aside>
    </div>
    <div className="quick-controls"><button onClick={() => setFontScale((v) => Math.max(.85, v-.05))}>A−</button><span>{Math.round(fontScale * 100)}%</span><button onClick={() => setFontScale((v) => Math.min(1.35, v+.05))}>A+</button></div>
  </div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
