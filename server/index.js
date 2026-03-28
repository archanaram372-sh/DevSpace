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
const roomSocket = require("./socket/roomSocket");
roomSocket(io);

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
  const { code } = req.body;
  let logs = []; // The bucket for our logs

  try {
    const vm = new VM({
      timeout: 1000,
      sandbox: {
        console: {
          log: (...args) => {
            logs.push(args.join(" ")); // This captures console.log("hi")
          }
        }
      }
    });

    vm.run(code);

    // If logs are empty, return the last evaluated expression, else return the logs
    const output = logs.length > 0 ? logs.join("\n") : "Code executed (no output)";
    res.json({ output: output });

  } catch (err) {
    res.json({ output: `Error: ${err.message}` });
  }
});

server.listen(5000, () => {
  console.log("✅ Server running on port 5000 with Log Trapping");
});
