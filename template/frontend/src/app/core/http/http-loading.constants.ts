/** Animação DotLottie (loader) — LottieFiles host. */
export const HTTP_LOADING_LOTTIE_SRC =
  'https://lottie.host/6d6bcf2d-16f9-411f-a378-daf925f8ff9b/5y4t29nM21.lottie';

/**
 * Mensagens rotativas enquanto o backend responde.
 * São genéricas (o interceptor não sabe o URL); cobrem fluxos típicos da app.
 */
export const HTTP_LOADING_MESSAGES = [
  'Aguarde… a comunicar com o servidor.',
  'Aguarde… a obter os seus dados.',
  'Aguarde… a validar a sua sessão.',
  'Aguarde… a carregar a informação solicitada.',
  'Aguarde… a atualizar esta lista.',
  'Aguarde… a guardar as alterações.',
  'Aguarde… a processar o seu pedido.',
  'Aguarde… a carregar o catálogo de produtos.',
  'Aguarde… a concluir esta operação.',
  'Aguarde… a sincronizar os dados.'
] as const;
