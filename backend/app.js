const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const registerRouter = require("./routes/register");

const app = express();

const allowedOrigins = ["https://mufifa.mulearn.org"];
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server requests)
    if (!origin) {
      return callback(null, true);
    }

    const isLocalhost = /^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);
    if (allowedOrigins.includes(origin) || isLocalhost) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  }
};

// Setup standard security and utility middlewares
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());

// Mount the API routes
app.use("/api/v1", registerRouter);

module.exports = app;
