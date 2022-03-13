import { ChangeSet } from "@codemirror/state";
import { Server, Socket } from "socket.io";
import DocumentAuthority from "../models/contentModel";
import { ClientChanges } from "../types/CodeMirror";
import getBodyData from "./github";

let documents: { [key: string]: DocumentAuthority } = {};

export default function socket(io: Server) {
    io.on("connection", (socket: Socket) => {
        socket.emit("connected", socket.id);

        socket.on("create", async ({ roomId, documentData }) => {
            try {
                await socket.join(roomId);
            } catch (error) {
                console.log(error);
            }

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
            let document: DocumentAuthority;
            if (documents[roomId]) {
                document = documents[roomId];
            } else {
                console.log("room does not exist");
                return;
            }
            socket.join(roomId);
            socket.emit("joined", {
                doc: document.doc,
                updates: document.getUpdates(),
                msg: `joined room ${roomId}`,
                test: console.log("emitted"),
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
                document.receiveUpdates(changes, io, roomId);
            });
        });
    });
}
