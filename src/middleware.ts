import { defineMiddleware } from 'astro:middleware';
export const onRequest = defineMiddleware(async (context,next) => {
  const response=await next();
  if (!context.isPrerendered) {
    response.headers.set('Cache-Control','no-store');
    response.headers.set('X-Content-Type-Options','nosniff');
    response.headers.set('X-Frame-Options','SAMEORIGIN');
    response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    if(context.url.pathname.startsWith('/admin')) {
      // Decap's AJV configuration validator compiles functions at runtime.
      // This exception is limited to the editor; public pages keep their original policy.
      response.headers.set('X-Robots-Tag','noindex,nofollow');
      response.headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://avatars.githubusercontent.com https://raw.githubusercontent.com; connect-src 'self' https://api.github.com https://api.netlify.com https://raw.githubusercontent.com; font-src 'self' data:; worker-src 'self' blob:; frame-src 'self' https://api.netlify.com; form-action 'self'; base-uri 'self'");
    } else response.headers.set('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; frame-src https://trivianearme.net; form-action 'self'");
  }
  return response;
});
