import { ChangeSet } from "@codemirror/state";
import { Server, Socket } from "socket.io";
import DocumentAuthority from "../models/contentModel";
import { ClientChanges } from "../types/CodeMirror";
import getBodyData from "./github";

let documents: { [key: string]: DocumentAuthority } = {};

export default function socket(io: Server) {
    io.on("connection", (socket: Socket) => {
        socket.emit("welcome", `Welcome ${socket.id}`);

        socket.on("create", ({ roomId, documentData }) => {
            console.log("room created " + roomId);
            socket.join(roomId);
            const document = new DocumentAuthority(
                documentData.doc,
                documentData.updates
            );
            documents[roomId] = document;

            socket.emit("created", {
                doc: document.doc,
                updates: document.getUpdates(),
            });

            // Position/Byte solution
            socket.on("clientOpUpdate", (changes: ClientChanges) => {
                console.log(changes);
                document.receiveUpdates(changes, io, roomId);
            });
        });

        socket.on("join", (roomId) => {
            console.log("joined");
            let document: DocumentAuthority;
            if (documents[roomId]) {
                document = documents[roomId];
            } else {
                return;
            }
            socket.join(roomId);
            socket.emit("joined", {
                doc: document.doc,
                updates: document.getUpdates(),
                msg: `joined room ${roomId}`,
            });
            console.log(document.doc);

            // on loading github repo data
            socket.on("loadGithub", async () => {
                const data: string = await getBodyData(
                    "https://raw.githubusercontent.com/iflinda/iflinda-test/main/README.md"
                );
            });

            // Position/Byte solution
            socket.on("clientOpUpdate", (changes: ClientChanges) => {
                console.log(changes);
                document.receiveUpdates(changes, io, roomId);
            });
        });
    });
}
