const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: true,
  retryWrites: true,
  w: 'majority'
});

const connection = mongoose.connection;
connection.once("open", () => {
  console.log("MongoDB database connection established successfully");
});

connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

// Import routes
const tasksRouter = require("./routes/tasks");
const projectsRouter = require("./routes/projects");
const authRouter = require("./routes/auth");

// Use routes
app.use("/api/auth", authRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/projects", projectsRouter);

if (process.env.NODE_ENV === "production") {
  app.use(express.static("../frontend/build"));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
  });
}

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
