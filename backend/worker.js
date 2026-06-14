const app = require("./app");

module.exports = {
  async fetch(request, env, ctx) {
    // Populate process.env with the environment variables provided by Cloudflare
    for (const key in env) {
      if (typeof env[key] === "string") {
        process.env[key] = env[key];
      }
    }

    return app.fetch(request, env, ctx);
  }
};
