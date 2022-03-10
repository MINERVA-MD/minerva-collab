import { ChangeSet, Text } from "@codemirror/state";
import { Update } from "@codemirror/collab";
import { ClientChanges } from "../types/CodeMirror";
import { Server, Socket } from "socket.io";

export default class DocumentAuthority {
    doc: Text;
    private _updates: Update[] = [];

    constructor(initDoc: string[] = [""], updates?: Update[]) {
        this.doc = Text.of(initDoc);
        if (updates) this._updates = updates;
    }

    public receiveUpdates(
        changes: ClientChanges,
        connection: Server,
        roomId: string
    ) {
        console.log(
            `new: ${changes.updates.length} current: ${
                this.getUpdates().length
            }`
        );
        if (this.getUpdates().length === changes.version) {
            changes.updates.forEach((u) => {
                const deserializedUpdate = ChangeSet.fromJSON(u.updateJSON);
                this._updates.push({
                    changes: deserializedUpdate,
                    clientID: u.clientID,
                });
                const updateDoc = deserializedUpdate.apply(this.doc);
                this.doc = updateDoc;
            });
            this.sendUpdates(changes, connection, roomId);
        } else {
            console.log("does not match");
        }
    }

    sendUpdates(changes: ClientChanges, connection: Server, roomId: string) {
        connection.to(roomId).emit("serverOpUpdate", {
            version: changes.version,
            updates: changes.updates,
        });
    }

    getUpdates() {
        return this._updates;
    }
}
