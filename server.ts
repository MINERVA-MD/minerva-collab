import express from "express";
import http from "http";
import { Socket } from "socket.io";
import socket from "./src/controller/socket";
const port = process.env.PORT || 8080;
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("test socket environemnt");
});

// socket logic
socket(io);
io.on("connection", (socket: Socket) => {
  socket.emit("welcome", "I'm a poop");
});

server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
