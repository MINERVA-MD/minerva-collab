import express from "express";
import http from "http";
import socket from "./src/controller/socket";
import { Server } from "socket.io";

const port: string = process.env.PORT || "8080";
const app: express.Application = express();
const server: http.Server = http.createServer(app);
const io: Server = require("socket.io")(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

app.get("/", (req, res) => {
    res.send("test socket environment");
});

// socket logic
socket(io);

server.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
});

export { io };
