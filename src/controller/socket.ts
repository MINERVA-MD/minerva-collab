import { Server, Socket } from "socket.io";
import http from "http";
import { insertChar, deleteChar } from "../models/contentModel";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export default function socket(io: Server) {
    io.on("connection", (socket: Socket) => {
        socket.emit("welcome", `Welcome ${socket.id}`);

        socket.on("join", (roomId) => {
            socket.join(roomId);
            socket.emit("joined", `joined room ${roomId}`);

            // Naive
            socket.on("update", (data) => {
                socket.in(roomId).emit("update", data);
            });

            // Position/Byte solution
            socket.on("insert", ({ pos, char }) => {
                const data = insertChar(pos, char);
                socket.in(roomId).emit("update", { data, shift: 0 });
            });
            socket.on("delete", (pos) => {
                const data = deleteChar(pos);
                socket.in(roomId).emit("update", { data, shift: 0 });
            });
        });
    });
}
