import MarkdownIt from 'markdown-it';

/** @typedef {import('./model.js').Book} Book */
/** @typedef {import('./model.js').Block} Block */
/** @typedef {import('./model.js').Inline} Inline */
/** @typedef {import('./model.js').Direction} Direction */
/** @typedef {import('./model.js').WritingMode} WritingMode */
/** @typedef {import('markdown-it/lib/token.mjs').default} Token */
/** @typedef {import('markdown-it/lib/rules_inline/state_inline.mjs').default} InlineState */
export const FORMAT = '0.1-draft.1';
export const MAX_SOURCE_BYTES = 2 * 1024 * 1024;

export class YompubError extends Error {
  /** @param {string} code @param {string} message @param {number} [line] */
  constructor(code, message, line) {
    super(message);
    this.name = 'YompubError';
    this.code = code;
    this.line = line;
  }
}
/** @param {string} code @param {string} message @param {number} [line] @returns {never} */
function fail(code, message, line) { throw new YompubError(code, message, line); }

// RFC 5646 syntax, including grandfathered tags; no registry lookup or case rewriting.
const grandfathered = /^(en-GB-oed|i-(ami|bnn|default|enochian|hak|klingon|lux|mingo|navajo|pwn|tao|tay|tsu)|sgn-(BE-FR|BE-NL|CH-DE)|art-lojban|cel-gaulish|no-bok|no-nyn|zh-(guoyu|hakka|min|min-nan|xiang))$/i;
const langtag = /^(?:[a-z]{2,3}(?:-[a-z]{3}){0,3}|[a-z]{4}|[a-z]{5,8})(?:-[a-z]{4})?(?:-(?:[a-z]{2}|[0-9]{3}))?(?:-(?:[a-z0-9]{5,8}|[0-9][a-z0-9]{3}))*(?:-[0-9a-wy-z](?:-[a-z0-9]{2,8})+)*(?:-x(?:-[a-z0-9]{1,8})+)?$|^x(?:-[a-z0-9]{1,8})+$/i;
/** @param {string} value */
export function isLanguage(value) {
  if (grandfathered.test(value)) return true;
  if (!langtag.test(value)) return false;
  const parts = value.toLowerCase().split('-');
  const seen = new Set();
  for (let i = 1; i < parts.length && parts[i] !== 'x'; i++) {
    if (parts[i].length === 1 || /^[0-9][a-z0-9]{3}$|^[a-z0-9]{5,8}$/.test(parts[i])) {
      // Extension subtags are not variants; only their singleton must be unique.
      const key = parts[i];
      if (seen.has(key)) return false;
      seen.add(key);
      if (key.length === 1) while (i + 1 < parts.length && parts[i + 1].length > 1) i++;
    }
  }
  return true;
}
/** @param {string} path */
export function isAssetPath(path) {
  return path.length > 0 && !/[\\%?#:\s\u0000-\u001f\u007f]/u.test(path)
    && path.split('/').every(s => s !== '' && s !== '.' && s !== '..')
    && /\.(png|jpg|jpeg|webp)$/i.test(path);
}
/** @param {string} path */
function asset(path) {
  if (!isAssetPath(path)) fail('ASSET_PATH', `Invalid local image path: ${path}`);
  return path;
}
/** @param {string} href */
function link(href) {
  if (/^#h-[1-9][0-9]*$/.test(href)) return href;
  if (/[\\\s\u0000-\u001f\u007f]/u.test(href)) fail('LINK', `Invalid link: ${href}`);
  if (/^https?:\/\//i.test(href)) {
    try {
      const u = new URL(href);
      if (u.hostname && !u.username && !u.password) return href;
    } catch { /* Report the same diagnostic below. */ }
  }
  if (/^mailto:[^@?#]+@[^@?#]+$/i.test(href)) return href;
  return fail('LINK', `Only http(s), simple mailto, or #h-N links are Core: ${href}`);
}
/** Strict UTF-8, without silently substituting U+FFFD. @param {Uint8Array} bytes */
export function decodeSource(bytes) {
  if (bytes.byteLength > MAX_SOURCE_BYTES) fail('LIMIT', 'This implementation supports source files up to 2 MiB.');
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { return fail('UTF8', 'Source must be valid UTF-8.'); }
}

const parserOptions = { html: true, maxNesting: 128 };
const md = new MarkdownIt('commonmark', parserOptions);
// Validation belongs to Core, not markdown-it's HTML renderer. Do not turn unsafe
// destinations silently into ordinary text, or normalize manuscript strings.
md.validateLink = () => true;
md.normalizeLink = (/** @type {string} */ value) => value;
md.normalizeLinkText = (/** @type {string} */ value) => value;

/** Decode only escapes and entities in an atomic extension field. @param {string} raw */
function plainField(raw) {
  // Preserve escaped ampersands: never decode entities created by an escape.
  return raw.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~｜《》])|&(?:#[xX][a-fA-F0-9]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]+);/g,
    (whole, escaped) => escaped ?? md.utils.unescapeAll(whole));
}
/** Read an atomic field, stopping before an unescaped delimiter. @param {string} s @param {number} start @param {string} end @param {number} max */
function field(s, start, end, max) {
  let p = start;
  while (p < max) {
    if (s[p] === '\n') break;
    if (s[p] === '\\' && p + 1 < max && s[p + 1] !== '\n') { p += 2; continue; }
    if (p + end.length <= max && s.startsWith(end, p)) return { raw: s.slice(start, p), next: p + end.length };
    p++;
  }
  return null;
}
/** @param {string} text @param {string} markers */
function unescaped(text, markers) {
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\\') { i++; continue; }
    if (markers.includes(text[i])) return true;
  }
  return false;
}
/** @param {InlineState} state @param {boolean} silent */
function extensions(state, silent) {
  const { src, pos, posMax } = state;
  if (src[pos] === '\\' && /[｜《》]/.test(src[pos + 1] ?? '')) {
    if (!silent) state.push('text', '', 0).content = src[pos + 1];
    state.pos += 2;
    return true;
  }
  if (src[pos] === '｜') {
    const base = field(src, pos + 1, '《', posMax);
    const note = base && field(src, base.next, '》', posMax);
    if (!base || !note || unescaped(base.raw, '｜》') || unescaped(note.raw, '｜《')) {
      fail('RUBY', 'Ruby must be ｜base《annotation》 on one line; escape literal markers with a backslash.');
    }
    const b = plainField(base.raw), a = plainField(note.raw);
    if (!b.trim() || !a.trim() || /[\r\n]/.test(b + a)) fail('RUBY', 'Ruby base and annotation must be nonempty.');
    if (!silent) state.push('yom_ruby', '', 0).meta = { base: b, annotation: a };
    state.pos = note.next;
    return true;
  }
  if (src.startsWith('{{', pos)) {
    const lang = field(src, pos + 2, '|', posMax);
    const dir = lang && field(src, lang.next, '|', posMax);
    const text = dir && field(src, dir.next, '}}', posMax);
    if (!lang || !dir || !text || !isLanguage(lang.raw) || !['ltr', 'rtl', 'auto'].includes(dir.raw)) {
      fail('SPAN', 'Text runs use {{language|ltr/rtl/auto|text}} on one line.');
    }
    if (unescaped(text.raw, '|{}')) fail('SPAN', 'Escape literal |, { and } inside a text run; runs cannot nest.');
    const value = plainField(text.raw);
    if (!value.trim() || /[\r\n]/.test(value)) fail('SPAN', 'A text run must be nonempty.');
    if (!silent) state.push('yom_span', '', 0).meta = { lang: lang.raw, direction: dir.raw, value };
    state.pos = text.next;
    return true;
  }
  return false;
}
md.inline.ruler.before('text', 'yom_extensions', extensions);
// CommonMark's text scanner has no reason to stop at U+FF5C; ours must.
md.inline.ruler.at('text', (state, silent) => {
  let p = state.pos;
  while (p < state.posMax && !/[\n!#$%&*+\-:<=>@[\\\]^_`{}~｜]/u.test(state.src[p])) p++;
  if (p === state.pos) return false;
  if (!silent) state.pending += state.src.slice(state.pos, p);
  state.pos = p;
  return true;
});

/** Base text only: ruby readings are not doubled in navigation/alt. @param {Inline[]} nodes @returns {string} */
export function plainText(nodes) {
  return nodes.map(n => {
    if ('children' in n) return plainText(n.children);
    if ('value' in n) return n.value;
    if (n.type === 'ruby') return n.base;
    if (n.type === 'image') return n.alt;
    return ' ';
  }).join('');
}
/** @param {Inline[]} nodes @returns {boolean} */
function altOnly(nodes) {
  return nodes.every(n => (n.type === 'emphasis' || n.type === 'strong') ? altOnly(n.children) : ['text', 'code', 'softBreak', 'hardBreak'].includes(n.type));
}
/** @param {Token[]} tokens @param {Set<string>} assets @param {string[]} links @returns {Inline[]} */
function inlines(tokens, assets, links) {
  let i = 0;
  /** @param {string} [until] @returns {Inline[]} */
  function sequence(until) {
    /** @type {Inline[]} */ const out = [];
    while (i < tokens.length) {
      const t = tokens[i++];
      if (t.level >= 120) fail('LIMIT', 'This implementation supports nesting below 120 levels.');
      if (t.type === until) return out;
      switch (t.type) {
        case 'text': case 'text_special':
          if (t.content) {
            const previous = out.at(-1);
            if (previous?.type === 'text') previous.value += t.content;
            else out.push({ type: 'text', value: t.content });
          }
          break;
        case 'code_inline': out.push({ type: 'code', value: t.content }); break;
        case 'softbreak': out.push({ type: 'softBreak' }); break;
        case 'hardbreak': out.push({ type: 'hardBreak' }); break;
        case 'em_open': out.push({ type: 'emphasis', children: sequence('em_close') }); break;
        case 'strong_open': out.push({ type: 'strong', children: sequence('strong_close') }); break;
        case 'link_open': {
          const href = link(t.attrGet('href') ?? '');
          links.push(href);
          out.push({ type: 'link', href, title: t.attrGet('title') ?? '', children: sequence('link_close') });
          break;
        }
        case 'image': {
          const src = asset(t.attrGet('src') ?? '');
          const children = inlines(t.children ?? [], assets, links);
          if (!altOnly(children)) {
            fail('ALT', 'Image alt may contain text/emphasis/code, not links, images, ruby or text runs.');
          }
          assets.add(src);
          out.push({ type: 'image', src, alt: plainText(children), title: t.attrGet('title') ?? '' });
          break;
        }
        case 'yom_ruby': out.push({ type: 'ruby', ...t.meta }); break;
        case 'yom_span': out.push({ type: 'span', ...t.meta }); break;
        case 'html_inline': fail('HTML', 'Raw HTML is outside Core. Escape it or put it in code.'); break;
        default: fail('TOKEN', `Unsupported inline construct: ${t.type}`);
      }
    }
    return out;
  }
  return sequence();
}

/** Parse syntax only; callers must separately check referenced asset files. @param {string} input @returns {import('./model.js').ParseResult} */
export function parseBook(input) {
  if (new TextEncoder().encode(input).length > MAX_SOURCE_BYTES) fail('LIMIT', 'This implementation supports source files up to 2 MiB.');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]|[\ud800-\udfff]/u.test(input)) fail('UNICODE', 'Source contains a forbidden control or unpaired surrogate.');
  const source = input.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const lines = source.split('\n');
  if (lines[0] !== '---') fail('HEADER', 'The first line must be --- (a YomPUB header).', 1);
  const end = lines.indexOf('---', 1);
  if (end < 0) fail('HEADER', 'The header needs a closing --- line.', 1);
  /** @type {Map<string, string>} */ const fields = new Map();
  for (let i = 1; i < end; i++) {
    const m = /^([a-z][a-z0-9-]*): (.*)$/.exec(lines[i]);
    if (!m || !m[2].trim()) fail('HEADER', 'Use one nonempty key: value per header line (not YAML).', i + 1);
    if (fields.has(m[1])) fail('HEADER_DUPLICATE', `Duplicate field: ${m[1]}`, i + 1);
    fields.set(m[1], m[2].replace(/^[ \t]+|[ \t]+$/g, ''));
  }
  for (const required of ['yompub', 'title', 'lang']) if (!fields.has(required)) fail('HEADER_REQUIRED', `Missing ${required}.`, 1);
  if (fields.get('yompub') !== FORMAT) fail('VERSION', `This reader supports only yompub: ${FORMAT}.`, 1);
  const lang = fields.get('lang') ?? '';
  if (!isLanguage(lang)) fail('LANG', `Not a well-formed BCP 47 language tag: ${lang}`, 1);
  const direction = fields.get('direction') ?? 'ltr';
  const writingMode = fields.get('writing-mode') ?? 'horizontal-tb';
  if (!['ltr', 'rtl', 'auto'].includes(direction)) fail('DIRECTION', 'direction must be ltr, rtl or auto.', 1);
  if (!['horizontal-tb', 'vertical-rl', 'vertical-lr'].includes(writingMode)) fail('WRITING_MODE', 'Unsupported writing-mode.', 1);
  if (fields.has('cover') !== fields.has('cover-alt')) fail('COVER', 'cover and nonempty cover-alt must be supplied together.', 1);
  const cover = fields.has('cover') ? { src: asset(fields.get('cover') ?? ''), alt: fields.get('cover-alt') ?? '' } : null;
  const known = ['yompub', 'title', 'author', 'lang', 'direction', 'writing-mode', 'cover', 'cover-alt'];
  const warnings = [...fields.keys()].filter(k => !known.includes(k)).map(k => ({ code: 'UNKNOWN_FIELD', message: `Ignored non-Core field: ${k}` }));
  /** @type {Set<string>} */ const assets = new Set(cover ? [cover.src] : []);
  /** @type {string[]} */ const links = [];
  /** @type {Book['toc']} */ const toc = [];
  const tokens = md.parse(lines.slice(end + 1).join('\n'), {});
  let index = 0, previousLevel = 0;
  /** @param {string} [until] @param {number} [depth] @returns {Block[]} */
  function blocks(until, depth = 0) {
    /** @type {Block[]} */ const out = [];
    while (index < tokens.length) {
      const t = tokens[index++];
      if (t.level >= 120) fail('LIMIT', 'This implementation supports nesting below 120 levels.');
      if (t.type === until) return out;
      const lineNumber = (t.map?.[0] ?? 0) + end + 2;
      switch (t.type) {
        case 'paragraph_open': {
          const inline = tokens[index++];
          out.push({ type: 'paragraph', children: inlines(inline.children ?? [], assets, links) });
          index++; break;
        }
        case 'heading_open': {
          const level = Number(t.tag.slice(1));
          if (depth || level > previousLevel + 1) fail('HEADING', 'Headings must be top-level, start at h1, and not skip levels.', lineNumber);
          const inline = tokens[index++]; index++;
          const children = inlines(inline.children ?? [], assets, links);
          const label = plainText(children);
          if (!label.trim()) fail('HEADING', 'Heading text must be nonempty.', lineNumber);
          const id = `h-${toc.length + 1}`;
          previousLevel = level;
          toc.push({ id, level, label });
          out.push({ type: 'heading', level, id, children });
          break;
        }
        case 'blockquote_open': out.push({ type: 'blockquote', children: blocks('blockquote_close', depth + 1) }); break;
        case 'list_item_open': out.push({ type: 'item', children: blocks('list_item_close', depth + 1) }); break;
        case 'bullet_list_open': case 'ordered_list_open': {
          const startIndex = index;
          const children = blocks(t.type.replace('_open', '_close'), depth + 1);
          // Only direct list-item paragraphs determine tightness, not nested lists.
          const paragraphs = tokens.slice(startIndex, index).filter(p => p.type === 'paragraph_open' && p.level === t.level + 2);
          out.push({ type: 'list', ordered: t.type === 'ordered_list_open', start: Number(t.attrGet('start') ?? 1), tight: paragraphs.every(p => p.hidden), children });
          break;
        }
        case 'fence': case 'code_block': out.push({ type: 'codeBlock', value: t.content, info: md.utils.unescapeAll(t.info).trim() }); break;
        case 'hr': out.push({ type: 'thematicBreak' }); break;
        case 'html_block': fail('HTML', 'Raw HTML is outside Core. Escape it or put it in code.', lineNumber); break;
        default: fail('TOKEN', `Unsupported block construct: ${t.type}`, lineNumber);
      }
    }
    return out;
  }
  const body = blocks();
  if (!toc.length) fail('HEADING', 'A book needs at least one top-level h1 heading.');
  for (const href of links) if (href.startsWith('#') && !toc.some(h => `#${h.id}` === href)) fail('LINK_TARGET', `Missing heading: ${href}`);
  return { book: { format: FORMAT, metadata: { title: fields.get('title') ?? '', author: fields.get('author') ?? null, lang, direction: /** @type {Direction} */ (direction), writingMode: /** @type {WritingMode} */ (writingMode), cover }, blocks: body, toc, assets: [...assets].sort() }, warnings };
}
