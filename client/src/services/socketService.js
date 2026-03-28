import { io } from "socket.io-client";

let socket = null;

export const connectSocket = (token) => {
  socket = io("http://127.0.0.1:5000", {
    auth: {
      token,
    },
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
