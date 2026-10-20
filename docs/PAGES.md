# GitHub Pages 試用版

URL: **https://yo4e.github.io/YomPUB/**

三冊のサンプルを読み、原稿・意味モデルを確認するための実験的なreaderです。正式な仕様リリースではありません。独立実装、RTL母語話者、支援技術、実機の評価範囲は[検証文書](VALIDATION.md)を参照してください。

## 配信されるもの

`npm run build`の`dist/`だけを配信します。アプリのHTML/CSS/JavaScriptとsource map、ビルドコミットを示す`build-info.json`、ライセンス、既存の`horizontal`・`vertical`・`rtl`三冊の`book.md`と参照画像が対象です。

`scripts/public-samples.mjs`が対象を列挙し、サンプル横の私的メモ、未参照画像、別の原稿フォルダをコピーしません。アップロードはクリーンなGitHub Actions checkoutからビルドします。利用者が選択したローカル原稿・画像はブラウザ内だけで扱い、公開用ビルドやネットワーク送信には入りません。

すべてのアプリ・Worker・サンプルURLはアプリ位置を基準とする相対URLです。専用ドメインやルートパスへの依存はありません。Pagesでは独自のHTTPヘッダを設定できないため、HTMLにもCSPを置いて同一配信元と画像Blobに読み込み先を限定しています。

## 公開の流れ

1. `Prototype checks`がmainのpushに対して成功する。
2. `Publish trial reader`がその成功コミットをcheckoutする。PRの実行や古いmainの実行からは公開しない。
3. `dist/`をPages artifactとしてアップロードし、`github-pages`環境に配信する。
4. 公開URLの`build-info.json`が対象コミットを示すことを確認し、実際の公開ページでブラウザ24件を実行する。

アカウントの認証情報や新しいsecretは追加しません。公開ジョブだけがGitHub標準の短命なPages/OIDC権限を使い、ビルドと検証は読取権限で動きます。ブランチ保護や既存の公開設定を緩める処理はありません。再公開はmainの`Prototype checks`を再実行してください。

成功・失敗の記録は[Pages workflow](https://github.com/yo4e/YomPUB/actions/workflows/pages.yml)、公開後のスクリーンショットとブラウザ結果はその実行の`published-reader-*` artifactに14日間保存されます。配信後の検証が失敗した場合は自動でロールバックせず、そのURLと失敗箇所を確認して修正します。

## パスと公開URLの検証

ルートパスの検証に加え、CIではプロジェクト配信を模したパスでも全24件を実行します。

```sh
# ローカルの /YomPUB/ で動作確認（macOS/Linux）
CI=1 BASE_PATH=/YomPUB/ PORT=4186 npm run test:ui

# 公開ページをヘッドレスブラウザで確認（ローカルサーバーは起動しない）
YOMPUB_BASE_URL=https://yo4e.github.io/YomPUB/ npm run test:ui
```

`YOMPUB_EXPECT_COMMIT=<完全なSHA>`を指定すると、公開コミットの一致も確認します。配信反映には最大60秒待ちますが、個々の操作テストを再試行したり、失敗を無視したりはしません。公開後検証に使うローカルファイルは既存サンプルとテストが生成した原稿だけです。
