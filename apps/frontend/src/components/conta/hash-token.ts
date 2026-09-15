// O backend redireciona com o token no fragmento (#token=...), que não vai para o servidor.
// Lê o token e limpa o endereço, para ele não ficar no histórico nem ser compartilhado sem querer.
export function lerTokenDoHash(): string | null {
  const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
  if (token) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  return token;
}

// Lê o payload de um JWT só para exibição (a validação acontece no backend).
export function lerPayloadJwt<T>(token: string): T | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}
