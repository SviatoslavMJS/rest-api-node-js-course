let io;

module.exports = {
  init: (httpServer) => {
    io = require("socket.io")(httpServer, {
        cors: {
          origin: "*", // Allow all origins
          methods: ["GET", "POST"], // Allow GET and POST methods
        },
      });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io is not initialized");
    }
    return io;
  },
};
