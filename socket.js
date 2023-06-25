import { Server } from "socket.io";

/**
 * @type {{[key: string]: {users: string[], messages: {from: string, message: string, time: string}[]}}}
 */
const ROOMS_DATA = {};

// @ts-ignore
function injectSocketIO(server) {
  const io = new Server(server);

  io.on("connection", (socket) => {
    let username = `User ${Math.round(Math.random() * 999999)}`;

    socket.emit("name", username);

    socket.on("register", (candidate) => {
      console.log("register", candidate);
      // ROOMS_DATA[candidate.room] = {
      //   users: [username],
      //   messages: [],
      // };
      // ROOMS_DATA[candidate.room].users.push(candidate.username);
      // socket.join(candidate.room);
      // socket.emit("room", ROOMS_DATA[candidate.room]);
    });

    socket.on("offer", (offer, userId, room) => {
      socket.to(room).emit("offer", offer, userId, room);
    });

    socket.on("answer", (answer, room) => {
      socket.to(room).emit("answer", answer, room);
    });

    socket.on("message", (message) => {
      io.emit("message", {
        from: username,
        message: message,
        time: new Date().toLocaleString(),
      });
    });
  });

  console.log("SocketIO injected");
}

export const webSocketServer = {
  name: "webSocketServer",
  // @ts-ignore
  configureServer(server) {
    injectSocketIO(server.httpServer);
  },
};
