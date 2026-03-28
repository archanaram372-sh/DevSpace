const express = require("express");
const cors = require("cors");
const { VM } = require("vm2");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

// create http server
const server = http.createServer(app);

// socket server
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// 🔥 REALTIME COLLAB LOGIC
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("code-change", (code) => {
    socket.broadcast.emit("receive-code", code);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// code execution API
app.post("/run", (req, res) => {
  try {
    const vm = new VM();
    const result = vm.run(req.body.code);
    res.json({ output: result });
  } catch (err) {
    res.json({ output: err.toString() });
  }
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});