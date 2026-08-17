# YomPUB（よむパブ）

**小さく、開かれ、人が手で書ける、リフロー電子書籍フォーマット。**  
**A tiny, open, human-writable format for reflowable digital books.**

[日本語](#日本語) / [English](#english)

---

## 日本語

YomPUB（よむパブ）は、**テキストエディタだけでも本を作れるくらい単純な電子書籍フォーマット**を目指す実験的なOSSプロジェクトです。

EPUBやPDFを置き換えることが目的ではありません。Webや仮想空間でも軽く扱え、必要ならEPUBやPDFへ変換できる、**シンプルな**「**本の元データ**」を作ります。

### こんな本

最小のYomPUBは、これくらい単純です。

```text
my-book/
├── book.md
└── assets/
    ├── cover.jpg
    └── figure-01.png
```

`book.md` は、専用ツールがなくても人間がそのまま読めます。

```md
---
title: 月面旅館
author: 山田佳江
lang: ja
writing-mode: vertical-rl
---

# 第一章　月面旅館

月面に旅館ができたのは、夏の終わりだった。

![月面旅館](assets/figure-01.png)

これは｜人工知能《じんこうちのう》についての話でもある。
```

YomPUB自体は本のデータを単純に保ち、**表示の仕事はビューワーに任せます。**

専用ビューワーがなくても読める。ビューワーを使えば、もっと読みやすい。  
**Readable without a YomPUB reader. Better with one.**

### 基本思想

- **手で書ける。** 専用オーサリングソフトを必須にしない。
- **Coreは小さく。** 普通の本に不要な機能は、規格本体へ入れない。
- **リフロー前提。** 画面や文字サイズに合わせて本文が流れ直す。
- **世界中の文字を扱う。** LTR、RTL、縦書きを最初から考える。
- **表示と変換は外付け。** Web Viewer、DOCX入力、EPUB/PDF出力などは周辺ツールとして作る。

現在は、CommonMarkを基礎にした小さなMarkdownプロファイルを有力候補として検討しています。Markdown採用を含め、まだ仕様は確定していません。

詳しい初期設計は [`docs/DESIGN_DRAFT.md`](docs/DESIGN_DRAFT.md)、バージョニング方針は [`docs/VERSIONING.md`](docs/VERSIONING.md) にあります。

**Status: Pre-spec / Experimental**

名前の **Yom** は、日本語の「読む（yomu）」から。偶然にもヘブライ語の *yom* は「日」を意味します。**1DAYで出版できるくらい軽く。** それもYomPUBの思想です。

---

## English

YomPUB is an experimental open-source project for a digital book format **simple enough to author by hand in a plain text editor**.

It is not intended to replace EPUB or PDF. YomPUB aims to be a **small, portable source format for books** that is easy to use on the Web and in virtual spaces, while remaining exportable to formats such as EPUB and PDF.

### A tiny book

A minimal YomPUB book should be almost boring:

```text
my-book/
├── book.md
└── assets/
    ├── cover.jpg
    └── figure-01.png
```

`book.md` remains readable even without YomPUB-specific software.

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

YomPUB keeps the book data simple and **leaves rendering to the viewer.**

**Readable without a YomPUB reader. Better with one.**

### Principles

- **Human-writable.** No dedicated authoring application is required.
- **Tiny Core.** Features ordinary books do not need stay out of the base format.
- **Reflow first.** Text adapts to the reading environment and font size.
- **International from the start.** LTR, RTL, and vertical writing are first-class requirements.
- **Rendering and conversion stay outside the format.** Web viewers, DOCX import, and EPUB/PDF export belong in companion tools.

A small CommonMark-based Markdown profile is currently the leading candidate, but even Markdown is not yet a final decision.

See [`docs/DESIGN_DRAFT.md`](docs/DESIGN_DRAFT.md) for the initial design notes and [`docs/VERSIONING.md`](docs/VERSIONING.md) for the versioning policy.

**Status: Pre-spec / Experimental**

The name **Yom** comes from the Japanese *yomu* (読む), “to read.” By coincidence, Hebrew *yom* means “day” — a nice fit for the idea that publishing should be light enough to happen in a day.
