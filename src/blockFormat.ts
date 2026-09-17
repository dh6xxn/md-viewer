function splitPrefix(text: string): { prefix: string; rest: string } {
  const m = text.match(/^(#{1,6}\s+|>\s?)/);
  if (m) return { prefix: m[0], rest: text.slice(m[0].length) };
  return { prefix: '', rest: text };
}

function escapeRegExp(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function wrapToggle(rest: string, marker: string): string {
  const re = new RegExp(`^${escapeRegExp(marker)}([\\s\\S]*)${escapeRegExp(marker)}$`);
  const m = rest.match(re);
  return m ? m[1] : `${marker}${rest}${marker}`;
}

export function toggleBold(text: string): string {
  const { prefix, rest } = splitPrefix(text);
  return prefix + wrapToggle(rest, '**');
}

export function toggleItalic(text: string): string {
  const { prefix, rest } = splitPrefix(text);
  return prefix + wrapToggle(rest, '*');
}

export function applyColor(text: string, hex: string): string {
  const { prefix, rest } = splitPrefix(text);
  const m = rest.match(/^<span style="color:#[0-9a-fA-F]{3,8}">([\s\S]*)<\/span>$/);
  const inner = m ? m[1] : rest;
  return `${prefix}<span style="color:${hex}">${inner}</span>`;
}

export function clearFormat(text: string): string {
  const { prefix, rest } = splitPrefix(text);
  let r = rest;
  const spanM = r.match(/^<span style="color:#[0-9a-fA-F]{3,8}">([\s\S]*)<\/span>$/);
  if (spanM) r = spanM[1];
  r = r.replace(/^\*\*([\s\S]*)\*\*$/, '$1').replace(/^\*([\s\S]*)\*$/, '$1');
  return prefix + r;
}

export const SWATCHES: { name: string; hex: string }[] = [
  { name: 'Ink', hex: '#181d26' },
  { name: 'Coral', hex: '#aa2d00' },
  { name: 'Forest', hex: '#0a2e0e' },
  { name: 'Link', hex: '#1b61c9' },
  { name: 'Mustard', hex: '#d9a441' },
];
