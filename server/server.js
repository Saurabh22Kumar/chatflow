const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const fileRoutes = require("./routes/files");
const friendRoutes = require("./routes/friends");
const callHistoryRoutes = require("./routes/callHistory");
const app = express();
const socket = require("socket.io");
require("dotenv").config();

// CORS configuration - more permissive for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, process.env.REACT_APP_API_URL]
    : [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:3002",
        "http://localhost:3003"
      ],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../public/build');
  app.use(express.static(buildPath));
  console.log(`Serving static files from: ${buildPath}`);
}

// Health check endpoint for CI/CD
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "ChatFlow server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

mongoose.set('strictQuery', true);

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connetion Successfull");
  })
  .catch((err) => {
    console.log(err.message);
  });

app.get("/ping", (_req, res) => {
  return res.json({ msg: "Ping Successful" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/calls", callHistoryRoutes);

// API endpoint to get online users
app.get("/api/users/online", (req, res) => {
  const onlineUserIds = Array.from(global.onlineUsers.keys());
  console.log("API request for online users:", onlineUserIds);
  return res.json({ onlineUsers: onlineUserIds });
});

// Use Railway/Heroku/Cloud port if provided, fallback to 5001
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () =>
  console.log(`Server started on ${PORT}`)
);

const io = socket(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001", 
      "http://localhost:3002",
      "http://localhost:3003"
    ],
    credentials: true,
  },
});

global.onlineUsers = new Map();
global.io = io; // Make io available globally
io.on("connection", (socket) => {
  global.chatSocket = socket;
  
  socket.on("add-user", (userId) => {
    console.log(`Adding user ${userId} to online users. Current online users:`, Array.from(global.onlineUsers.keys()));
    global.onlineUsers.set(userId, socket.id);
    // Broadcast to all users that this user is now online
    socket.broadcast.emit("user-online", userId);
    console.log(`User ${userId} is now online. Broadcasting to other users.`);
    console.log(`Total online users after add:`, Array.from(global.onlineUsers.keys()));
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = global.onlineUsers.get(data.to);
    if (sendUserSocket) {
      // Send message to recipient
      socket.to(sendUserSocket).emit("msg-recieve", {
        msg: data.msg,
        messageId: data.messageId,
        messageType: data.messageType || 'text',
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        from: data.from
      });
      
      // Immediately send delivery confirmation back to sender
      socket.emit("message-delivered", { messageId: data.messageId });
    }
  });

  // Handle message delivered status
  socket.on("message-delivered", (data) => {
    const senderSocket = global.onlineUsers.get(data.to);
    if (senderSocket) {
      socket.to(senderSocket).emit("message-delivered", { messageId: data.messageId });
    }
  });

  // Handle messages read status
  socket.on("messages-read", (data) => {
    const senderSocket = global.onlineUsers.get(data.from);
    if (senderSocket) {
      socket.to(senderSocket).emit("message-read", { from: data.from, to: data.to });
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    // Find and remove user from online users map
    let disconnectedUserId = null;
    for (let [userId, socketId] of global.onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        global.onlineUsers.delete(userId);
        break;
      }
    }
    
    // Broadcast to all users that this user is now offline
    if (disconnectedUserId) {
      socket.broadcast.emit("user-offline", disconnectedUserId);
      console.log(`User ${disconnectedUserId} is now offline`);
    }
  });

  // Handle manual logout
  socket.on("user-logout", (userId) => {
    global.onlineUsers.delete(userId);
    socket.broadcast.emit("user-offline", userId);
    console.log(`User ${userId} logged out`);
  });

  // Clean Call System - Rewritten from scratch
  
  // 1. Initiate Call (only caller -> receiver, no circular calls)
  socket.on("initiateCall", (data) => {
    console.log("CALL INITIATE:", data.from, "->", data.to);
    const receiverSocket = global.onlineUsers.get(data.to);
    
    if (receiverSocket) {
      const callId = `${data.from}-${data.to}-${Date.now()}`; // Unique call ID
      
      // Send call notification ONLY to receiver
      io.to(receiverSocket).emit("incomingCall", {
        callId: callId,
        from: data.from,
        fromName: data.fromName,
        callType: data.callType,
        timestamp: Date.now()
      });
      
      // Send callId back to caller so they use the same ID
      socket.emit("callInitiated", {
        callId: callId,
        to: data.to
      });
      
      console.log("CALL NOTIFICATION sent to receiver:", data.to);
      console.log("CALL ID sent back to caller:", callId);
    } else {
      // Receiver is offline - notify caller
      socket.emit("callFailed", { reason: "User is offline" });
      console.log("CALL FAILED: Receiver offline");
    }
  });

  // 2. Accept Call (receiver accepts -> start WebRTC)
  socket.on("acceptCall", (data) => {
    console.log("CALL ACCEPTED:", data.callId);
    const callerSocket = global.onlineUsers.get(data.to);
    
    if (callerSocket) {
      // Tell caller that call was accepted - now start WebRTC
      io.to(callerSocket).emit("callAccepted", {
        callId: data.callId,
        acceptedBy: data.from
      });
      
      console.log("CALL ACCEPTANCE sent to caller:", data.to);
    }
  });

  // 3. Reject Call (receiver rejects)
  socket.on("rejectCall", (data) => {
    console.log("CALL REJECTED:", data.callId);
    const callerSocket = global.onlineUsers.get(data.to);
    
    if (callerSocket) {
      io.to(callerSocket).emit("callRejected", {
        callId: data.callId,
        rejectedBy: data.from
      });
      
      console.log("CALL REJECTION sent to caller:", data.to);
    }
  });

  // 4. WebRTC Signal Exchange (after call accepted)
  socket.on("sendSignal", (data) => {
    console.log("SIGNAL EXCHANGE:", data.from, "->", data.to);
    const targetSocket = global.onlineUsers.get(data.to);
    
    if (targetSocket) {
      io.to(targetSocket).emit("receiveSignal", {
        signal: data.signal,
        from: data.from,
        callId: data.callId
      });
    }
  });

  // 5. End Call (either party can end)
  socket.on("endCall", (data) => {
    console.log("CALL ENDED:", data.callId);
    const otherUserSocket = global.onlineUsers.get(data.to);
    
    if (otherUserSocket) {
      io.to(otherUserSocket).emit("callEnded", {
        callId: data.callId,
        endedBy: data.from
      });
    }
  });

  // 6. Cancel Call (caller cancels before answer)
  socket.on("cancelCall", (data) => {
    console.log("CALL CANCELLED:", data.callId);
    const receiverSocket = global.onlineUsers.get(data.to);
    
    if (receiverSocket) {
      io.to(receiverSocket).emit("callCancelled", {
        callId: data.callId,
        cancelledBy: data.from
      });
    }
  });
});

// Handle all other routes for SPA (React app)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/build', 'index.html'));
});
