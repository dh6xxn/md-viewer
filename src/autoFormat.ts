/**
 * Auto-format algorithm — turns loosely pasted plain text into structured Markdown.
 *
 * Pass 1 (tokenize):   split raw text into line-groups ("chunks") on blank lines;
 *                        if the paste has no blank lines at all, treat every line as its own chunk.
 * Pass 2 (expand):      a blank-line-delimited chunk can itself hold several unrelated lines with no
 *                        markers (e.g. text copied from a rendered page that lost its #/-/> symbols).
 *                        A chunk is only ONE wrapped paragraph if every line but the last has no
 *                        terminal punctuation and the last line does (that's what mid-sentence word-wrap
 *                        looks like). Anything else — a run of independent short lines — is split apart:
 *                        3+ short sibling lines become a bullet list, 2 stay as separate short paragraphs.
 * Pass 3 (classify):    tag each resulting unit as one of: code / table / image / quote / list / heading-like / prose.
 * Pass 4 (structure):   walk units in order, promoting heading-like ones to H1/H2/H3 based on a running
 *                        "current depth" — the first heading seen becomes H1, short label-style lines that
 *                        follow become H2, colon-terminated short lines become H3. Consecutive prose units
 *                        are merged into one paragraph only when the source had no blank lines at all
 *                        (pure word-wrap); otherwise each stays on its own.
 * Pass 5 (serialize):   normalize list markers, join everything with blank-line separators.
 */

type ChunkKind = 'code' | 'table' | 'image' | 'quote' | 'list' | 'heading-like' | 'prose';
type Chunk = { text: string; kind: ChunkKind };

function tokenize(text: string): { chunks: string[]; perLine: boolean } {
  const hasBlankLines = /\n[ \t]*\n/.test(text);
  if (hasBlankLines) return { chunks: text.split(/\n[ \t]*\n+/).map(s => s.trim()).filter(Boolean), perLine: false };
  return { chunks: text.split('\n').map(s => s.trim()).filter(Boolean), perLine: true };
}

/** Strong, low-false-positive signals only — a short line with no ending punctuation
 *  is NOT enough on its own (that also matches ordinary wrapped prose fragments). */
function looksLikeHeadingText(line: string): boolean {
  const words = line.split(/\s+/);
  const shortEnough = line.length <= 70 && words.length <= 10;
  if (!shortEnough) return false;
  if (/[.!?,;]$/.test(line)) return false;
  const isColonLabel = /:$/.test(line);
  const isUpper = line === line.toUpperCase() && /[A-Z]/.test(line);
  const capitalized = words.filter(w => /^[A-Z]/.test(w)).length;
  const isTitleCase = capitalized >= Math.ceil(words.length * 0.6) && words.length <= 8;
  return isColonLabel || isUpper || isTitleCase;
}

/** Structural checks only — recognizes block types that are allowed to span multiple lines
 *  (code/table/quote/list/atx-heading). Returns null when the chunk is plain, undecorated text. */
