/**
 * ベストエフォートのインメモリ・レート制限。サーバー専用（Route Handler から使う）。
 *
 * 注意: Vercel のサーバーレス関数はインスタンスが使い回されたり破棄されたりする
 * ため、このカウンタは「同一インスタンスに連続して当たった連打」しか防げない。
 * 公開予約エンドポイントを本格運用するなら @upstash/ratelimit + @upstash/redis
 * のような外部ストアに置き換えること。デモ用途の最低限の抑止としてはこれで足りる。
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * `key`（通常は IP）に対し、`windowMs` の窓内で `limit` 回まで許可する。
 * 許可された場合 true、超過した場合 false を返す。
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}

/** リクエストから接続元 IP を推定する（Vercel/プロキシ前提で x-forwarded-for を優先）。 */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
