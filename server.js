const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

// Import API routes
const apiRoutes = require("./routes/api");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from project root
app.use(express.static(path.join(__dirname)));

app.use("/api", apiRoutes);

// Use your Atlas URL as the default (or override with MONGODB_URI env variable)
const mongoURI = process.env.MONGODB_URI || "mongodb+srv://godwinhephzibah25:kzdz0iKbfpai1ipo@cluster0.da67b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected successfully."))
  .catch((err) => console.error("MongoDB connection error:", err));

app.listen(PORT, () => {
  console.log(`API Generator backend running on port ${PORT}`);
});
