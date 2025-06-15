const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { register, login, getAllUsers, setAvatar, logOut } = require("../../server/controllers/userController");

const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://chatflow.vercel.app']
    : ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Connect to MongoDB
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
  } catch (error) {
    console.error("DB Connection Error:", error);
  }
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Auth routes
app.post("/register", register);
app.post("/login", login);
app.get("/allusers/:id", getAllUsers);
app.post("/setavatar/:id", setAvatar);
app.get("/logout/:id", logOut);

module.exports = app;
