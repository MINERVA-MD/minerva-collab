import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import http from "http";

export default function socket(io: http.Server) {
    io.on("connection", (socket: Socket) => {
        socket.emit("welcome", `Welcome ${socket.id}`);

        socket.on("join", (roomId) => {
            socket.join(roomId);
            socket.emit("joined", `joined room ${roomId}`);

            socket.on("update", (data) => {
                socket.in(roomId).emit("update", data);
            });
        });
    });
}
