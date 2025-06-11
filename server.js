const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// MongoDB Connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/karmasync';
console.log('Attempting to connect to MongoDB...');
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: true,
  retryWrites: true,
  w: 'majority'
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Connection event handlers
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Import routes
console.log('Loading routes...');
const authRouter = require("./routes/auth");
const tasksRouter = require("./routes/tasks");
const projectsRouter = require("./routes/projects");

// Use routes
console.log('Registering routes...');
app.use("/api/auth", authRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/projects", projectsRouter);

// Log registered routes
app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log('Registered route:', Object.keys(r.route.methods).join(',').toUpperCase(), r.route.path);
  }
});

// Production setup
if (process.env.NODE_ENV === "production") {
  app.use(express.static("../frontend/build"));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
});
