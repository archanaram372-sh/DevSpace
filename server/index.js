import express from "express";
import cors from "cors";
import { VM } from "vm2";
import http from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.js";
import admin from "./firebaseAdmin.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

// create http server
const server = http.createServer(app);

// socket server with auth middleware
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
import roomSocket from "./socket/roomSocket.js";
roomSocket(io);

// Middleware to authenticate socket connections
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    socket.userId = decoded.uid;
    socket.userEmail = decoded.email;
    socket.userName = decoded.name || decoded.email.split("@")[0];
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

// Track connected users with their cursor positions
const users = new Map();
const userColors = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E2",
];

// 🔥 REALTIME COLLAB LOGIC
io.on("connection", (socket) => {
  const color = userColors[users.size % userColors.length];
  users.set(socket.id, {
    userId: socket.userId,
    name: socket.userName,
    email: socket.userEmail,
    color,
    cursor: { line: 0, column: 0 },
    selection: null,
  });

  console.log("User connected:", socket.userName, socket.id);

  // Broadcast user joined
  socket.broadcast.emit("user-joined", {
    userId: socket.id,
    name: socket.userName,
    color,
    users: Array.from(users.values()).map((u, idx) => ({
      id: Array.from(users.keys())[idx],
      name: u.name,
      color: u.color,
    })),
  });

  // Send existing users to new client
  socket.emit("users-list", 
    Array.from(users.entries()).map(([id, user]) => ({
      id,
      name: user.name,
      color: user.color,
    }))
  );

  // Handle code changes with user info
  socket.on("code-change", (data) => {
    socket.broadcast.emit("receive-code", {
      ...data,
      userId: socket.id,
      userName: socket.userName,
    });
  });

  // Handle cursor movements
  socket.on("cursor-move", (cursor) => {
    const user = users.get(socket.id);
    if (user) {
      user.cursor = cursor;
      socket.broadcast.emit("cursor-position", {
        userId: socket.id,
        cursor,
        userName: socket.userName,
        color,
      });
    }
  });

  // Handle selection changes
  socket.on("selection-change", (selection) => {
    const user = users.get(socket.id);
    if (user) {
      user.selection = selection;
      socket.broadcast.emit("selection-update", {
        userId: socket.id,
        selection,
        userName: socket.userName,
      });
    }
  });

  // Handle chat messages
  socket.on("send-message", (message) => {
    io.emit("receive-message", {
      userName: socket.userName,
      message,
      timestamp: new Date().toISOString(),
      userId: socket.id,
    });
  });

  socket.on("disconnect", () => {
    users.delete(socket.id);
    console.log("User disconnected:", socket.id);
    io.emit("user-left", { userId: socket.id });
  });
});

// code execution API
app.post("/run", (req, res) => {
  const { code } = req.body;
  let logs = [];

  try {
    const vm = new VM({
      timeout: 1000,
      sandbox: {
        console: {
          log: (...args) => {
            logs.push(args.join(" "));
          },
        },
      },
    });

    vm.run(code);

    const output =
      logs.length > 0 ? logs.join("\n") : "Code executed (no output)";
    res.json({ output });
  } catch (err) {
    res.json({ output: `Error: ${err.message}` });
  }
});

server.listen(5000, () => {
  console.log("✅ Server running on port 5000");
});
