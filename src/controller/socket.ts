import { Socket } from "socket.io";
import http from "http";
import { insertChar, deleteChar } from "../models/contentModel";

export default function socket(io: http.Server) {
    io.on("connection", (socket: Socket) => {
        socket.emit("welcome", `Welcome ${socket.id}`);

        socket.on("join", (roomId) => {
            socket.join(roomId);
            socket.emit("joined", `joined room ${roomId}`);

            // Naive
            socket.on("update", (data) => {
                socket.in(roomId).emit("update", data);
            });

            // Byte insert
            socket.on("insert", ({ pos, char }) => {
                const data = insertChar(pos, char);
                socket.in(roomId).emit("update", data);
            });
        });
    });
}
