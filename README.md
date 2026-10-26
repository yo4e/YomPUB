# YomPUB（よむパブ）

**小さく、開かれ、人が手で書ける、リフロー本のための元原稿。**

テキストエディタで読める `book.md` と画像フォルダから、本を持ち運べる形式を試しています。日本語縦書き・ルビ、RTLと混在テキストを最初から扱い、描画はブラウザの文字組みに任せます。総合執筆アプリやEPUBの置換を目指すものではありません。

**現在: Core 0.1.0-draft.1 の規範案＋最小parser/CLI/viewer。実験段階で、将来の互換性はまだ約束しません。** Phase 0とMarkua比較後の継続判断は完了しています（[Issue #7](https://github.com/yo4e/YomPUB/issues/7)）。現在の起点は[Issue #9](https://github.com/yo4e/YomPUB/issues/9)です。

## まず触る

**[ブラウザで試用版を開く](https://yo4e.github.io/YomPUB/)** — インストール不要。三冊のサンプルを選び、縦書き・ルビ・RTL混在と原稿表示を試せます。実験段階のreaderで、将来の書式互換性はまだ約束していません。

自分のフォルダを開いた場合も原稿・画像はブラウザ内で処理され、送信されません。試用版のアプリと既存サンプルの配信元はGitHub Pagesです。公開対象はアプリと既存の三冊・参照画像だけです。

手元で動かす場合：

Node.js 22以上とGitが必要です。初回の依存インストールにはネット接続が必要です。

```sh
git clone https://github.com/yo4e/YomPUB.git
cd YomPUB
npm ci
npm run dev
```

表示された **http://127.0.0.1:4178** をブラウザで開き、三冊から選んでください。終了はターミナルで `Ctrl+C`。4178番を使っている場合は `PORT=4180 npm run dev` で変更できます。

**複数冊の埋め込み実証**は同じサーバーの **http://127.0.0.1:4178/embed.html**。他サイトを想定した小さなホスト上で、各冊の配色・寸法・リンク移動・破棄/再生成を試せます。[埋め込み手順とAPI](docs/EMBEDDING.md)を参照してください。


- **[The Small Harbour](samples/horizontal/book.md)** — 横書き、章節、リンク、画像alt。表紙はありません。
- **[月の港](samples/vertical/book.md)** — 日本語縦書き、ルビ、明示表紙。本文は**左右にスクロール**します。
- **[ضوء الميناء](samples/rtl/book.md)** — アラビア語RTLの中に、英語・ヘブライ語・数字・URLを含む本。

目次から移動し、文字サイズ（16〜32px）・行間（1.6〜2.4倍）・書体（明朝／ゴシック）を変えてみてください。昼は白地・黒文字、夜は黒地・白文字で、リンクとアクセントは青。設定変更時は読みかけの文章の位置を保ちます。「原稿と解析結果を確認」から素の原稿を読み、原稿または意味モデルのJSONを保存できます。保存したbook.mdだけでは画像は同梱されません。交換するときは本のフォルダ全体を渡します。

自分の原稿を読むには「本のフォルダを開く」で、`book.md` のあるフォルダを選びます。画像のない本は「book.mdのみ」でも読めます。選択した原稿・画像の解析はブラウザ内で行い、アップロードしません。フォルダ選択に対応するブラウザが必要です。専用エディタはありません。外部のテキストエディタで編集・保存し、同じフォルダを開き直してください。

`npm run dev` は起動時にビルドする小さなローカルサーバーです。ソースコードを変更したら `npm run build` を実行してページを再読込するか、サーバーを再起動してください。外部CDNやアカウントは不要です。`dist/index.html` を `file://` で直接開く方式には対応しません。

## 素の本

```text
my-book/
├── book.md
└── assets/
    └── harbour.png
```

```md
---
yompub: 0.1-draft.1
title: 月の港
author: 書き手の名前
lang: ja
direction: ltr
writing-mode: vertical-rl
---

# 第一章　港の灯り

「まだ、灯りがある。」｜美良《みら》は桟橋で立ち止まった。

案内板には {{en|ltr|MOON PORT}} と書かれている。

![月の下の港](assets/harbour.png)
```

ヘッダはYAMLではなく、一行ずつの文字列です。必須は `yompub`、`title`、`lang`。画像はローカルのPNG/JPEG/WebP。通常の目次は見出しから生成します。ルビは `｜本文《読み》`、短い言語・方向範囲は `{{言語|ltr/rtl/auto|本文}}`。詳しい境界とエスケープは[規範案](docs/spec/0.1-draft.1.md)が正本です。

## 現状と未検証の範囲

| 動いているもの | まだ確認・実装していないもの |
| --- | --- |
| 三冊の素の原稿→意味モデル→ブラウザ表示 | 仕様だけから作った独立実装との相互運用 |
| 日本語縦書き・ルビ、RTL/LTRの混在、構造からの目次 | 長い実在の本を通して読む評価、RTL母語話者の校閲 |
| フォルダ読込、原稿/JSON保存、文字サイズ・行間・書体・配色、中断・失敗からの復帰 | 支援技術・実機iOS/Android・他の文字体系の組版品質 |
| Nodeテスト96件（基底CommonMark公式652例の照合を含む）、ブラウザ69件の自動検証 | EPUB/PDF出力、ZIP、脚注・キャプション等の拡張 |

Coreを固定した完成仕様ではありません。テスト成功は、全言語の出版品質や将来互換性を保証しません。[検証記録](docs/VALIDATION.md)で、実施環境と既知制限を確認できます。PRとmainには[同じ検証を行うCI](https://github.com/yo4e/YomPUB/actions/workflows/ci.yml)があります。チェック結果は対象コミットに対するものです。

## parser・CLI・viewerの役割

| 入口 | 役割 |
| --- | --- |
| `src/core.mjs`: `decodeSource(bytes)` → `parseBook(source)` | UTF-8/書式を検証し、`{ book, warnings }`を返す。ファイルアクセスはしない |
| `src/local.mjs`: `loadLocalBook(path)` | parserに加え、画像の実在・範囲・署名を確認するNode用入口 |
| `src/cli.mjs`: `validate` / `ast` | 上記の検証結果や意味モデルをターミナルへ出力 |
| `src/render.mjs`: `renderBook(book, { document, resolveAsset })` | 検証済みASTを意味付きDOMへ変換するブラウザ用入口 |
| `src/reader.mjs`: `createReader(container, options?)` | 本の解析・読込・表示・設定・破棄を所有するブラウザ部品。Shadow DOMで各冊を分離 |
| `npm run dev` | ローカルviewer。画像を実際にデコードしてから本を切り替える |

parserをコードから試す場合は、リポジトリ直下のES moduleで次のように使えます。npm配布パッケージではなく、このリポジトリ内の実験用APIです。

```js
import { readFile } from 'node:fs/promises';
import { decodeSource, parseBook } from './src/core.mjs';

const bytes = await readFile('samples/vertical/book.md');
const { book, warnings } = parseBook(decodeSource(bytes));
console.log(book.metadata, book.toc, warnings);
```

`parseBook`は不正入力を`YompubError`として拒否します。CLIの画像検証は署名までで、完全な画像デコードはviewerで確認してください。

## 検証・実装者向け

```sh
# 原稿と参照画像を検証
npm run validate -- samples/horizontal/book.md samples/vertical/book.md samples/rtl/book.md

# 意味モデルをJSONとして出力（npmの案内文を含めない場合はnodeを直接使用）
node src/cli.mjs ast samples/vertical/book.md > book.ast.json

# lint、型検査、意味・不正入力・CLIテスト、ビルド
npm run check

# 画面を占有しない実ブラウザ検証
npx playwright install chromium webkit
npm run test:ui
```

CLIは成功0、原稿/ファイルエラー1、使い方エラー2で終了します。警告・エラーはstderr、ASTはstdoutです。

- [規範案 0.1-draft.1](docs/spec/0.1-draft.1.md) — 書式、Core境界、意味モデル、失敗の扱い
- [サンプルから決めたこと](docs/CORE_DECISIONS.md) — 採用理由と保留理由
- [三冊の原稿と確認観点](samples/README.md)
- [確認手順・実施結果・既知制限](docs/VALIDATION.md)
- [複数冊の埋め込み実証・API・寿命の扱い](docs/EMBEDDING.md)
- [データだけの適合例](tests/fixtures/conformance.json) / [AST型](src/model.d.ts)
- [次の検証ゲート](ROADMAP.md) / [Phase 1の方針](docs/PHASE1_WORKING_DIRECTION.md)

依存なしの専用書式実装を主張しているわけではありません。CommonMark 0.31.2を明示的な基底とし、小さな出版意味論を追加しています。未知のMarkdown拡張は有効化せず、HTML・不正なCore記法を黙って削除しません。独立実装やEPUB変換は次の検証対象です。

## English

YomPUB is a tiny, experimental source profile for ordinary reflowable books. A UTF-8 `book.md` plus local images stays readable in a plain text editor. The prototype includes a strict CommonMark-based parser, semantic JSON projection, CLI validator, and local browser reader with Japanese vertical text/ruby and isolated multilingual RTL/LTR runs.

[Open the trial reader](https://yo4e.github.io/YomPUB/) without installing anything. Or clone this repository, enter `YomPUB`, then run `npm ci && npm run dev` and open http://127.0.0.1:4178. Choose a sample or open a folder containing `book.md`. Local files stay in your browser. `npm run check` runs static/unit checks; `npm run test:ui` runs headless Chromium and WebKit after `npx playwright install chromium webkit`.

PR/main CI runs the static checks, sample validation and headless browser scenarios on Ubuntu. The initial recorded captures were made on macOS; see [validation scope and remaining work](docs/VALIDATION.md).

GitHub Pages publishes the checked main commit, then runs the browser suite against the actual HTTPS URL. See [deployment and public verification](docs/PAGES.md).

The [draft specification](docs/spec/0.1-draft.1.md) is written in English for independent implementers. This is not a published compatibility promise or an EPUB/PDF exporter. Footnotes, captions, arbitrary HTML/CSS/JS, fixed layout, audio/video, ZIP packaging and an integrated authoring app are outside this slice.

## License / ライセンス

Original specifications, code and purpose-written samples are [MIT](LICENSE), except where separately identified. The imported CommonMark conformance corpus has its own attribution and CC BY-SA 4.0 terms; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
