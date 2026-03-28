export default function roomSocket(io) {
  const rooms = {};

  io.on("connection", (socket) => {

    socket.on("join-room", ({ username, room }) => {
      socket.join(room);
      socket.username = username;
      socket.room = room;

      if (!rooms[room]) rooms[room] = [];
      rooms[room].push(username);

      io.to(room).emit("room-users", rooms[room]);
    });

    socket.on("code-change", (data) => {
      socket.to(socket.room).emit("receive-code", data);
    });

    socket.on("typing", (data) => {
      socket.to(socket.room).emit("user-typing", data);
    });

    socket.on("send-message", (msg) => {
      io.to(socket.room).emit("receive-message", msg);
    });

    socket.on("disconnect", () => {
      const room = socket.room;
      if (rooms[room]) {
        rooms[room] = rooms[room].filter(u => u !== socket.username);
        io.to(room).emit("room-users", rooms[room]);
      }
    });

  });
}