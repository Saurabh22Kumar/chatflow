const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("../server/routes/auth");
const messageRoutes = require("../server/routes/messages");

const app = express();

// Configure CORS for Vercel
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://chatflow.vercel.app']
    : ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "ChatFlow API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Connect to MongoDB
mongoose.set('strictQuery', true);

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log("DB Connection Successful");
  } catch (error) {
    console.error("DB Connection Error:", error);
  }
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Default route
app.get("/api", (req, res) => {
  res.json({ 
    message: "ChatFlow API", 
    version: "2.0.0",
    docs: "/api/health"
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("API Error:", error);
  res.status(500).json({ 
    error: "Internal Server Error",
    message: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong"
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

module.exports = app;
