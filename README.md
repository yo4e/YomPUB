# YomPUB（よむパブ）

**小さく、開かれ、人が手で書ける、リフロー本のための元原稿。**

テキストエディタで読める `book.md` と画像フォルダから、本を持ち運べる形式を試しています。日本語縦書き・ルビ、RTLと混在テキストを最初から扱い、描画はブラウザの文字組みに任せます。総合執筆アプリやEPUBの置換を目指すものではありません。

**現在: Core 0.1.0-draft.1 の規範案＋最小parser/CLI/viewer。実験段階で、将来の互換性はまだ約束しません。** Phase 0とMarkua比較後の継続判断は完了しています（[Issue #7](https://github.com/yo4e/YomPUB/issues/7)）。現在の起点は[Issue #9](https://github.com/yo4e/YomPUB/issues/9)です。

## まず触る

Node.js 22以上が必要です。リポジトリのフォルダで実行します。

```sh
npm ci
npm run dev
```

表示された **http://127.0.0.1:4178** をブラウザで開き、三冊から選んでください。終了はターミナルで `Ctrl+C`。4178番を使っている場合は `PORT=4180 npm run dev` で変更できます。

- **The Small Harbour** — 横書き、章節、リンク、画像alt。表紙はありません。
- **月の港** — 日本語縦書き、ルビ、明示表紙。本文は**左右にスクロール**します。
- **ضوء الميناء** — アラビア語RTLの中に、英語・ヘブライ語・数字・URLを含む本。

目次から移動し、文字サイズを変えてみてください。「原稿と解析結果を確認」から素の原稿を読み、原稿または意味モデルのJSONを保存できます。保存したbook.mdだけでは画像は同梱されません。交換するときは本のフォルダ全体を渡します。

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
- [データだけの適合例](tests/fixtures/conformance.json) / [AST型](src/model.d.ts)
- [次の検証ゲート](ROADMAP.md) / [Phase 1の方針](docs/PHASE1_WORKING_DIRECTION.md)

依存なしの専用書式実装を主張しているわけではありません。CommonMark 0.31.2を明示的な基底とし、小さな出版意味論を追加しています。未知のMarkdown拡張は有効化せず、HTML・不正なCore記法を黙って削除しません。独立実装やEPUB変換は次の検証対象です。

## English

YomPUB is a tiny, experimental source profile for ordinary reflowable books. A UTF-8 `book.md` plus local images stays readable in a plain text editor. The prototype includes a strict CommonMark-based parser, semantic JSON projection, CLI validator, and local browser reader with Japanese vertical text/ruby and isolated multilingual RTL/LTR runs.

Run `npm ci && npm run dev`, then open http://127.0.0.1:4178. Choose a sample or open a folder containing `book.md`. Local files stay in your browser. `npm run check` runs static/unit checks; `npm run test:ui` runs headless Chromium and WebKit after `npx playwright install chromium webkit`.

The [draft specification](docs/spec/0.1-draft.1.md) is written in English for independent implementers. This is not a published compatibility promise or an EPUB/PDF exporter. Footnotes, captions, arbitrary HTML/CSS/JS, fixed layout, audio/video, ZIP packaging and an integrated authoring app are outside this slice.

## License / ライセンス

Original specifications, code and purpose-written samples are [MIT](LICENSE), except where separately identified. The imported CommonMark conformance corpus has its own attribution and CC BY-SA 4.0 terms; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
