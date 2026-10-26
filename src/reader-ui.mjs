// Trusted, fixed UI markup only. Manuscript content always goes through renderBook.
export const markup = `
<div class="shell" lang="ja">
  <div class="load-state"><p id="status" role="status" aria-live="polite">本を選んでください。</p><button id="cancel" type="button" hidden>読み込みを中断</button></div>
  <p id="error" role="alert" hidden></p>
  <section id="reader" hidden aria-label="本のビューア">
    <div class="reader-top"><div><p id="mode-label"></p><h2 id="book-title"></h2><p id="book-author"></p></div><div class="controls" role="group" aria-label="表示設定">
      <label for="font-size">文字サイズ</label><span class="slider-control"><input id="font-size" type="range" min="16" max="32" step="1" value="20"><output id="font-value" for="font-size">20px</output></span>
      <label for="line-height">行間</label><span class="slider-control"><input id="line-height" type="range" min="1.6" max="2.4" step="0.1" value="1.9"><output id="line-value" for="line-height">1.9倍</output></span>
      <label for="font-family">書体</label><select id="font-family"><option value="mincho">明朝</option><option value="gothic">ゴシック</option></select>
      <label for="theme">配色</label><select id="theme"><option value="paper">昼</option><option value="night">夜</option></select>
      <button id="close-book" type="button">本を閉じる</button>
    </div></div>
    <div class="reading-layout"><nav id="toc" aria-label="目次"></nav><div id="viewport" tabindex="0" role="region" aria-label="本文。縦書きでは左右にスクロールできます。"></div></div>
    <details id="source-panel"><summary>原稿と解析結果を確認</summary><p class="hint">編集はテキストエディタで行い、保存した原稿を開き直してください。</p><div class="source-actions"><button id="download-source" type="button">原稿を保存</button><button id="download-ast" type="button">意味モデル（JSON）を保存</button></div><pre id="source" tabindex="0" dir="auto"></pre><pre id="warnings"></pre></details>
  </section>
</div>`;
