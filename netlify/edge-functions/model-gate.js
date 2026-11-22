// Shared-password gate (HTTP Basic auth) for the 3D model at /3d-model only; the rest of the site is untouched.
// The model itself lives on a separate private Netlify site (proxied by the /3d-model rules in netlify.toml).
// Netlify skips the target site's edge functions on site-to-site proxies, so the check has to run here, before the
// proxy. Any username; the password is the MODEL_PASSWORD environment variable on this site (never in this repo).
export default async (request, context) => {
  const expected = Netlify.env.get("MODEL_PASSWORD") || "";
  const header = request.headers.get("authorization") || "";
  let ok = false;
  if (expected && header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const pw = decoded.slice(decoded.indexOf(":") + 1);
      ok = pw.length === expected.length && [...pw].every((c, i) => c === expected[i]);
    } catch { ok = false; }
  }
  if (!ok) {
    return new Response("This page is private.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Booth House 3D model", charset="UTF-8"',
                 "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const res = await context.next();
  const out = new Response(res.body, res);
  out.headers.set("X-Robots-Tag", "noindex, nofollow");
  out.headers.set("Cache-Control", "private, max-age=600");
  out.headers.set("Vary", "Authorization");
  return out;
};

export const config = { path: ["/3d-model", "/3d-model/*"] };
