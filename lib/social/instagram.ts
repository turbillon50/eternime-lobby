/**
 * Cliente minimo de "Instagram API with Instagram Login" (el reemplazo
 * oficial de la vieja Instagram Basic Display API, que Meta dio de baja).
 * Usa el dominio instagram.com para el login (NO facebook.com) — son flujos
 * de OAuth distintos aunque compartan el mismo App ID/Secret de la app de
 * Meta. Requiere que la cuenta de Instagram sea tipo Business o Creator
 * (cambio gratis e instantaneo desde la app de Instagram, Configuracion →
 * Tipo de cuenta) — las cuentas personales puras ya no tienen API desde el
 * cierre de Basic Display.
 */
const IG_OAUTH_BASE = "https://www.instagram.com/oauth";
const IG_TOKEN_EXCHANGE = "https://api.instagram.com/oauth/access_token";
const IG_GRAPH_BASE = "https://graph.instagram.com";

function appId(): string {
  const v = process.env.FACEBOOK_APP_ID; // mismo App ID que Facebook
  if (!v) throw new Error("Falta FACEBOOK_APP_ID");
  return v;
}
function appSecret(): string {
  const v = process.env.FACEBOOK_APP_SECRET;
  if (!v) throw new Error("Falta FACEBOOK_APP_SECRET");
  return v;
}

export function isInstagramConfigured(): boolean {
  return Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);
}

export function buildInstagramAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: appId(),
    redirect_uri: redirectUri,
    state,
    scope: "instagram_business_basic",
    response_type: "code",
  });
  return `${IG_OAUTH_BASE}/authorize?${params.toString()}`;
}

export async function exchangeInstagramCode(code: string, redirectUri: string): Promise<{ accessToken: string; igUserId: string; expiresIn: number | null }> {
  const form = new URLSearchParams({
    client_id: appId(),
    client_secret: appSecret(),
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });
  const shortRes = await fetch(IG_TOKEN_EXCHANGE, { method: "POST", body: form });
  if (!shortRes.ok) throw new Error(`Instagram rechazo el code: ${await shortRes.text()}`);
  const shortData = (await shortRes.json()) as { access_token: string; user_id: string };

  const longParams = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: appSecret(),
    access_token: shortData.access_token,
  });
  const longRes = await fetch(`${IG_GRAPH_BASE}/access_token?${longParams.toString()}`);
  if (!longRes.ok) {
    return { accessToken: shortData.access_token, igUserId: shortData.user_id, expiresIn: null };
  }
  const longData = (await longRes.json()) as { access_token: string; expires_in?: number };
  return { accessToken: longData.access_token, igUserId: shortData.user_id, expiresIn: longData.expires_in ?? null };
}

export async function getInstagramProfile(accessToken: string): Promise<{ id: string; username: string }> {
  const res = await fetch(`${IG_GRAPH_BASE}/me?fields=id,username&access_token=${encodeURIComponent(accessToken)}`);
  if (!res.ok) throw new Error(`No se pudo leer el perfil de Instagram: ${await res.text()}`);
  return res.json();
}

export type InstagramMedia = {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp?: string;
  permalink?: string;
};

export async function fetchInstagramMedia(accessToken: string, limit = 60): Promise<InstagramMedia[]> {
  const out: InstagramMedia[] = [];
  let url: string | null =
    `${IG_GRAPH_BASE}/me/media?fields=id,media_type,media_url,thumbnail_url,caption,timestamp,permalink&limit=25&access_token=${encodeURIComponent(accessToken)}`;
  while (url && out.length < limit) {
    const res: Response = await fetch(url);
    if (!res.ok) break;
    const data = (await res.json()) as { data: InstagramMedia[]; paging?: { next?: string } };
    out.push(...data.data);
    url = data.paging?.next ?? null;
  }
  return out.slice(0, limit);
}
