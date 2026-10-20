/** @typedef {import('./model.js').Book} Book */
/** @typedef {import('./model.js').Inline} Inline */
/** @typedef {import('./model.js').Block} Block */

/** Render a validated AST with DOM APIs, never manuscript HTML.
 * @param {Book} book
 * @param {{document: Document, resolveAsset: (path: string) => string}} options
 */
export function renderBook(book, { document: doc, resolveAsset }) {
  /** @param {string} tag @param {string} [text] */
  const el = (tag, text) => {
    const e = doc.createElement(tag);
    if (text !== undefined) e.textContent = text;
    return e;
  };
  /** @param {Inline[]} nodes @param {HTMLElement} parent */
  function inline(nodes, parent) {
    for (const n of nodes) {
      if (n.type === 'text') { parent.append(doc.createTextNode(n.value)); continue; }
      if (n.type === 'softBreak') { parent.append(doc.createTextNode('\n')); continue; }
      let e;
      switch (n.type) {
        case 'hardBreak': e = el('br'); break;
        case 'code': e = el('code', n.value); break;
        case 'emphasis': case 'strong': e = el(n.type === 'emphasis' ? 'em' : 'strong'); inline(n.children, e); break;
        case 'link':
          e = el('a'); e.setAttribute('href', n.href);
          if (!n.href.startsWith('#')) { e.setAttribute('rel', 'noopener noreferrer'); e.setAttribute('target', '_blank'); }
          if (n.title) e.title = n.title;
          inline(n.children, e); break;
        case 'image':
          e = el('img'); e.setAttribute('src', resolveAsset(n.src)); e.setAttribute('alt', n.alt);
          if (n.title) e.title = n.title;
          e.setAttribute('decoding', 'async'); break;
        case 'ruby':
          e = el('ruby');
          e.append(doc.createTextNode(n.base), el('rp', '（'), el('rt', n.annotation), el('rp', '）'));
          break;
        case 'span': e = el('bdi', n.value); e.lang = n.lang; e.dir = n.direction; break;
      }
      parent.append(e);
    }
  }
  /** @param {Block[]} nodes @param {HTMLElement} parent @param {boolean} [tight] */
  function blocks(nodes, parent, tight = false) {
    for (const n of nodes) {
      let e;
      switch (n.type) {
        case 'paragraph':
          if (tight) { inline(n.children, parent); continue; }
          e = el('p'); inline(n.children, e); break;
        case 'heading': e = el(`h${n.level}`); e.id = n.id; e.tabIndex = -1; inline(n.children, e); break;
        case 'blockquote': e = el('blockquote'); blocks(n.children, e); break;
        case 'list': e = el(n.ordered ? 'ol' : 'ul'); if (n.ordered) e.setAttribute('start', String(n.start)); blocks(n.children, e, n.tight); break;
        case 'item': e = el('li'); blocks(n.children, e, tight); break;
        case 'codeBlock': e = el('pre'); e.append(el('code', n.value)); break;
        case 'thematicBreak': e = el('hr'); break;
      }
      parent.append(e);
    }
  }
  const article = el('article');
  article.className = 'book';
  article.lang = book.metadata.lang;
  article.dir = book.metadata.direction;
  article.style.writingMode = book.metadata.writingMode;
  article.dataset.mode = book.metadata.writingMode;
  article.setAttribute('aria-label', book.metadata.title);
  if (book.metadata.cover) {
    const cover = el('div'); cover.className = 'cover';
    const img = el('img'); img.setAttribute('src', resolveAsset(book.metadata.cover.src)); img.setAttribute('alt', book.metadata.cover.alt);
    cover.append(img); article.append(cover);
  }
  blocks(book.blocks, article);
  return article;
}
