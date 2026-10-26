# 小さなホストへの埋め込み（実験版）

2026-10-23 / [Issue #16](https://github.com/yo4e/YomPUB/issues/16) / Core書式の変更なし。

単独readerと同じ部品を、ホストが用意する複数の領域へ配置する実証。npm配布や安定APIの宣言ではない。各部品はShadow DOMを所有し、CSS・配色・文字サイズ・読込状態・見出しDOM IDを分離する。描画は引き続きブラウザに任せる。

## まず触る

リポジトリ直下で `npm run dev`（初回は `npm ci`）。**http://127.0.0.1:4178/embed.html** を開く。単独readerは同じサーバーの `/`。

1. Aの文字サイズ・行間・書体・配色を変える。B/Cと、紫色のホスト側の枠・ボタンは変わらない。既定の本文背景は白。
2. Bも「横書き」に切り替える。A/Bそれぞれの目次・本文リンクから「The return」へ移動する。同じ `h-3` でも相手の本文やホストの見出しへ飛ばない。
3. Bで「縦書き＋ルビ」を開き、章へ移動する。CのRTL表示を読みながらBを閉じる・破棄・再生成する。Cはそのまま読める。
4. ウィンドウ幅を狭める。目次の配置はページ全体の幅でなく、それぞれの領域の幅に従う。本文の縦書きは領域内の左右スクロールで読む。

終了はサーバーのターミナルで `Ctrl+C`。ソース変更後は `npm run build` とページ再読込。自動テストは `npm run test:ui`、埋め込みだけなら `npm run test:ui -- tests/browser/embed.spec.mjs`。手動で本人のブラウザを操作せず、ヘッドレスで実行できる。

## 他のホストで使う最小例

`npm run build` 後の `dist/reader.mjs` と `dist/parser-worker.mjs` を、ホストと同じオリジンの同じディレクトリ（例: `/yompub/`）へ置く。CSSはreaderのモジュール内に含まれる。単独reader用の `app.mjs`、`style.css`、サンプルは不要。配布時は `LICENSE`、`THIRD_PARTY_NOTICES.md`、`licenses/` の関連表示も維持する。`file://` ではなくHTTP(S)で配信する。

```html
<div id="book-slot" style="width: min(100%, 660px); height: 620px"></div>
<script type="module">
  import { createReader } from './yompub/reader.mjs';

  const reader = createReader(document.getElementById('book-slot'), {
    fontSize: 20,
    lineHeight: 1.9,
    fontFamily: 'mincho',
    theme: 'paper'
  });
  const source = `---
yompub: 0.1-draft.1
title: 小さな本
lang: ja
writing-mode: vertical-rl
---
# 港へ

｜港《みなと》の灯りを見た。
`;
  const result = await reader.open([
    { path: 'book.md', file: new Blob([source], { type: 'text/markdown' }) }
  ]);
  if (result.status === 'error') console.error(result.code, result.message);

  // SPAの画面を取り外すときは reader.destroy() を呼ぶ。
</script>
```

ホストが領域の幅と**確定した高さ**を与える。目安は幅320px以上・高さ620px程度。高さが極端に低ければ操作部だけで領域を使い切る。readerは勝手に画面全体の高さやホストの余白を変更しない。画像は原稿の相対パスで、同じ配列へ `{path:'assets/harbour.png', file:blob}` のように渡す。

## APIと寿命

実装は [`src/reader.mjs`](../src/reader.mjs)、入力の型は [`src/reader-types.d.ts`](../src/reader-types.d.ts)。戻り値はインスタンスごとに独立している。

| 操作 | 契約 |
| --- | --- |
| `createReader(container, options?)` | 接続するDOM要素を受け取り、所有する子要素を一つ追加。`fontSize` は16〜32px、`lineHeight` は1.6〜2.4倍、`fontFamily` は `mincho` / `gothic`、`theme` は `paper`（白）/ `night`。不正な設定は例外 |
| `reader.element` | 所有する子要素。状態イベントの購読先。内部Shadow DOMはデバッグ用にopenだが、内部ID/CSSへの直接依存はAPIに含めない |
| `reader.open(files)` | `{path:string, file:Blob \| File}[]` を解析・画像デコードしてから切替。`book.md` 必須。パスは本の根からの相対パスで、一意。入力はWorkerへコピー |
| `reader.open(async signal => files)` | ホストが取得する間も中断可能。reader自体は原稿URLをfetchしない。ネット取得の認証・許可・URL選択はホストの責務 |
| `reader.cancel()` | 現在の読込を中断。Workerを停止し、取得コールバックのsignalをabort。表示中の本は残す |
| `reader.close()` | 読込を中断し、本・原稿・画像URLを解放。部品は残り、再びopenできる |
| `reader.destroy()` | 読込・イベント監視・保存用タイマー・画像URLを解放し、所有DOMを取り外す。繰り返し呼んでもよい。以後再利用せず、新たにcreateReaderする |
| `reader.setOptions({fontSize?, lineHeight?, fontFamily?, theme?, chrome?})` | この部品だけ設定変更。表示中の文字を基準に読み位置を維持し、先頭・末尾ではその端を維持。不正値は変更を適用する前に例外、破棄後も例外 |
| `reader.navigate('h-3')` | この本の見出しへスクロールしてフォーカス。存在すればtrue、存在しない/破棄後はfalse |
| `reader.advance(1)` / `reader.advance(-1)` | 読み順で次/前へ、本文領域の85%ずつ重ねてスクロール。方向とwriting-modeに従う。本なし/破棄後はfalse。不正な方向は例外。reduce motion指定では即時移動 |
| `reader.getPosition()` | `{progress,atStart,atEnd}`。progressはスクロール範囲に対する0〜1。本なし/破棄後はnull。固定ページ番号ではない |
| `reader.getSnapshot()` | `{source, book, warnings}` の独立したコピー。本なし/破棄後はnull。ホストでコピーを変えても表示中の本は変わらない |

`open`は `{status:'opened'}` / `{status:'cancelled'}` / `{status:'destroyed'}` / `{status:'error',code,message}` に完了する。新しいopenは前のopenをcancelledとして完了させる。失敗時は前の本を維持する。cancel/destroyはコールバックが未完了でも即座にopenのPromiseを完了させ、遅れて戻る結果を無視する。ただしホスト自身の通信や資源は、コールバック側でもsignalを処理して中止する必要がある。破棄済みのopenはdestroyedを返す。

表示設定の既定は20px・明朝・白背景。行間は通常1.9倍、`chrome:'none'` で生成した場合は従来どおり2倍。UIを隠したホストも `reader.setOptions({fontSize:24, lineHeight:2.2, fontFamily:'gothic'})` で変更できる。設定は同じインスタンスで本を開き直しても維持するが、ページ再読込や再生成を越える保存はしない。明朝・ゴシックは端末内の日本語フォントを優先し、フォントファイルの取得は行わない。

通常のUIでは右上の「表示設定」から文字サイズ・行間・書体・配色のパネルを開く。パネルは本文に重なり、開閉で本文の寸法や読み位置を変えない。Escで閉じると「表示設定」にフォーカスが戻る。本の切替・閉じる・`chrome:'none'` への変更ではパネルを閉じる。設定値は従来どおり保持する。パネルは埋め込み領域の幅に収まり、別のreaderやホストの設定UIを操作しない。

昼（API値は互換性のため `paper`）は白地 `#fff`・黒文字 `#000`・青リンク `#0000ee`。夜（`night`）は黒地 `#000`・白文字 `#fff`・明るい青リンク `#6699ff`。本文だけでなく設定・目次・原稿欄も配色に従う。夜の青は黒背景とのコントラストを保つため明るくする。下線・フォーカス枠も維持する。

埋め込み時だけ色を合わせたい場合、ホストのmountに次のCSS変数を指定できる。全て任意で、未指定は上記のプレーンな配色。`chrome:'none'` でも同じように適用され、別インスタンスには影響しない。

```css
#book-slot {
  --yompub-paper-background: #fff;
  --yompub-paper-foreground: #000;
  --yompub-paper-accent: #0000ee;
  --yompub-night-background: #000;
  --yompub-night-foreground: #fff;
  --yompub-night-accent: #6699ff;
}
```

独自色を使う場合は背景と文字・リンクの組み合わせをホスト側で確認する。readerはホストページ全体の配色を書き換えない。`reader.element` の `data-yompub-theme` に現在の `paper` / `night` を反映し、単独viewerのページだけはその値をCSSで参照して周囲の背景もそろえる。新しいカラー設定UI・localStorage保存は含まない。

設定変更後の `yompub-position` は再配置後の値を返す。文字サイズ・行間・書体により総スクロール量は変わるので、同じ文章を見ていても進捗の数値は変わりうる。画像などで本文の文字が見えない場合はスクロール比率で補う。縦書きのルビは本文右側を維持するため、行間の下限は1.6倍。テンプレートへの設定UI追加やvendor更新は、この変更には含めない。

`yompub-state` イベントはelementからbubbleし、`detail` は `{state, hasBook, title}`。stateは `loading` → `parse` → `assets` → `open`、または `error` / `cancelled` / `closed` / `destroyed`。`title` は表示中の本の題名（本なしはnull）。購読はopenする前に行う。**ホストがDOMを取り外すだけではdestroyは呼ばれない**ので、画面のアンマウント時に明示する。

AbortSignalのイベント中にホストが同期的にdestroyしたり、別のopenを始めたりしても、古い操作はDOMや新しい読込を上書きしない。新しい操作を優先する。待機中の処理がないcancelは何もしない。

書棚ホスト用に `chrome:'none'` を追加した（既定は `full`）。noneでは部品の書誌・目次・設定・解析表示・状態表示を隠し、ホストが題名・読込中・エラー復帰・終了操作を提供する。本文とエラー領域は残る。スクロールまたは本文領域のリサイズで `yompub-position` がbubbleし、detailにgetPositionと同じ値を渡す。隠していた領域を表示した直後はホストでもgetPositionを呼ぶ。ResizeObserverもdestroy時に解除する。

ホストはShadow DOMの内部へアクセスせず、このAPIで寿命・移動・表紙と書棚の切替を扱える。

## 分離する境界

- CSSはShadow DOMの中だけに設置。単独アプリのCSSも部品へ含めない。ホストの通常の要素・クラスセレクタは内部の本文や操作部に届かず、書体・方向・独自変数の既定値も部品内で指定する。ホストが所有要素そのものを隠す・寸法変更する・内部DOMを直接改変することまで防ぐ仕組みではない。
- ASTの論理見出しID `h-N` は変更しない。DOM IDは各Shadow DOM内で一意。目次/本文の内部リンクは各rootで解決し、その本文viewportだけをスクロールする。ページのURLハッシュは変更しない。ブラウザの戻る/進むや外部からのハッシュ直リンクは、この版ではホスト側のnavigate呼出しへ対応付ける。
- フォーカスは通常のDOM操作としてホストと共存する。ゲームの入力抑止・オーバーレイ管理・読書終了時のフォーカス復帰はホストが設計する。ゲームエンジン、VR、iframeとの統合は今回の実証対象外。
- Shadow DOMはセキュリティ用の隔離境界ではない。原稿は従来のCore parserで検証する。低レベルの `renderBook` は検証済みASTをDOM化するだけで、ID/CSS/寿命を分離する埋め込みAPIではない。

## 配信と残る制限

ブラウザのES modules、module Worker、Shadow DOM、container queries、画像decodeが必要。Workerはreaderモジュールの隣から起動するため、両方をホストと同じオリジンで配信する。別オリジンのCDNから直接readerだけimportする構成は未対応。CSPを使うホストは同一オリジンのscript/worker、Blob画像、およびこの実装が挿入するstyle要素・style属性を許可する必要がある。厳しいCSP向けのnonce/外部スタイル構成は未実装。

原稿2 MiB、画像1点10 MiB、参照画像合計40 MiB、入力2,000ファイル等のCore/worker制限を維持する。Unicode・画像・構造の検証を省略して直接HTMLを埋め込む経路は増やしていない。部品は配信済み画像をBlob化して持つため、複数冊を常駐させればその分のメモリは必要。URLとWorkerの解放はテストしたが、ブラウザのヒープ全体の上限を保証するものではない。

検証の範囲・失敗と修正・未実施項目は [VALIDATION.md](VALIDATION.md#2026-10-26-共有readerと読書設定) に記録する。今回の次は、利用予定のホスト一つで寸法・入力・アンマウント・CSPを合わせて試す。独立parser実装、実機、支援技術、RTL母語評価、長い実本の読書は引き続き別の検証ゲート。
