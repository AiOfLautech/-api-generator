const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

// Import API routes
const apiRoutes = require("./routes/api");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (all front-end pages, templates, assets)
app.use(express.static(path.join(__dirname)));

// API routes
app.use("/api", apiRoutes);

// Connect to MongoDB (update as necessary)
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/subscribersDB";
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.listen(PORT, () => {
  console.log(`API Generator backend running on port ${PORT}`);
});