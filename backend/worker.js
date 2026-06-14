module.exports = {
  async fetch(request, env, ctx) {
    // Populate process.env with the environment variables provided by Cloudflare
    for (const key in env) {
      if (typeof env[key] === "string") {
        process.env[key] = env[key];
      }
    }

    // Defer requiring app.js until request invocation. This bypasses top-level environment
    // check crashes (e.g. Supabase environment detection) during Cloudflare's upload-time validation.
    const app = require("./app");
    return app.fetch(request, env, ctx);
  }
};
