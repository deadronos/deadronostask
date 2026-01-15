import { httpRouter } from 'convex/server';

import { httpAction } from './_generated/server';

const http = httpRouter();

http.route({
  path: '/.well-known/openid-configuration',
  method: 'GET',
  handler: httpAction(async () => {
    const siteUrl = process.env.CONVEX_SITE_URL;
    if (!siteUrl) {
      return new Response('Missing CONVEX_SITE_URL', { status: 500 });
    }
    const body = {
      issuer: siteUrl,
      jwks_uri: `${siteUrl}/.well-known/jwks.json`,
      authorization_endpoint: 'https://example.com/authorize',
    };
    return new Response(JSON.stringify(body), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }),
});

http.route({
  path: '/.well-known/jwks.json',
  method: 'GET',
  handler: httpAction(async () => {
    const jwks = process.env.JWKS;
    if (!jwks) {
      return new Response('Missing JWKS', { status: 500 });
    }
    return new Response(jwks, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }),
});

export default http;
