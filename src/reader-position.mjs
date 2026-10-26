/** Keep a visible character at the reading edge across typography reflow.
 * A scroll percentage alone moves to different text when line wrapping changes.
 * @param {HTMLElement} viewport @param {string} mode
 */
export function captureReadingAnchor(viewport, mode) {
  const doc = viewport.ownerDocument, win = doc.defaultView;
  if (!win || !viewport.firstElementChild) return null;
  const vertical = mode !== 'horizontal-tb', reverse = mode === 'vertical-rl';
  const extent = () => Math.max(0, vertical ? viewport.scrollWidth - viewport.clientWidth : viewport.scrollHeight - viewport.clientHeight);
  const offset = vertical ? Math.abs(viewport.scrollLeft) : viewport.scrollTop;
  const progress = extent() ? offset / extent() : 0;
  const atStart = offset <= 1, atEnd = !atStart && offset >= extent() - 1;
  const css = win.getComputedStyle(viewport);
  const box = viewport.getBoundingClientRect();
  const bounds = {
    left:box.left + viewport.clientLeft + parseFloat(css.paddingLeft),
    right:box.left + viewport.clientLeft + viewport.clientWidth - parseFloat(css.paddingRight),
    top:box.top + viewport.clientTop + parseFloat(css.paddingTop),
    bottom:box.top + viewport.clientTop + viewport.clientHeight - parseFloat(css.paddingBottom)
  };
  /** @param {DOMRect} rect */
  const edge = rect => vertical ? (reverse ? -rect.right : rect.left) : rect.top;
  const boundary = vertical ? (reverse ? -bounds.right : bounds.left) : bounds.top;
  /** @type {Range|null} */ let anchor = null;
  let distance = 0;
  if (!atStart && !atEnd) {
    const nodes = doc.createTreeWalker(viewport.firstElementChild, win.NodeFilter.SHOW_TEXT);
    while (nodes.nextNode()) {
      const node = /** @type {Text} */ (nodes.currentNode);
      if (!node.data.trim() || node.parentElement?.closest('rt,rp')) continue;
      const range = doc.createRange(); range.selectNodeContents(node);
      const rect = range.getBoundingClientRect();
      if (rect.right <= bounds.left || rect.left >= bounds.right || rect.bottom <= bounds.top || rect.top >= bounds.bottom) continue;
      // Text advances monotonically along the block axis, including wrapped lines.
      let low = 0, high = node.length;
      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        range.setStart(node, mid); range.setEnd(node, mid + 1);
        if (edge(range.getBoundingClientRect()) < boundary - 1) low = mid + 1;
        else high = mid;
      }
      if (low === node.length) continue;
      range.setStart(node, low); range.setEnd(node, low + 1);
      const char = range.getBoundingClientRect();
      if (!char.width || !char.height || char.right <= bounds.left || char.left >= bounds.right || char.bottom <= bounds.top || char.top >= bounds.bottom) continue;
      anchor = range; distance = edge(char) - boundary; break;
    }
  }
  return () => {
    // Flush the new layout even at the start: RTL scroll origins can move when
    // Chromium resolves the changed font and available column height.
    const newExtent = extent();
    let next = atStart ? 0 : atEnd ? newExtent : progress * newExtent;
    if (anchor?.startContainer.isConnected) {
      const frame = viewport.getBoundingClientRect();
      const style = win.getComputedStyle(viewport);
      const leading = vertical
        ? (reverse ? -(frame.left + viewport.clientLeft + viewport.clientWidth - parseFloat(style.paddingRight)) : frame.left + viewport.clientLeft + parseFloat(style.paddingLeft))
        : frame.top + viewport.clientTop + parseFloat(style.paddingTop);
      const current = vertical ? Math.abs(viewport.scrollLeft) : viewport.scrollTop;
      next = current + edge(anchor.getBoundingClientRect()) - leading - distance;
    }
    if (vertical) viewport.scrollTo({left:(reverse ? -1 : 1) * next, behavior:'instant'});
    else viewport.scrollTo({top:next, behavior:'instant'});
  };
}
