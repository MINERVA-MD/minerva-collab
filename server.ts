import express from "express";
import http from "http";
import { Socket } from "socket.io";
import socket from "./src/controller/socket";

const port: string = process.env.PORT || "8080";
const app: express.Application = express();
const server: http.Server = http.createServer(app);
const io: http.Server = require("socket.io")(server, {
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

server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
