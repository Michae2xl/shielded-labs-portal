import { Lexer, type Token, type Tokens } from 'marked';

/** Inert Markdown nodes, like the ZIP reader's: the renderer decides which tags become elements. */
export type MarkdownTag = 'p' | 'h4' | 'h5' | 'h6' | 'ul' | 'ol' | 'li' | 'strong' | 'em' | 'del' | 'code' | 'pre' | 'blockquote' | 'hr' | 'br' | 'a'
  | 'table' | 'thead' | 'tbody' | 'tr' | 'th' | 'td' | 'check';
export type MarkdownNode = string | { tag: MarkdownTag; children: MarkdownNode[]; href?: string; start?: number; checked?: boolean };

const LIMIT = 120_000;

/** Web and mail links only, never with credentials; anything else stays plain text. */
export function safeHref(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.username || url.password) return null;
    return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

const el = (tag: MarkdownTag, children: MarkdownNode[], extra: { href?: string; start?: number; checked?: boolean } = {}): MarkdownNode => ({ tag, children, ...extra });
const words = (html: string) => html.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]*>/g, ' ').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim();

function inline(tokens: Token[] = []): MarkdownNode[] {
  return tokens.flatMap((token): MarkdownNode[] => {
    switch (token.type) {
      case 'strong': return [el('strong', inline((token as Tokens.Strong).tokens))];
      case 'em': return [el('em', inline((token as Tokens.Em).tokens))];
      case 'del': return [el('del', inline((token as Tokens.Del).tokens))];
      case 'codespan': return [el('code', [(token as Tokens.Codespan).text])];
      case 'br': return [el('br', [])];
      case 'link': { const link = token as Tokens.Link; const href = safeHref(link.href); return href ? [el('a', inline(link.tokens), { href })] : inline(link.tokens); }
      // Images are not loaded from third parties; the reader gets a link instead.
      case 'image': { const image = token as Tokens.Image; const href = safeHref(image.href); return href ? [el('a', [`Image: ${image.text || 'attachment'}`], { href })] : []; }
      case 'html': return /^<br\s*\/?>$/i.test((token as Tokens.HTML).text.trim()) ? [el('br', [])] : [];
      default: { const text = token as Tokens.Text; return text.tokens?.length ? inline(text.tokens) : typeof text.text === 'string' ? [text.text] : []; }
    }
  });
}

function blocks(tokens: Token[] = []): MarkdownNode[] {
  return tokens.flatMap((token): MarkdownNode[] => {
    switch (token.type) {
      case 'space': case 'def': case 'checkbox': return [];
      case 'paragraph': return [el('p', inline((token as Tokens.Paragraph).tokens))];
      // The field heading is an h3, so headings inside a field start at h4.
      case 'heading': { const heading = token as Tokens.Heading; return [el(heading.depth <= 2 ? 'h4' : heading.depth === 3 ? 'h5' : 'h6', inline(heading.tokens))]; }
      case 'code': return [el('pre', [el('code', [(token as Tokens.Code).text])])];
      case 'blockquote': return [el('blockquote', blocks((token as Tokens.Blockquote).tokens))];
      case 'hr': return [el('hr', [])];
      case 'list': {
        const list = token as Tokens.List;
        const items = list.items.map(item => el('li', [...(item.task ? [el('check', [], { checked: Boolean(item.checked) })] : []), ...blocks(item.tokens)]));
        return [el(list.ordered ? 'ol' : 'ul', items, list.ordered && typeof list.start === 'number' && list.start !== 1 ? { start: list.start } : {})];
      }
      case 'table': {
        const table = token as Tokens.Table;
        return [el('table', [el('thead', [el('tr', table.header.map(cell => el('th', inline(cell.tokens))))]), el('tbody', table.rows.map(row => el('tr', row.map(cell => el('td', inline(cell.tokens))))))])];
      }
      case 'html': { const text = words((token as Tokens.HTML).text); return text ? [el('p', [text])] : []; }
      default: { const text = token as Tokens.Text; return text.tokens?.length ? inline(text.tokens) : text.text?.trim() ? [text.text] : []; }
    }
  });
}

/** Markdown from an application as inert nodes: no raw HTML survives, and only web or mail links do. */
export function markdownNodes(markdown: string): MarkdownNode[] {
  return blocks(Lexer.lex(markdown.replace(/<!--[\s\S]*?-->/g, '').slice(0, LIMIT), { gfm: true }));
}
