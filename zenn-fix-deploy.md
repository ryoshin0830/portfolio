---
title: "Vercelデプロイ時にCSSが崩れる問題を解決！Tailwind CSS v4の依存関係の罠"
emoji: "🎨"
type: "tech"
topics: ["nextjs", "vercel", "tailwindcss", "css", "deployment"]
published: false
---

## 🚨 問題：ローカルでは動くのに本番環境でCSSが完全に崩れる

Next.js 15 + Tailwind CSS v4のプロジェクトで、以下のような症状に悩まされました：

- ✅ `npm run dev` → **正常に表示**
- ✅ `npm run build` → **ビルド成功**
- ❌ Vercelデプロイ → **CSSが完全に崩れる**

## 📝 環境

```json
{
  "dependencies": {
    "next": "15.3.3",
    "react": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4"
  }
}
```

## 🔍 原因：Tailwind CSSがdevDependenciesにある

Vercelのビルド環境では、`NODE_ENV=production`でビルドが実行されます。この時、**devDependenciesはインストールされません**。

```bash
# Vercelでの実際のビルドコマンド
npm ci --production  # devDependenciesはスキップされる！
npm run build
```

Tailwind CSS v4では、ビルド時にPostCSSプラグインとして動作するため、本番ビルドでも必要です。しかし、devDependenciesにあるため、Vercelのビルド環境では利用できず、CSSの処理がスキップされてしまいます。

## 💡 解決策：dependenciesに移動する

### 1. package.jsonを修正

```diff
{
  "dependencies": {
    "next": "15.3.3",
    "react": "^19.0.0",
+   "@tailwindcss/postcss": "^4",
+   "tailwindcss": "^4"
  },
  "devDependencies": {
-   "@tailwindcss/postcss": "^4",
-   "tailwindcss": "^4",
    "@types/node": "^20",
    "typescript": "^5"
  }
}
```

### 2. 依存関係を再インストール

```bash
npm install
```

### 3. 変更をコミット＆プッシュ

```bash
git add package.json package-lock.json
git commit -m "Move Tailwind CSS to production dependencies"
git push
```

### 4. Vercelで再デプロイ

```bash
vercel deploy --prod
```

初回は念のため`--force`フラグを使用してキャッシュをクリア：

```bash
vercel deploy --prod --force
```

## 🎯 なぜこれで解決するのか？

### devDependencies vs dependencies

| 種別 | ローカル開発 | 本番ビルド | 用途 |
|------|------------|-----------|-----|
| dependencies | ✅ インストール | ✅ インストール | 実行時に必要なパッケージ |
| devDependencies | ✅ インストール | ❌ スキップ | 開発時のみ必要なパッケージ |

### Tailwind CSS v4の仕組み

Tailwind CSS v4は、PostCSSプラグインとして**ビルド時**にCSSを生成します：

1. `@import "tailwindcss"` を検出
2. 使用されているクラスをスキャン
3. 必要なCSSのみを生成
4. 最適化されたCSSファイルを出力

この処理は**ビルド時**に行われるため、本番ビルドでもTailwind CSSが必要です。

## ⚠️ よくある間違い

### 1. lightningcssを手動で追加する

```json
// ❌ これはNG！
"optionalDependencies": {
  "lightningcss-linux-x64-gnu": "^1.30.1",
  "lightningcss-linux-arm64-gnu": "^1.30.1"
}
```

Tailwind CSS v4は内部でlightningcssを使用していますが、手動で追加すると**バージョンの競合**が発生し、CSSの処理が正しく行われません。

### 2. Tailwind CSS v3の設定ファイルを残す

```javascript
// ❌ v4では不要！
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  // ...
}
```

Tailwind CSS v4では設定ファイルが不要です。削除しましょう。

## ✅ 正しい設定

### postcss.config.mjs

```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### globals.css

```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');

/* カスタムCSS変数やスタイル */
:root {
  --background: #fafafa;
  --foreground: #0a0a0a;
}
```

## 🚀 デバッグのヒント

### 1. ローカルで本番ビルドをテスト

```bash
npm run build && npm run start
# http://localhost:3000 でCSSが正しく表示されるか確認
```

### 2. ビルド出力のCSSを確認

```bash
# ビルド後のCSSファイルを確認
find .next/static -name "*.css" | head -5

# Tailwindクラスが含まれているか確認
grep -E "(\.flex\{|\.text-|\.bg-)" .next/static/css/*.css | head -10
```

### 3. Vercelのビルドログを確認

```bash
vercel logs <deployment-url>
```

## 📚 まとめ

- **Tailwind CSS v4は本番ビルドでも必要** → `dependencies`に配置
- **devDependenciesの罠**に注意（本番ビルドではインストールされない）
- **lightningcssは手動で追加しない**（Tailwind CSS v4が内部で管理）
- **設定ファイルは不要**（v3からの移行時は削除）

この問題は、Tailwind CSS v4の仕組みを理解していれば簡単に解決できます。ビルド時に必要なパッケージは必ず`dependencies`に配置しましょう！

## 🔗 参考リンク

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs/v4-beta)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Build Output API](https://vercel.com/docs/build-output-api/v3)

---

この記事が同じ問題で悩んでいる方の助けになれば幸いです！