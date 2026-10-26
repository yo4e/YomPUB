# 試す手順と検証記録

2026-10-20 / Core 0.1.0-draft.1 / prototype validation

## すぐ試す

リポジトリ直下で `npm ci` → `npm run dev`。表示された `http://127.0.0.1:4178` を開く。原稿と画像を持つフォルダをブラウザ内で読み込める。以下の初回検証記録はコミット`6b7c856`を作成した時点のもの。最新HEADの結果はGitHubのPRチェックと[Actions](https://github.com/yo4e/YomPUB/actions/workflows/ci.yml)を参照。

1. **The Small Harbour**を選択。画像にaltがあり、表紙がないことを原稿と照合。目次の「The return」へ移動し、文字サイズを変える。
2. **月の港**を選択。表紙を見たら目次で第一章へ移動。右側の列から下へ読み、左右にスクロール。`港`と`みなと`、`美良`と`みら`の対応を確認。
3. **ضوء الميناء**を選択。基本方向はRTL、`The Small Harbour (2026)`とURLはLTRの範囲。ソースが逆順になっていないことを原稿表示と照合。
4. 「原稿と解析結果を確認」を開き、原稿・JSONを保存。JSON内の`ruby.base` / `ruby.annotation`、`span.lang` / `span.direction`、画像alt、表紙が別々に保持されることを見る。
5. `samples/vertical`を別の場所へコピーし、book.mdを普通のエディタで編集。「本のフォルダを開く」でそのフォルダを読み、保存後に同じフォルダをもう一度開く。
6. コピーした原稿のルビを`｜壊れたルビ`に変える。読込時にRUBYエラーを表示し、前の本は残る。修正して開き直す。

「原稿を保存」は画像のパッケージ出力ではない。交換にはフォルダ全体が必要。ソース変更後は`npm run build`とページ再読込（またはdevサーバー再起動）。終了はCtrl+C。

## 2026-10-26 サンプル連続切替の取得競合

PR #17のmerge後、mainのサブパス検証でWebKitの連続切替が一度失敗した。保存された通信traceでは、`samples/index.json` の中断2件に続く同じURLの取得が `WebKit encountered an internal error` となり、readerは前の本を保って取得失敗を表示した。

サンプル一覧はホストに共通の小さな静的データなので、module内で取得Promiseを共有し、個別の本のAbortSignalから分離した。中断済みの呼出しは一覧取得の前後に止める。原稿・画像の取得は引き続き各本のsignalで中断し、一覧の取得失敗はキャッシュせず次の呼出しで再試行できる。Coreと原稿は変更しない。

追加のWebKit反復で、リサイズ通知を次フレームへ送っても内部viewportの監視でまれにエラーが再発した。独立した診断コピーの空のObserver callbackでも40回中1回再現したため、監視対象をホストが寸法を与えるreader境界へ変更。本文内のUI・状態変化からは別途測定を予約する。原稿パネルの開閉でも位置通知が届く回帰検証を加えた。

追加Nodeテストは、同時呼出しの一方を中断しても他方が開けること、一覧失敗後の再取得、原稿の中断と復帰を検証する。全Nodeテストは98件。既存の高速切替テストは弱めず、WebKitで20回反復して検証する。

## 2026-10-26 共有readerと読書設定

単独viewerと埋め込み用ホストが同じ `reader.mjs` を使用する。文字サイズ・行間・明朝/ゴシック・昼夜配色を読書中に切り替え、再配置後も表示中の文字を基準に位置を維持する。Core書式・parser・三冊の原稿は変更していない。APIと埋め込み時の色指定は [EMBEDDING.md](EMBEDDING.md) を参照。

macOS arm64 / Node.js 22.23.4 / Playwright 1.61.1で、画面を占有しないヘッドレス検証を実施。

| 検証 | 結果 |
| --- | --- |
| `npm run check` | lint・strict型検査・Node 96件・ビルドが成功 |
| 三冊のCLI検証 | 原稿・画像署名を検証して成功 |
| `CI=1 PORT=4187 npm run test:ui` | Chromium PC / 狭幅 / WebKit PC、72件成功 |
| `CI=1 PORT=4187 BASE_PATH=/YomPUB/ npm run test:ui` | 同じ72件成功。reader・Worker・サンプルの相対URLを確認 |
| WebKitの同一フォルダ再読込 | `--grep 'local folder load' --repeat-each=5`、5件成功 |

回帰検証は縦書きの字送り・ルビ位置、横書き/左右の縦書きでの読み位置、先頭/末尾、設定の不正値と原子的な拒否、表示中の本の保持、昼夜の青リンクのコントラスト、独立した埋め込みのCSS/ID/寿命、読込中の中断と破棄を含む。テンプレートのサイトファイルは別リポジトリで管理する。

初回Ubuntu CIではWebKitの中断・再生成中にResizeObserverの通知競合を検出。ホストが位置通知で自身の高さを変更する回帰テストでも3構成すべてで再現した。リサイズ由来の位置通知を次フレームへ集約し、destroy時に予約を解除するよう修正した。エラーの無視やテストのskipは行っていない。

読み位置を保っても、文字組みの変更で総スクロール量が変わるため進捗%は変わりうる。表示設定はインスタンス内だけ保持し、再読込を越える保存は行わない。実機iOS/Android・Firefox・支援技術・長い実本での読書評価は未実施。CIと公開HTTPSの結果は該当PRおよびActionsで確認する。

## 実施した検証

| 検証 | 結果と範囲 |
| --- | --- |
| `npm run check` | ESLint、strictなJS/JSDoc型検査、Nodeテスト、ブラウザ用ビルドが通過 |
| Nodeテスト | **95件成功**。書誌・version・未知/重複キー、Unicode、ルビ、言語範囲、CommonMark構造、内部リンク、alt、パス、CLI、ファイル実在/署名、反復解析、制限超過 |
| CommonMark基底 | 上記95件のうち1件が、公式0.31.2の**652例**を照合。空blockquoteのHTML改行差だけ正規化。YomPUBが全652入力を受理するという主張ではない |
| `npm run test:ui` | **24件成功**（8シナリオ×Chromium PC/モバイル幅、WebKit PC）。ヘッドレスで実施し、本人の画面は操作していない |
| 三冊の公開前CLI検証 | 全冊の原稿、画像実在、画像署名を確認。CLIは完全画像デコード検証ではない |
| 実表示 | `ruby/rt`の非ゼロ領域とルビが本文右側になる座標、縦書き横スクロール、目次移動、文字サイズ/配色、RTLとLTR隔離範囲の方向を検査。ChromiumとWebKitのスクリーンショットを保存・目視確認 |
| 操作の反復 | 各環境で4サイクルの開く→切替→中断→連続切替→閉じる。不要なBlob URLを解放し、閉じた後に0になることを確認 |
| 解析中断 | 約150万文字の原稿でWorkerの解析開始通知を受けて中断。前の本を維持し、次の本を開けることを確認 |
| 不正入力からの復帰 | HTML、危険なリンク、壊れたルビ、欠損画像、不正UTF-8、署名だけ正しいがデコード不能なPNGを拒否。前の本を維持して再読込できる |
| ローカル性 | 外部ネットワークをブロックした条件でフォルダを読込。観測要求はローカルアプリとBlobのみ、アップロードなし。localhostサーバーは起動したまま |
| 長文解析の単発測定 | 756,091 bytes・12,001 blocks（12,000段落）をNodeで42ms。性能保証・全段落のブラウザ描画試験ではない |
| npm audit | 実行依存の既知脆弱性0件（検証時点）。markdown-itは14.3.3固定 |
| Git（初回検証時） | 専用ブランチのローカルコミット`6b7c856`。後続のpush/PR/main取込はGitHub履歴で追跡 |

環境: macOS arm64、Node 22.22.0、Playwright 1.61.1。モバイルは390×844のChromiumエミュレーションで、実機テストではない。WebKitはPlaywright配布版であり、インストール済みSafariそのものを操作した検証ではない。

検証中、WebKitでFileの`webkitRelativePath`がWorkerへのコピーで失われる差を発見した。メイン側で相対パスを固定データとして記録し、Fileと一緒に渡すことで修正。全環境のフォルダ再読込で確認した。

## 再現する

```sh
npm ci
npm run check
npm run validate -- samples/horizontal/book.md samples/vertical/book.md samples/rtl/book.md
npx playwright install chromium webkit
npm run test:ui
```

`test:ui`はビルドを更新し、4178番の既存ローカルサーバーを再利用するか自動起動する。通常の開発ではサーバーを手動起動しなくてもよい。テストが起動したサーバーはPlaywrightが終了する。別アプリが4178番を使っている場合は、そのアプリを勝手に終了せず、設定と起動ポートを合わせる。

機械可読な概要は[evidence/validation-summary.json](../evidence/validation-summary.json)。スクリーンショットは[evidence/README.md](../evidence/README.md)。生のローカル実行ログは`evidence/check-output.txt`、`evidence/ui-output.txt`、`evidence/browser-results.json`（生成物としてGit対象外）。失敗時のPlaywright traceは`test-results/`。

## CIでの再検証

`.github/workflows/ci.yml`はPRとmainへのpushで、Node 22 / Ubuntu 24.04から`npm ci`、`npm run check`、三冊のCLI検証、Chromium/WebKitのインストール、`npm run test:ui`を実行する。CIはリポジトリ読取権限だけを持ち、デプロイ・リリース・生成物のコミットは行わない。

Pages対応では公開対象を限定するNodeテスト1件を追加し、現在は96件。ルートパスに加えて`/YomPUB/`でもブラウザ24件を実行する。mainのCI成功を受けて別のPages workflowが配信し、実際の公開URLでも同じ24件を確認する。詳細は[配信手順](PAGES.md)を参照。初回macOS検証の95件・保存画像とは区別する。

初回の公開画像で、Ubuntu Chromiumが日本語本文に選んだ`WenQuanYi Zen Hei`の一部漢字が重なることを発見した。[診断実行](https://github.com/yo4e/YomPUB/actions/runs/39395714619)では20pxの本文の「灯」「桟」等の縦送り幅が0px、同じ環境で`IPAGothic`を指定すると20pxだった。日本語本文ではNoto/IPA系を含む日本語フォントを汎用fallbackより優先するように修正した。既存の縦書きシナリオに、隣接する漢字・仮名の送り幅を撮影前後に検査する回帰条件を追加し、ルビ領域が存在するだけでは通さない。

同じフォルダの再読込では、「本のフォルダを開く」から原稿を3版に書き換えて読み、各版のタイトル・原稿・画像・保存結果を確認する。変更のない同じフォルダについても本文DOMの入れ替えを確認し、前回の完了表示だけを見て成功としない。WebKitではこのシナリオを追加で5回繰り返し、失敗時のスクリーンショットとトレースをActionsのartifactに7日間残す。

`npm run test:ui`は、固定したPlaywright 1.61.1のディレクトリ選択処理にテスト専用の補正を適用する（`scripts/prepare-browser-tests.mjs`）。元の処理は`input`監視の登録完了を待たずにネイティブ選択を開始するため、Ubuntu WebKitでイベントを取り逃がすことがある。保存トレースでは本が表示済みでも`setInputFiles`が30秒待機していた。補正は監視登録の完了を確認してから選択を実行する。タイムアウト延長・例外の握りつぶし・再試行・テスト省略は行わず、製品のparser/viewerには含めない。バージョンや対象コードが変わった場合は明示的に失敗するので、Playwright更新時に上流の修正を確認して削除または再評価する。2026-10-20時点の[公式v1.64.1実装](https://github.com/microsoft/playwright/blob/v1.64.1/packages/playwright-core/src/server/dom.ts#L770)にも同じ登録順序が残っている。

保存したスクリーンショットと`evidence/validation-summary.json`は上記macOSの初回記録であり、CIの毎回の結果へ自動で上書きコミットしない。CIが検証したコミットと実行結果はActionsで確認する。Ubuntu上のブラウザ検証が通っても、Linux全般の手動読書・フォント・支援技術の評価済みとは扱わない。

## 既知の制限

- 暫定書式。必須ヘッダ、Ruby/言語範囲、見出し規則、逐次IDを含め、将来変更できる。見出しを前に追加した場合は内部リンクIDの更新が必要。
- CommonMarkの文法は再利用している。「規格全体をCommonMark知識なしで数ページだけで実装できる」という意味の小ささではない。
- 単一book.md＋画像フォルダ。ZIP、EPUB/PDF変換、書籍ライブラリ、統合エディタはない。
- 脚注・キャプション・表・数式・任意属性・縦中横・圏点・ブロック単位の言語変更・多段ルビは保留。言語範囲の本文はプレーンテキストで入れ子不可。別言語のルビ読み指定も未対応。
- CLIは画像の実在・範囲・署名まで確認し、画素デコードはviewerが行う。署名だけ正しい壊れた画像はCLIで通る可能性があるため、最終確認にviewerも使う。
- 制限: 原稿2 MiB、画像1点10 MiB、参照画像合計40 MiB、フォルダ2,000ファイル、構文の深さ120未満。超過はLIMIT。CLIは画像のsymlinkを拒否。
- 字形・句読点の組み方・改行・ルビの詰め方はフォント/ブラウザに依存。禁則・均等割付・縦中横等の専用組版補正はない。フォントの同梱・外部配信は行わないため、日本語フォントがないLinux環境ではNoto CJKまたはIPA系の導入が必要。CIではPlaywright依存に含まれるIPAGothicを使用する。
- ページを保存するPWAキャッシュはない。公開HTTPSページまたはlocalhostサーバーからアプリを開く。原稿のバイト一致serializerでもなく、ASTは意味投影。原稿保存はデコード済み文字列で、先頭BOMは除かれる。
- メタデータ以外の診断は、常に正確な文字位置を返すものではない。ブロックのエラーには行番号があり、inlineエラーは種類と説明で示す。

## 未実施の検証と次の課題

1. **独立実装/clean-room検証**: この仕様だけから別実装を作り、適合例・三冊の意味モデルを比較する。今回の同一実装＋回帰fixtureは代替にならない。
2. **実際の長い本の読書**: 日本語小説と注を必要とする随筆で、原稿の書きやすさとCore不足を確認する。
3. **母語話者によるRTL評価**: アラビア語/ヘブライ語の文・URL周囲の句読点を、人が読む観点から校閲する。
4. **支援技術と実機**: VoiceOver等の読み上げ・キーボード読書の全体評価、実機iOS/Android、Firefox、Windows、およびLinuxでの手動読書・支援技術評価は未実施。
5. **他の文字体系**: Unicode保持の単体例はあるが、Indic/Thai/Mongolianの実表示・フォント適合・組版品質は未検証。

これらを終える前に「1.0互換」「全言語で十分」「出版品質の組版」とは扱わない。今回の区切りは、仕様と意味モデルを読める形で、三冊を実際に開き、壊れる入力と中断を再現できる段階である。
