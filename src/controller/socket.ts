import { Server, Socket } from "socket.io";
import parseChanges, { setTextData, textData } from "../models/contentModel";
import { CodeMirrorOps } from "../types/CodeMirrorDelta";
import getBodyData from "./github";

export default function socket(io: Server) {
    io.on("connection", (socket: Socket) => {
        socket.emit("welcome", `Welcome ${socket.id}`);

        socket.on("join", (roomId) => {
            socket.join(roomId);
            socket.emit("joined", {
                data: textData,
                msg: `joined room ${roomId}`,
            });

            // on loading github repo data
            socket.on("loadGithub", async () => {
                const data: string = await getBodyData(
                    "https://raw.githubusercontent.com/iflinda/iflinda-test/main/README.md"
                );
                setTextData(data);
                io.to(roomId).emit("serverContentUpdate", textData);
            });

            // Position/Byte solution
            socket.on("clientUpdate", (changes: { ops: CodeMirrorOps }) => {
                parseChanges(changes.ops);
                socket.to(roomId).emit("serverOpUpdate", changes.ops);
            });
        });
    });
}
