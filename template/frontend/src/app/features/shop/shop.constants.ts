/** Filial padrão para pedidos da loja (checkout). */
export const LOJA_ONLINE_BRANCH = {
  id: '11111111-1111-1111-1111-111111111111',
  description: 'Loja online'
} as const;

/** Preço de vitrine por categoria (produto seed não tem preço na API). */
export function precoUnitarioPorCategoria(category: string): number {
  const c = (category ?? '').trim();
  if (c.toLowerCase() === 'beer') return 12.9;
  return 6.5;
}
