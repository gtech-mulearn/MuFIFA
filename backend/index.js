require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const registerRouter = require("./routes/register");
const app = express();
const PORT = process.env.PORT || 5000;

// Setup standard security and utility middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

// Mount the API routes
app.use("/api/v1", registerRouter);

// Start listening for requests
app.listen(PORT, () => {
  console.log(`Express server running in development mode on port ${PORT}`);
});
