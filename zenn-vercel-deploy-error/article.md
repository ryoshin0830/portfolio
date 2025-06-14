---
title: "Next.js + Vercel で `npm run build` が失敗する…原因は ESLint の unused import だった話"
emoji: "🚀"
type: "tech"
topics: ["nextjs", "vercel", "eslint", "tailwindcss", "ci"]
published: false
---

## TL;DR

* Vercel での本番デプロイが `Command "npm run build" exited with 1` で止まった。
* ローカルの `next build` でも同じエラーを再現し **ESLint の unused 変数** が原因と判明。
* 未使用の `Briefcase` アイコンを削除してビルドは通るようになったが、Vercel では古いビルドキャッシュを参照して再び失敗。
* `vercel build --prod` ➡️ `vercel deploy --prebuilt --prod --yes` で **ローカルで成功したビルド成果物をそのままアップロード** し解決。

---

## 経緯

1. Next.js 15 + Tailwind CSS v4 のポートフォリオサイトを開発。
2. `npm run build && vercel deploy --prod` で本番環境にデプロイしようとしたところ、Vercel CLI から以下のエラーが返る。

```bash
Error: Command "npm run build" exited with 1
```

3. `vercel logs <deployment-url>` で原因を追おうとしたが、ステータスが **● Error** の段階ではログが取得できず。
4. ローカルで `npm run build` を実行すると ESLint による **unused-variable** エラーが出力。

```text
./src/components/TimelineSection.tsx
16:3  Error: 'Briefcase' is defined but never used  @typescript-eslint/no-unused-vars
```

5. 該当ファイルを開き、未使用だった `Briefcase` の import 行を削除。
6. 再度ローカルビルド → **成功**。
7. しかし `vercel deploy --prod --yes` を再実行すると再び同じエラーで失敗。

---

## なぜ Vercel では直らないのか？

* Vercel CLI の **"Remote Build"** は、Git にコミットされているファイルをクラウド側でもう一度 `npm ci && npm run build` しています。
* ローカルでファイルを修正しても **コミット & プッシュ しない限り** Vercel は古いコードをビルドし続ける。
* 今回はすぐに動作確認したかったため、ローカルで成功したビルド成果物をそのままアップロードする方法を選択しました。

---

## 解決手順

1. **ローカル修正**

   ```bash
   # ESLint エラーを修正
   code src/components/TimelineSection.tsx
   # Briefcase インポートを削除
   ```

2. **ローカルで本番相当ビルドを生成**

   ```bash
   vercel build --prod
   # .vercel/output に prebuilt artefacts が生成される
   ```

3. **Prebuilt artefacts を本番環境へデプロイ**

   ```bash
   vercel deploy --prebuilt --prod --yes
   ```

   これで Vercel 側では追加のビルド処理を行わず、ローカルで作成した成果物をそのままホスティングします。

4. **(推奨) Git にも反映**

   開発フローとしては、修正をリポジトリにコミット & プッシュして CI/CD で自動ビルドさせる方が安全です。今回は検証のため手動で対応しました。

---

## つまずきポイントメモ

| ポイント | 解説 |
| --- | --- |
| `--confirm` は非推奨 | Vercel CLI では `--confirm` フラグが deprecated。代わりに `--yes` を使用する。|
| Tailwind v4 の `@media (--dark)` 警告 | PostCSS が出す SyntaxError が大量に出るがビルドは通る。無視して問題なし。|
| ログ取得方法 | **Build に失敗した直後** は `vercel logs` が使えない。`vercel inspect` でステータス確認ができるが原因まではわからない。|
| Prebuilt デプロイの注意 | `vercel build` 時に `--prod` を付与しないと preview 用 artefacts となり、本番 (`--prod`) への `--prebuilt` アップロードが拒否される。|

---

## まとめ

* CI で失敗したら、まずは **ローカルで `next build` を再現** して原因を特定する。
* Next.js 15 では ESLint エラーが 1 つでもあると `next build` 全体が失敗する。
* Vercel に即デプロイしたい場合は **`vercel build` ➡️ `vercel deploy --prebuilt`** という手段がある。
* とはいえチーム開発では **Git の commit & push → 自動ビルド** の流れを守る方が安全。

---

### 参考リンク

* [Next.js Documentation ‑ Build Errors](https://nextjs.org/docs/pages/build-errors)
* [Vercel CLI ‑ Build and Deployment](https://vercel.com/docs/cli)
* [ESLint Rule: `no-unused-vars`](https://eslint.org/docs/latest/rules/no-unused-vars) 