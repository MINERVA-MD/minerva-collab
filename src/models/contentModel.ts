import { ChangeSet, Text } from "@codemirror/state";
import { Update } from "@codemirror/collab";
import { ClientChanges } from "../types/CodeMirror";
import { Socket } from "socket.io";

export default class DocumentAuthority {
    doc: Text;
    private _updates: Update[] = [];

    constructor(initDoc: string[] = [""]) {
        this.doc = Text.of(initDoc);
    }

    public receiveUpdates(changes: ClientChanges, connection: Socket) {
        console.log(this._updates.length);
        if (changes.version !== this._updates.length) {
            return;
        } else if (changes.version === this._updates.length) {
            changes.updates.forEach((u) => {
                const deserializedUpdate = ChangeSet.fromJSON(u.updateJSON);
                this._updates.push({
                    changes: deserializedUpdate,
                    clientID: u.clientID,
                });
                this.doc = deserializedUpdate.apply(this.doc);
            });
            //console.log(this._updates.length);
            this.sendUpdates(changes, connection);
        }
    }

    sendUpdates(changes: ClientChanges, connection: Socket) {
        //this.connection.emit('serverOpUpdate', (version: ))
    }
}
