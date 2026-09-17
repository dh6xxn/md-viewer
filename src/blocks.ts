export type BlockType = 'heading' | 'list' | 'quote' | 'code' | 'table' | 'image' | 'paragraph';
export type Block = { id: string; type: BlockType; text: string };

let counter = 0;
function nextId() { counter += 1; return `blk-${Date.now()}-${counter}`; }

function detectType(text: string): BlockType {
  const first = text.split('\n')[0].trim();
  if (/^```/.test(first)) return 'code';
  if (/^#{1,6}\s/.test(first)) return 'heading';
  if (/^>\s?/.test(first)) return 'quote';
  if (/^(\s*([-*+]|\d+\.)\s)/.test(first)) return 'list';
  if (/^!\[/.test(first)) return 'image';
  if (/^\|/.test(first)) return 'table';
  return 'paragraph';
}

export function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let current: string[] = [];
  let inFence = false;
  const flush = () => {
    const text = current.join('\n').trim();
    if (text) blocks.push({ id: nextId(), type: detectType(text), text });
    current = [];
  };
  for (const line of lines) {
    if (/^```/.test(line.trim())) inFence = !inFence;
    if (line.trim() === '' && !inFence) { flush(); continue; }
    current.push(line);
  }
  flush();
  return blocks;
}

export function serializeBlocks(blocks: Block[]): string {
  return blocks.map(b => b.text).join('\n\n') + '\n';
}

export function blockLabel(b: Block): string {
  const firstLine = b.text.split('\n')[0].replace(/^#{1,6}\s*/, '').replace(/^>\s?/, '').replace(/^(\s*([-*+]|\d+\.)\s)/, '').replace(/^!\[[^\]]*\]\([^)]*\)/, '(image)');
  return firstLine.length > 46 ? `${firstLine.slice(0, 46)}…` : firstLine || '(empty)';
}

export const BLOCK_TEMPLATES: Record<string, string> = {
  heading: '## New heading',
  paragraph: 'New paragraph text.',
  list: '- First item\n- Second item',
  quote: '> A quote goes here.',
  code: '```\ncode goes here\n```',
  table: '| Column A | Column B |\n| --- | --- |\n| value | value |',
  image: '![alt text](image.png)',
  divider: '---',
};

export function newBlock(type: keyof typeof BLOCK_TEMPLATES): Block {
  const text = BLOCK_TEMPLATES[type];
  return { id: `blk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type: type === 'divider' ? 'paragraph' : (type as BlockType), text };
}
