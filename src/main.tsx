import React, { useMemo, useState } from 'react';
import { Code2, FileText, FolderOpen, Image, List, ListOrdered, Moon, Plus, Quote, Search, Settings, Sun, Table, Type, Undo2, Bold, Italic, Link, Save, Columns3, X, ChevronDown, FilePlus2, CheckSquare, MoreHorizontal, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import './styles.css';

const initialMarkdown = `# Markdown Viewer

A simple, fast and beautiful desktop application to **read and edit Markdown files offline**.

## Features

- Open and edit Markdown files
- Beautiful live preview
- GitHub-flavored Markdown support
- Syntax highlighting for code blocks
- Automatic table of contents
- Support for images, tables and task lists
- Completely offline — no account required

## Quick Start

1. Open a Markdown file.
2. Edit it in the editor.
3. See the live preview.
4. Save your changes.

## Code Example

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('Markdown Viewer'));
\`\`\`

## Task List

- [x] Build a beautiful Markdown viewer
- [x] Add a Markdown editor
- [x] Add light and dark themes
- [ ] Add more export options

## Table

| Feature | Status |
| --- | --- |
| Viewer | Ready |
| Editor | Ready |
| Offline | Ready |

> Everything stays on your computer. No internet is required.\n`;

const files = ['README.md', 'installation.md', 'usage.md', 'features.md'];

function App() {
  const [content, setContent] = useState(initialMarkdown);
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [dark, setDark] = useState(true);
  const [sidebar, setSidebar] = useState(true);
  const [search, setSearch] = useState('');
  const [fontScale, setFontScale] = useState(1);

  const headings = useMemo(
    () => content.split('\n').filter((line) => /^#{1,3}\s/.test(line)).map((line) => line.replace(/^#{1,3}\s/, '')),
    [content],
  );

  const insert = (before: string, after = '', placeholder = 'text') => {
    setContent((current) => `${current}${current.endsWith('\n') ? '' : '\n'}${before}${placeholder}${after}\n`);
  };

  return (
    <div className={dark ? 'app dark' : 'app light'}>
      <header className="titlebar">
        <div className="brand">
          <div className="brand-mark"><FileText size={21} /></div>
          <div><strong>Markdown Viewer</strong><span>Read. Write. Anywhere. Offline.</span></div>
        </div>
        <div className="global-search"><Search size={17} /><input placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)} /><kbd>Ctrl K</kbd></div>
        <div className="title-actions">
          <button className="icon-btn" onClick={() => setDark((v) => !v)} title="Toggle theme">{dark ? <Moon size={18} /> : <Sun size={18} />}</button>
          <div className="mode-switch">
            <button onClick={() => setMode('edit')} className={mode === 'edit' ? 'active' : ''}>Edit</button>
            <button onClick={() => setMode('preview')} className={mode === 'preview' ? 'active' : ''}>Preview</button>
            <button onClick={() => setMode('split')} className={mode === 'split' ? 'active' : ''}><Columns3 size={15}/> Split</button>
          </div>
          <button className="icon-btn" onClick={() => setSidebar((v) => !v)} title="Toggle sidebar"><Settings size={18} /></button>
        </div>
      </header>

      <div className="workspace">
        {sidebar && <aside className="left-sidebar">
          <div className="actions-stack">
            <button className="primary-action"><Plus size={17}/> New File</button>
            <button className="secondary-action"><FolderOpen size={17}/> Open File</button>
            <button className="secondary-action"><FolderOpen size={17}/> Open Folder</button>
          </div>
          <div className="section-title">Files</div>
          <div className="tree-root"><FolderOpen size={16}/> Documentation <ChevronDown size={15}/></div>
          {files.map((name, i) => <button key={name} className={i === 0 ? 'tree-file selected' : 'tree-file'}><FileText size={16}/>{name}</button>)}
          <div className="tree-root"><FolderOpen size={16}/> Guides <ChevronDown size={15}/></div>
          <button className="tree-file"><FileText size={16}/> getting-started.md</button>
          <button className="tree-file"><FileText size={16}/> keyboard-shortcuts.md</button>
          <div className="tree-root"><FolderOpen size={16}/> Images <ChevronDown size={15}/></div>
          <button className="tree-file"><Image size={16}/> screenshot.png</button>
          <div className="recent-card">
            <div className="section-title">Recent Files</div>
            <div className="recent-row"><FileText size={15}/><span>README.md</span><small>Just now</small></div>
            <div className="recent-row"><FileText size={15}/><span>usage.md</span><small>2h</small></div>
            <div className="recent-row"><FileText size={15}/><span>installation.md</span><small>Yesterday</small></div>
          </div>
          <div className="offline-card"><span className="status-dot"/> Offline <small>No account required</small></div>
        </aside>}

        <main className="main-panel">
          <div className="tabbar"><div className="file-tab"><FileText size={16}/><span>README.md</span><X size={16}/></div><button className="add-tab"><Plus size={18}/></button></div>
          <div className="toolbar">
            <button onClick={() => insert('# ', '', 'Heading')} title="Heading"><Type size={16}/></button>
            <button onClick={() => insert('**', '**', 'bold')}><Bold size={16}/></button>
            <button onClick={() => insert('*', '*', 'italic')}><Italic size={16}/></button>
            <button onClick={() => insert('`', '`', 'code')}><Code2 size={16}/></button>
            <button onClick={() => insert('[', '](https://)', 'link')}><Link size={16}/></button>
            <button onClick={() => insert('![', '](image.png)', 'alt text')}><Image size={16}/></button>
            <button onClick={() => insert('- ', '', 'item')}><List size={16}/></button>
            <button onClick={() => insert('1. ', '', 'item')}><ListOrdered size={16}/></button>
            <button onClick={() => insert('- [ ] ', '', 'task')}><CheckSquare size={16}/></button>
            <button onClick={() => insert('> ', '', 'quote')}><Quote size={16}/></button>
            <button><MoreHorizontal size={16}/></button>
            <div className="toolbar-spacer"/>
            <span className="meta">Words: {content.trim().split(/\s+/).filter(Boolean).length} &nbsp; Lines: {content.split('\n').length}</span>
            <button className="save-btn"><Save size={15}/> Save <kbd>Ctrl S</kbd></button>
          </div>

          <div className="document-area" style={{ fontSize: `${fontScale}em` }}>
            {(mode === 'edit' || mode === 'split') && <section className={mode === 'split' ? 'editor-pane split' : 'editor-pane full'}>
              <CodeMirror value={content} height="100%" theme={dark ? oneDark : undefined} extensions={[markdown()]} onChange={setContent} basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }} />
            </section>}
            {(mode === 'preview' || mode === 'split') && <section className={mode === 'split' ? 'preview-pane split' : 'preview-pane full'}>
              <article className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown></article>
            </section>}
          </div>
          <div className="statusbar"><span>Ln 1, Col 1</span><span>Markdown</span><span>UTF-8</span><span>Spaces: 2</span><span className="status-spacer"/><span>Live Preview</span><span className="toggle on"/><button className="icon-btn tiny"><Maximize2 size={15}/></button></div>
        </main>

        <aside className="right-sidebar">
          <div className="right-tabs"><button className="active">Table of Contents</button><button>Search</button></div>
          <div className="toc">{headings.map((h, i) => <div key={`${h}-${i}`} className={i === 0 ? 'toc-item root' : 'toc-item'}>{h}</div>)}</div>
          <div className="file-info">
            <div className="section-title">File Info</div>
            <div className="info-row"><FileText size={15}/><span>Name</span><b>README.md</b></div>
            <div className="info-row"><FolderOpen size={15}/><span>Location</span><b>Documentation/</b></div>
            <div className="info-row"><Table size={15}/><span>Size</span><b>2.4 KB</b></div>
            <div className="info-row"><Undo2 size={15}/><span>Modified</span><b>Today, 3:45 PM</b></div>
            <div className="info-row"><FilePlus2 size={15}/><span>Type</span><b>Markdown File</b></div>
          </div>
        </aside>
      </div>
      <div className="quick-controls"><button onClick={() => setFontScale((v) => Math.max(.85, v-.05))}>A−</button><span>{Math.round(fontScale * 100)}%</span><button onClick={() => setFontScale((v) => Math.min(1.35, v+.05))}>A+</button></div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
