const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict this to your frontend domain
    methods: ["GET", "POST"],
  },
});

// Serve static files in development
app.use(express.static(path.join(__dirname, "../client")));

// In-memory storage for rooms
const rooms = new Map();

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  let currentRoom = null;

  // Create a new room
  socket.on("create-room", (callback) => {
    const roomId = uuidv4();
    rooms.set(roomId, {
      id: roomId,
      users: new Map(),
      createdAt: new Date(),
    });

    callback({ roomId });
    console.log(`Room created: ${roomId}`);
  });

  // Join a room
  socket.on("join-room", ({ roomId, username, avatar }, callback) => {
    const room = rooms.get(roomId);

    if (!room) {
      callback({ success: false, error: "Room not found" });
      return;
    }

    // Add user to room
    currentRoom = roomId;
    const userData = {
      id: socket.id,
      username: username || `User-${socket.id.substring(0, 4)}`,
      avatar:
        avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${socket.id}`,
      joinedAt: new Date(),
    };

    room.users.set(socket.id, userData);

    // Join the Socket.io room
    socket.join(roomId);

    // Notify everyone in the room about the new user
    io.to(roomId).emit("user-joined", {
      user: userData,
      userCount: room.users.size,
      users: Array.from(room.users.values()),
    });

    callback({
      success: true,
      roomData: {
        id: room.id,
        userCount: room.users.size,
        users: Array.from(room.users.values()),
      },
    });

    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Handle chat messages
  socket.on("send-message", (message) => {
    if (!currentRoom || !rooms.has(currentRoom)) return;

    const room = rooms.get(currentRoom);
    const user = room.users.get(socket.id);

    if (!user) return;

    const messageData = {
      id: uuidv4(),
      text: message,
      sender: user,
      timestamp: new Date(),
    };

    // Broadcast the message to everyone in the room
    io.to(currentRoom).emit("new-message", messageData);
  });

  // Handle WebRTC signaling
  socket.on("signal", ({ to, signal }) => {
    io.to(to).emit("signal", {
      from: socket.id,
      signal,
    });
  });

  // Handle screen sharing start
  socket.on("screen-share-started", () => {
    if (!currentRoom) return;

    io.to(currentRoom).emit("user-screen-share", {
      userId: socket.id,
      isSharing: true,
    });
  });

  // Handle screen sharing stop
  socket.on("screen-share-stopped", () => {
    if (!currentRoom) return;

    io.to(currentRoom).emit("user-screen-share", {
      userId: socket.id,
      isSharing: false,
    });
  });

  // Handle disconnections
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (currentRoom && rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom);

      // Remove user from room
      room.users.delete(socket.id);

      // Notify others about the user leaving
      io.to(currentRoom).emit("user-left", {
        userId: socket.id,
        userCount: room.users.size,
        users: Array.from(room.users.values()),
      });

      console.log(`User ${socket.id} left room ${currentRoom}`);

      // If room is empty, delete it
      if (room.users.size === 0) {
        rooms.delete(currentRoom);
        console.log(`Room ${currentRoom} deleted (no users left)`);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
