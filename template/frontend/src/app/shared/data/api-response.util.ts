/** Extrai um array do envelope típico da API ({ data }) ou de um array raiz. */
export function readApiDataArray<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>;
    const inner = o['data'] ?? o['Data'];
    if (Array.isArray(inner)) return inner as T[];
  }
  return [];
}
