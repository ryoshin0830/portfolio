---
title: "Vercel デプロイエラー「Command "npm run build" exited with 1」の解決方法（Next.js 15対応）"
emoji: "🚀"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["vercel", "nextjs", "deployment", "エラー解決"]
published: false
---

# はじめに

Next.js 15のプロジェクトをVercelにデプロイする際に、以下のようなエラーに遭遇しました。

```
Error: Command "npm run build" exited with 1
```

ローカル環境では `npm run build` が正常に動作するにもかかわらず、Vercelでのデプロイが失敗するという状況でした。本記事では、このエラーの原因と解決方法について解説します。

# エラーの詳細

## 環境情報
- Next.js: 15.3.3
- Node.js: 18.17.0以上
- Tailwind CSS: v4
- Vercel CLI: 41.7.8

## エラー発生時の状況
```bash
$ vercel --prod
Vercel CLI 41.7.8
Retrieving project…
Deploying shins/portfolio
Inspect: https://vercel.com/shins/portfolio/...
Production: https://portfolio-...vercel.app
Queued
Building
Error: Command "npm run build" exited with 1
```

# 原因の分析

このエラーメッセージは実際のエラー内容を示していない汎用的なメッセージです。真の原因を特定するには、以下の点を確認する必要があります。

## 1. package-lock.jsonの不整合
Vercelはソースコードと`package-lock.json`をアップロードし、Vercel側で`npm ci`を実行して依存関係をインストールします。`package-lock.json`に不整合があると、Vercel側でのパッケージインストールに失敗します。

## 2. 依存関係の問題
- 本番環境に必要なパッケージが`devDependencies`に記載されている
- パッケージのバージョン競合
- Vercel環境でのパッケージインストールエラー

## 3. 環境変数の未設定
Vercelダッシュボードで必要な環境変数が設定されていない場合もビルドエラーの原因となります。

## 4. Node.jsバージョンの不一致
ローカル環境とVercel環境のNode.jsバージョンが異なる場合、予期しないエラーが発生することがあります。

# 今回の問題と直接的な解決方法

## 実際に発生した問題
私のケースでは、以下の状況でした：
- ローカルでは `npm run build` が成功
- `vercel --prod` でデプロイすると毎回失敗
- エラーログには具体的な原因が表示されない

## 直接的な解決方法

**package-lock.jsonの削除と再生成**が解決の鍵でした。

```bash
# 1. キャッシュとロックファイルを削除
rm -rf node_modules .vercel package-lock.json

# 2. 依存関係を再インストール（新しいpackage-lock.jsonが生成される）
npm install

# 3. Vercelに再デプロイ
vercel --prod --yes
```

この手順により、デプロイが成功しました。

## なぜこれで解決したのか？

Vercelのデプロイプロセスは以下のように動作します：

1. **ソースコードのアップロード**: Vercelは`package.json`と`package-lock.json`を含むソースコードをアップロード
2. **依存関係のインストール**: Vercel側で`npm ci`を実行（`package-lock.json`を厳密に参照）
3. **ビルドの実行**: `npm run build`を実行

`node_modules`自体はアップロードされませんが、`package-lock.json`に記録された依存関係の情報が不整合だったため、Vercel側での`npm ci`が失敗していました。ローカルで`node_modules`と`package-lock.json`を削除して再生成することで、整合性のとれた`package-lock.json`が作成され、Vercel側でも正常にインストールできるようになりました。

# その他の解決方法

## 解決策1: クリーンインストール（最も効果的）

上記の方法が最も効果的です。依存関係の不整合を完全にリセットできます。

## 解決策2: Node.jsバージョンの指定

`package.json`にNode.jsのバージョンを明示的に指定します。

```json
{
  "engines": {
    "node": ">=18.17.0"
  }
}
```

## 解決策3: ビルドエラーの一時的な無視（非推奨）

開発中の一時的な対処として、`next.config.ts`でエラーを無視する設定を追加できます。

```typescript
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
```

**注意**: この方法は本番環境では推奨されません。あくまで一時的な対処法として使用してください。

## 解決策4: 環境変数の確認

Vercel CLIで環境変数を確認します。

```bash
# 環境変数の一覧を確認
vercel env ls production

# 環境変数を追加
vercel env add
```

## 解決策5: ビルドコマンドのカスタマイズ

Vercelダッシュボードで、Build & Development Settingsから以下を設定できます。

- Install Command: `npm install --force`
- Build Command: `npm run build`

# デバッグのヒント

## 詳細なエラーログの確認

```bash
# Vercelのログを確認
vercel logs <deployment-url>

# または、Vercelダッシュボードでログを確認
# https://vercel.com/[username]/[project]/[deployment-id]
```

## ローカルでの本番ビルドテスト

```bash
# 本番環境と同じ条件でビルド
NODE_ENV=production npm run build
```

# まとめ

Vercelのデプロイエラー「Command "npm run build" exited with 1」は、多くの場合、依存関係の不整合が原因です。以下の手順で解決できることが多いです：

1. **クリーンインストール**を最初に試す
2. **Node.jsバージョン**を明示的に指定
3. **環境変数**が正しく設定されているか確認
4. 必要に応じて**ビルドログ**を詳細に確認

これらの方法を順に試すことで、ほとんどのデプロイエラーを解決できるはずです。

# 参考リンク

- [Vercel Troubleshooting Build Errors](https://vercel.com/docs/deployments/troubleshoot-a-build)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Vercel Community Forum](https://community.vercel.com/)