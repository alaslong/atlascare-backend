require('dotenv').config();

const { createServerClient, parseCookieHeader, serializeCookieHeader } = require('@supabase/ssr');

exports.createClient = (context = {}) => {
  const { req, res } = context; // Destructure req and res, with fallback to empty object

  return createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        if (req && req.headers && req.headers.cookie) {
          return parseCookieHeader(req.headers.cookie);
        }
        return []; // Always return an array instead of an empty object
      },
      setAll(cookiesToSet) {
        if (res && res.appendHeader) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.appendHeader('Set-Cookie', serializeCookieHeader(name, value, options));
          });
        }
      },
    },
  });
};
