const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const registerRouter = require("./routes/register");

const app = express();

// Setup standard security and utility middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

// Mount the API routes
app.use("/api/v1", registerRouter);

module.exports = app;
