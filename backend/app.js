const { Hono } = require("hono");
const { cors } = require("hono/cors");
const { secureHeaders } = require("hono/secure-headers");
const registerRouter = require("./routes/register");

const app = new Hono();

// Setup standard security and utility middlewares
app.use("*", cors());
app.use("*", secureHeaders());

// Mount the API routes
app.route("/api/v1", registerRouter);

module.exports = app;
