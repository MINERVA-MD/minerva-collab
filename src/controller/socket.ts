import { ChangeSet } from "@codemirror/state";
import { Server, Socket } from "socket.io";
import DocumentAuthority from "../models/contentModel";
import { ClientChanges } from "../types/CodeMirror";
import getBodyData from "./github";

const document = new DocumentAuthority(undefined);

export default function socket(io: Server) {
    io.on("connection", (socket: Socket) => {
        socket.emit("welcome", `Welcome ${socket.id}`);

        socket.on("join", (roomId) => {
            socket.join(roomId);
            socket.emit("joined", {
                doc: document.doc,
                updates: document.getUpdates(),
                msg: `joined room ${roomId}`,
            });

            // on loading github repo data
            socket.on("loadGithub", async () => {
                const data: string = await getBodyData(
                    "https://raw.githubusercontent.com/iflinda/iflinda-test/main/README.md"
                );
                //setTextData(data);
                //io.to(roomId).emit("serverContentUpdate", textData);
            });

            // Position/Byte solution
            socket.on("clientOpUpdate", (changes: ClientChanges) => {
                document.receiveUpdates(changes, io, roomId);
            });
        });
    });
}