function classifyStructural(chunk: string): ChunkKind | null {
  const first = chunk.split('\n')[0].trim();
  if (/^```/.test(first)) return 'code';
  if (/^\|/.test(first)) return 'table';
  if (/^!\[/.test(first)) return 'image';
  if (/^>\s?/.test(first)) return 'quote';
  const lines = chunk.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length && lines.every(l => /^([-*•]|\d+[.)])\s+/.test(l))) return 'list';
  if (/^#{1,6}\s/.test(first)) return 'heading-like';
  return null;
}

function classify(chunk: string): ChunkKind {
  const structural = classifyStructural(chunk);
  if (structural) return structural;
  const lines = chunk.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 1 && looksLikeHeadingText(lines[0])) return 'heading-like';
  return 'prose';
}

/** A multi-line chunk reads as ONE paragraph under either shape real prose takes:
 *   - one sentence per line: most lines end a complete thought (.!?:;) — majority vote, so a
 *     couple of punctuated lines buried in a long run of unrelated short lines (a heterogeneous
 *     list, not a paragraph) can't drag the whole run into one unreadable sentence.
 *   - classic mid-sentence word-wrap: every line but the last trails off with no punctuation and
 *     only the last line closes the sentence — majority vote alone would miss this (it's a small
 *     minority, sometimes just 1 of many lines), so it's checked as its own explicit case. */
function isProseParagraph(lines: string[]): boolean {
  if (lines.length < 2) return true;
  const punctuated = lines.filter(l => /[.!?:;]$/.test(l)).length;
  const majorityPunctuated = punctuated >= lines.length / 2;
  const wordWrapped = punctuated === 1 && /[.!?]$/.test(lines[lines.length - 1]);
  return majorityPunctuated || wordWrapped;
}

/** Splits an undecorated multi-line chunk into independently classified units — see Pass 2. */
function expandChunk(raw: string): Chunk[] {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length <= 1) return [{ text: raw.trim(), kind: classify(raw) }];

  const structural = classifyStructural(raw);
  if (structural) return [{ text: raw.trim(), kind: structural }];

  if (isProseParagraph(lines)) return [{ text: raw.trim(), kind: 'prose' }];
  if (lines.length >= 3) return [{ text: lines.map(l => `- ${l}`).join('\n'), kind: 'list' }];
  return lines.map(l => ({ text: l, kind: classify(l) }));
}

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function normalizeList(chunk: string): string {
  let n = 1;
  return chunk.split('\n').map(l => {
    const t = l.trim();
    if (!t) return '';
    const numbered = /^\d+[.)]\s+/.test(t);
    const rest = t.replace(/^([-*•]|\d+[.)])\s+/, '');
    return numbered ? `${n++}. ${rest}` : `- ${rest}`;
  }).join('\n');
}

/** Decide heading depth for a chunk already confirmed heading-like by classify(). */
function headingLevel(text: string, sawH1: boolean): 1 | 2 | 3 {
  const isColonLabel = /:$/.test(text);
  if (isColonLabel) return 3;
  const isUpper = text === text.toUpperCase() && /[A-Z]/.test(text);
  if (!sawH1) return 1;
  if (isUpper) return 1;
  return 2;
}

export function autoFormat(raw: string): string {
  const text = raw.replace(/\r\n/g, '\n').trim();
  if (!text) return text;

  const { chunks: rawChunks, perLine } = tokenize(text);
  const chunks: Chunk[] = perLine ? rawChunks.map(c => ({ text: c, kind: classify(c) })) : rawChunks.flatMap(expandChunk);

  const output: string[] = [];
  let sawH1 = false;
  let proseBuffer: string[] = [];

  const flushProse = () => {
    if (!proseBuffer.length) return;
    output.push(proseBuffer.join(' '));
    proseBuffer = [];
  };

  for (const chunk of chunks) {
    if (chunk.kind === 'heading-like') {
      flushProse();
      const cleanText = chunk.text.replace(/:$/, '');
      const level = headingLevel(chunk.text, sawH1);
      if (level === 1) sawH1 = true;
      output.push(`${'#'.repeat(level)} ${level === 1 && cleanText === cleanText.toUpperCase() ? toTitleCase(cleanText) : cleanText}`);
      continue;
    }
    if (chunk.kind === 'list') { flushProse(); output.push(normalizeList(chunk.text)); continue; }
    if (chunk.kind === 'code' || chunk.kind === 'table' || chunk.kind === 'image' || chunk.kind === 'quote') { flushProse(); output.push(chunk.text); continue; }
    // prose: in per-line mode (no blank lines anywhere) consecutive fragments are one
    // wrapped paragraph, so merge them; when the source already used blank lines, each
    // chunk is already a distinct paragraph and must stay on its own.
    const joined = chunk.text.replace(/\s*\n\s*/g, ' ');
    if (perLine) proseBuffer.push(joined);
    else { flushProse(); output.push(joined); }
  }
  flushProse();

  return `${output.join('\n\n')}\n`;
}
