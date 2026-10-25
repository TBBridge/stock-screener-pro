// 简单的内存 TTL 缓存（用于 Route Handlers，避免频繁请求上游）
const store = new Map<string, { data: unknown; at: number }>();

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) {
    return hit.data as T;
  }
  const data = await fn();
  store.set(key, { data, at: Date.now() });
  // 防止无限增长
  if (store.size > 500) {
    const oldest = [...store.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) store.delete(oldest[0]);
  }
  return data;
}
