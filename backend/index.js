require("dotenv").config();

const { serve } = require("@hono/node-server");
const app = require("./app");
const PORT = process.env.PORT || 5000;

console.log(`Hono server running in development mode on port ${PORT}`);

serve({
  fetch: app.fetch,
  port: Number(PORT)
});
