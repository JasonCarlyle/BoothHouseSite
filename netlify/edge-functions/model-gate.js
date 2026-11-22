// Shared-password gate for the 3D model at /3d-model only; the rest of the site is untouched.
// The model itself lives on a separate private Netlify site (proxied by the /3d-model rules in netlify.toml).
// Netlify skips the target site's edge functions on site-to-site proxies, so the check has to run here, before the
// proxy. The password is the MODEL_PASSWORD environment variable on this site (never in this repo). Three ways in:
//   1. HTTP Basic auth (any username), as before;
//   2. a one-tap link /3d-model/?key=<password>: sets a cookie and redirects to the same URL without the key;
//   3. that cookie on later requests. It holds a SHA-256 hash of the password, not the password; changing
//      MODEL_PASSWORD invalidates every cookie.
const COOKIE = "booth_model";

async function token(pw) {
  const data = new TextEncoder().encode("booth-3d-model:" + pw);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function same(a, b) {   // length-checked comparison that doesn't stop at the first difference
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export default async (request, context) => {
  const expected = Netlify.env.get("MODEL_PASSWORD") || "";
  const deny = () => new Response("This page is private.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Booth House 3D model", charset="UTF-8"',
               "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" },
  });
  if (!expected) return deny();
  const want = await token(expected);
  const url = new URL(request.url);

  // 2. one-tap link: ?key=<password> -> cookie + redirect to the clean URL
  const key = url.searchParams.get("key");
  if (key !== null) {
    if (!same(key, expected)) return deny();
    url.searchParams.delete("key");
    return new Response(null, {
      status: 302,
      headers: {
        "Location": url.pathname + (url.search || ""),
        "Set-Cookie": `${COOKIE}=${want}; Path=/3d-model; Max-Age=31536000; Secure; HttpOnly; SameSite=Lax`,
        "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  // 3. cookie, 1. Basic auth
  let ok = false;
  const cookie = (request.headers.get("cookie") || "").split(/;\s*/).find((c) => c.startsWith(COOKIE + "="));
  if (cookie && same(cookie.slice(COOKIE.length + 1), want)) ok = true;
  const header = request.headers.get("authorization") || "";
  if (!ok && header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      ok = same(decoded.slice(decoded.indexOf(":") + 1), expected);
    } catch { ok = false; }
  }
  if (!ok) return deny();

  const res = await context.next();
  const out = new Response(res.body, res);
  out.headers.set("X-Robots-Tag", "noindex, nofollow");
  out.headers.set("Cache-Control", "private, max-age=600");
  out.headers.set("Vary", "Authorization, Cookie");
  return out;
};

export const config = { path: ["/3d-model", "/3d-model/*"] };
