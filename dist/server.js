"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_1 = __importDefault(require("./src/controller/socket"));
const port = process.env.PORT || "8080";
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
app.get("/", (req, res) => {
    res.send("test socket environment");
});
// socket logic
(0, socket_1.default)(io);
server.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
});
