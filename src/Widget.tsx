import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Bold, Italic, Palette, Copy, Trash2, Pencil } from 'lucide-react';
import MermaidBlock from './MermaidBlock';
import TableWidget from './TableWidget';
import type { Block } from './blocks';
import { toggleBold, toggleItalic, applyColor, clearFormat, SWATCHES } from './blockFormat';

type Props = {
  block: Block;
  dark: boolean;
  anchorId?: string;
  onChange: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
};

const formattable = (t: Block['type']) => t === 'heading' || t === 'paragraph' || t === 'quote';

export default function Widget({ block, dark, anchorId, onChange, onDelete, onDuplicate }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(block.text);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [colorOpen, setColorOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!editing) setDraft(block.text); }, [block.text, editing]);
  useEffect(() => {
    if (!menu) return;
    const close = () => { setMenu(null); setColorOpen(false); };
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => { window.removeEventListener('click', close); window.removeEventListener('scroll', close, true); };
  }, [menu]);

  const commit = () => { setEditing(false); if (draft !== block.text) onChange(block.id, draft); };
  const openMenu = (e: React.MouseEvent) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY }); };
  const apply = (fn: (t: string) => string) => { onChange(block.id, fn(block.text)); setMenu(null); setColorOpen(false); };

  const codeMatch = block.type === 'code' ? block.text.match(/^```(\w*)\n([\s\S]*?)```$/) : null;
  if (codeMatch?.[1].toLowerCase() === 'mermaid') {
    return <div id={anchorId} className="widget" onContextMenu={openMenu}>
      <MermaidBlock chart={codeMatch[2]} dark={dark}/>
      {menu && <WidgetMenu x={menu.x} y={menu.y} canFormat={false} colorOpen={colorOpen} setColorOpen={setColorOpen} onBold={() => {}} onItalic={() => {}} onColor={() => {}} onClear={() => {}} onDuplicate={() => { onDuplicate(block.id); setMenu(null); }} onDelete={() => { onDelete(block.id); setMenu(null); }}/>}
    </div>;
  }

  return <div id={anchorId} ref={ref} className={`widget widget-${block.type} ${editing ? 'editing' : ''}`} onContextMenu={openMenu}>
    <button className="widget-edit-handle" title="Edit this block" onClick={() => setEditing(true)}><Pencil size={12}/></button>
    {editing
      ? <textarea className="widget-editor" autoFocus value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Escape') { setDraft(block.text); setEditing(false); } if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) commit(); }} rows={Math.max(2, draft.split('\n').length)}/>
      : block.type === 'table'
        ? <TableWidget text={block.text} onChange={t => onChange(block.id, t)}/>
        : <div className="widget-rendered" onDoubleClick={() => setEditing(true)}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{block.text}</ReactMarkdown>
          </div>}
    {menu && <WidgetMenu x={menu.x} y={menu.y} canFormat={formattable(block.type)} colorOpen={colorOpen} setColorOpen={setColorOpen}
      onBold={() => apply(toggleBold)} onItalic={() => apply(toggleItalic)} onColor={hex => apply(t => applyColor(t, hex))} onClear={() => apply(clearFormat)}
      onDuplicate={() => { onDuplicate(block.id); setMenu(null); }} onDelete={() => { onDelete(block.id); setMenu(null); }}/>}
  </div>;
}

function WidgetMenu(props: { x: number; y: number; canFormat: boolean; colorOpen: boolean; setColorOpen: (v: boolean) => void; onBold: () => void; onItalic: () => void; onColor: (hex: string) => void; onClear: () => void; onDuplicate: () => void; onDelete: () => void }) {
  const { x, y, canFormat, colorOpen, setColorOpen, onBold, onItalic, onColor, onClear, onDuplicate, onDelete } = props;
  return <div className="widget-menu" style={{ left: x, top: y }} onClick={e => e.stopPropagation()}>
    {canFormat && <>
      <button onClick={onBold}><Bold size={13}/> Bold</button>
      <button onClick={onItalic}><Italic size={13}/> Italic</button>
      <button onClick={() => setColorOpen(!colorOpen)}><Palette size={13}/> Color ▾</button>
      {colorOpen && <div className="widget-menu-swatches">{SWATCHES.map(s => <button key={s.hex} className="swatch" style={{ background: s.hex }} title={s.name} onClick={() => onColor(s.hex)}/>)}</div>}
      <button onClick={onClear}>Clear formatting</button>
      <div className="widget-menu-sep"/>
    </>}
    <button onClick={onDuplicate}><Copy size={13}/> Duplicate</button>
    <button className="danger" onClick={onDelete}><Trash2 size={13}/> Delete</button>
  </div>;
}
