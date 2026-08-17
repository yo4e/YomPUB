# YomPUB　（よむパブ）

**小さく、開かれ、人が手で書ける、リフロー電子書籍フォーマット。**  
**A tiny, open, human-writable format for reflowable digital books.**

[日本語](#日本語) / [English](#english)

---

## 日本語

YomPUBは、**テキストエディタだけでも本を作れるくらい単純な電子書籍フォーマット**を目指す実験的なOSSプロジェクトです。

名前の **Yom** は、日本語の「読む（yomu）」から。偶然にもヘブライ語の *yom* には「日」という意味があり、「一日で出版できるくらい軽い」というイメージも気に入っています。

### 目指すもの

電子書籍の元データを、できるだけ普通の原稿に近づけます。

```text
my-book/
├── book.md
└── assets/
    ├── cover.jpg
    └── figure-01.png
```

`book.md` は、YomPUB専用ツールがなくてもそのまま読めるものにします。

```md
---
title: 月面旅館
author: 山田佳江
lang: ja
writing-mode: vertical-rl
cover: assets/cover.jpg
---

# 第一章　月面旅館

月面に旅館ができたのは、夏の終わりだった。

![月面旅館の外観](assets/figure-01.png)

これは｜人工知能《じんこうちのう》についての話でもある。
```

### 基本思想

- **手で書ける。** 専用オーサリングソフトを必須にしない。
- **Coreは小さく。** 「できるから」という理由だけで機能を増やさない。
- **リフロー前提。** 固定ページではなく、読む環境に合わせて流れる本を扱う。
- **世界中の文字を最初から考える。** LTR、RTL、縦書きを基本要件にする。
- **見た目の多くは読者側へ。** フォント、余白、テーマなどは原則としてビューワーが担う。
- **著者にHTMLを要求しない。** Webは重要な表示先だが、HTMLを執筆形式にはしない。
- **変換機能は規格の外へ。** DOCX入力、EPUB/PDF出力などはコンバーターや追加ツールで扱う。
- **素の原稿が資産。** 独自ソフトがなくても読め、Gitでも管理できる形を守る。

### 現在の設計候補

現時点では、**CommonMarkを基礎にした小さなMarkdownプロファイル**が最有力です。ただしMarkdown採用はまだ確定ではありません。

候補となっているCoreは次の程度です。

- UTF-8テキスト
- CommonMarkの保守的なサブセット
- ごく小さな `key: value` メタデータヘッダ
- Markdown標準の画像記法
- ルビなど、出版に本当に必要な少数の拡張
- Coreではraw HTMLを使わない
- CoreではJavaScriptなどの実行可能コンテンツを持たない
- 画像などは相対パスで参照

メタデータはYAML全体を仕様として背負わず、まずは単純なスカラー値だけで済む独自の極小ヘッダを検討します。

### 文字方向

```text
Englishなど      horizontal-tb / ltr
Arabicなど       horizontal-tb / rtl
日本語縦書き      vertical-rl
```

YomPUB自身が文字組みエンジンを発明するのではなく、UnicodeやWebプラットフォームにすでにある標準的な文字方向・縦書き処理を利用する方針です。

### YomPUBが目指さないもの

EPUBの全機能を再実装することは目標ではありません。固定レイアウト、任意CSS、JavaScript、複雑なマルチメディア、DRM、プロ向けDTP機能などをCoreへ詰め込む予定もありません。

Coreへ機能を追加するときの問いは一つです。

> **普通のリフロー本を書く・読むために、本当に必要か？**

通常必要でないなら、拡張か外部ツールへ回します。

### 将来の周辺ツール

- モバイルフレンドリーなOSS Web Viewer
- バリデーター
- DOCX → YomPUB
- YomPUB → EPUB
- YomPUB → PDF
- エディタや出版支援ツール
- Web／仮想空間で「本」をそのまま置いて読める仕組み

詳しい初期検討は [`docs/DESIGN_DRAFT.md`](docs/DESIGN_DRAFT.md) にまとめます。

**Status: Pre-spec / Experimental**  
まだ何も固定されていません。まずは「本当に気持ちよく手で書ける最小の電子書籍形式」を見つけます。

---

## English

YomPUB is an experimental open-source project for a digital book format **simple enough to author by hand in a plain text editor**.

The name **Yom** comes from the Japanese *yomu* (読む, “to read”). By coincidence, *yom* also means “day” in Hebrew — a nice fit for the idea that publishing a simple digital book should be possible in a day, not after wrestling with a complex container format.

### The goal

A digital book source should look as much as possible like an ordinary manuscript.

```text
my-book/
├── book.md
└── assets/
    ├── cover.jpg
    └── figure-01.png
```

`book.md` should remain readable even without any YomPUB-specific software.

```md
---
title: The Moon Inn
author: A. Writer
lang: en
writing-mode: horizontal-tb
---

# Chapter One

The inn on the Moon opened at the end of summer.

![The Moon Inn](assets/figure-01.png)
```

### Design principles

- **Human-writable first.** No dedicated authoring application should be required.
- **Keep the Core tiny.** A feature does not belong in the base format merely because it is possible.
- **Reflow first.** YomPUB describes books that adapt to their reading environment rather than fixed pages.
- **International from the start.** LTR, RTL, and vertical writing are first-class requirements.
- **Reader-controlled presentation.** Fonts, margins, themes, and most visual styling belong to the viewer.
- **No HTML required from authors.** The Web is an important renderer, but HTML is not the authoring model.
- **Converters are tools, not the format.** DOCX import and EPUB/PDF export belong in companion tools.
- **The plain source is the asset.** It should remain readable, inspectable, and Git-friendly without proprietary software.

### Current design direction

The leading candidate is a **small CommonMark-based Markdown profile**, but Markdown is not yet a permanent decision.

The possible Core is intentionally modest:

- UTF-8 text
- a conservative CommonMark subset
- a tiny `key: value` metadata header
- standard Markdown image syntax
- only a few publication-specific extensions, beginning with features such as ruby text
- no raw HTML in the Core profile
- no JavaScript or executable content in the Core profile
- relative local asset paths

Rather than adopting all of YAML, the metadata block may use a deliberately tiny YomPUB grammar with simple scalar values only.

### Writing directions

```text
English, etc.       horizontal-tb / ltr
Arabic, etc.        horizontal-tb / rtl
Japanese vertical   vertical-rl
```

YomPUB should not invent a new text layout engine. Renderers should rely on established Unicode bidirectional behavior and platform/Web writing-mode capabilities.

### What YomPUB is not

YomPUB is not an attempt to reimplement every EPUB feature. Fixed-layout publishing, arbitrary CSS, JavaScript, complex multimedia, DRM, and professional page-layout features do not belong in the initial Core.

The question for every proposed Core feature is:

> **Does an ordinary reflowable book actually need this to be written and read?**

If not, it probably belongs in an extension or companion tool.

### Planned companion tools

- mobile-friendly open-source Web Viewer
- validator
- DOCX → YomPUB converter
- YomPUB → EPUB exporter
- YomPUB → PDF exporter
- optional editors and publishing tools
- lightweight book objects for Web and virtual spaces

See [`docs/DESIGN_DRAFT.md`](docs/DESIGN_DRAFT.md) for the initial design discussion.

**Status: Pre-spec / Experimental**  
Nothing is stable yet. The immediate goal is to discover the smallest format that is genuinely pleasant to author and read.
