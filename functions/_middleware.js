// functions/_middleware.js
//
// Protege todo o site com usuário/senha (HTTP Basic Auth).
// O usuário e a senha NÃO ficam aqui no código — ficam configurados
// como variáveis de ambiente no painel do Cloudflare Pages
// (Settings → Environment variables), por segurança.

export async function onRequest(context) {
  const { request, next, env } = context;

  const usuarioEsperado = env.SITE_USER;
  const senhaEsperada = env.SITE_PASS;

  const authHeader = request.headers.get("Authorization");

  if (authHeader && authHeader.startsWith("Basic ")) {
    const base64Credenciais = authHeader.split(" ")[1];
    const credenciais = atob(base64Credenciais); // "usuario:senha"
    const [usuario, senha] = credenciais.split(":");

    if (usuario === usuarioEsperado && senha === senhaEsperada) {
      return next(); // libera acesso ao site
    }
  }

  // bloqueia e pede login (tela nativa do navegador)
  return new Response("Acesso restrito.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="MMA Vault"',
    },
  });
}
