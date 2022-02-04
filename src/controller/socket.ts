import { Server, Socket } from "socket.io";
import parseChanges from "../models/contentModel";
import { CodeMirrorOps } from "../types/CodeMirrorDelta";

export default function socket(io: Server) {
    io.on("connection", (socket: Socket) => {
        socket.emit("welcome", `Welcome ${socket.id}`);

        socket.on("join", (roomId) => {
            socket.join(roomId);
            socket.emit("joined", `joined room ${roomId}`);

            // Position/Byte solution
            socket.on("clientUpdate", (changes: { ops: CodeMirrorOps }) => {
                parseChanges(changes.ops);
            });
        });
    });
}
