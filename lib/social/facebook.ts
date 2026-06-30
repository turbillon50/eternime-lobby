/**
 * Cliente minimo de Facebook Graph API — OAuth + lectura de fotos/posts.
 *
 * Permisos usados: user_photos, user_posts, public_profile. Son de "Standard
 * Access" en Meta: funcionan de inmediato para el dueno/testers de la app
 * (Luis) sin revision. Para que CUALQUIER usuario futuro de Eternime los use
 * en produccion, Meta exige App Review — no aplica mientras el producto sea
 * de uso propio/beta cerrada.
 */
const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

function appId(): string {
  const v = process.env.FACEBOOK_APP_ID;
  if (!v) throw new Error("Falta FACEBOOK_APP_ID");
  return v;
}
function appSecret(): string {
  const v = process.env.FACEBOOK_APP_SECRET;
  if (!v) throw new Error("Falta FACEBOOK_APP_SECRET");
  return v;
}

export function isFacebookConfigured(): boolean {
  return Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);
}

export function buildFacebookAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: appId(),
    redirect_uri: redirectUri,
    state,
    scope: "user_photos,user_posts,public_profile",
    response_type: "code",
  });
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

/** Intercambia el code por un token corto, y ese por uno largo (~60 dias). */
export async function exchangeFacebookCode(code: string, redirectUri: string): Promise<{ accessToken: string; expiresIn: number | null }> {
  const shortParams = new URLSearchParams({
    client_id: appId(),
    redirect_uri: redirectUri,
    client_secret: appSecret(),
    code,
  });
  const shortRes = await fetch(`${GRAPH_BASE}/oauth/access_token?${shortParams.toString()}`);
  if (!shortRes.ok) throw new Error(`Facebook rechazo el code: ${await shortRes.text()}`);
  const shortData = (await shortRes.json()) as { access_token: string };

  const longParams = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId(),
    client_secret: appSecret(),
    fb_exchange_token: shortData.access_token,
  });
  const longRes = await fetch(`${GRAPH_BASE}/oauth/access_token?${longParams.toString()}`);
  if (!longRes.ok) {
    // Si el intercambio a token largo falla, igual sirve el corto (dura ~2h).
    return { accessToken: shortData.access_token, expiresIn: null };
  }
  const longData = (await longRes.json()) as { access_token: string; expires_in?: number };
  return { accessToken: longData.access_token, expiresIn: longData.expires_in ?? null };
}

export async function getFacebookProfile(accessToken: string): Promise<{ id: string; name: string }> {
  const res = await fetch(`${GRAPH_BASE}/me?fields=id,name&access_token=${encodeURIComponent(accessToken)}`);
  if (!res.ok) throw new Error(`No se pudo leer el perfil de Facebook: ${await res.text()}`);
  return res.json();
}

export type FacebookPhoto = {
  id: string;
  name?: string;
  created_time?: string;
  images?: { source: string; width: number; height: number }[];
};

export type FacebookPost = {
  id: string;
  message?: string;
  created_time?: string;
  full_picture?: string;
};

/** Trae hasta `limit` fotos subidas por el usuario, con paginacion de Graph API. */
export async function fetchFacebookPhotos(accessToken: string, limit = 60): Promise<FacebookPhoto[]> {
  const out: FacebookPhoto[] = [];
  let url: string | null =
    `${GRAPH_BASE}/me/photos?type=uploaded&fields=id,name,created_time,images&limit=25&access_token=${encodeURIComponent(accessToken)}`;
  while (url && out.length < limit) {
    const res: Response = await fetch(url);
    if (!res.ok) break;
    const data = (await res.json()) as { data: FacebookPhoto[]; paging?: { next?: string } };
    out.push(...data.data);
    url = data.paging?.next ?? null;
  }
  return out.slice(0, limit);
}

/** Trae hasta `limit` posts con texto (memorias en sus propias palabras), con paginacion. */
export async function fetchFacebookPosts(accessToken: string, limit = 60): Promise<FacebookPost[]> {
  const out: FacebookPost[] = [];
  let url: string | null =
    `${GRAPH_BASE}/me/posts?fields=id,message,created_time,full_picture&limit=25&access_token=${encodeURIComponent(accessToken)}`;
  while (url && out.length < limit) {
    const res: Response = await fetch(url);
    if (!res.ok) break;
    const data = (await res.json()) as { data: FacebookPost[]; paging?: { next?: string } };
    out.push(...data.data);
    url = data.paging?.next ?? null;
  }
  return out.slice(0, limit);
}
