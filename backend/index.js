require("dotenv").config();

const app = require("./app");
const PORT = process.env.PORT || 5000;

// Start listening for requests
app.listen(PORT, () => {
  console.log(`Express server running in development mode on port ${PORT}`);
});
