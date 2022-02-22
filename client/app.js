import { EditorState, basicSetup, EditorView } from "@codemirror/basic-setup";
import {
    sendableUpdates,
    receiveUpdates,
    collab,
    getSyncedVersion,
} from "@codemirror/collab";
import { markdown } from "@codemirror/lang-markdown";
import { Text } from "@codemirror/text";
import { ViewPlugin, drawSelection } from "@codemirror/view";
import { ChangeSet } from "@codemirror/state";

const send = document.getElementById("send");
const github = document.getElementById("github");
const roomEl = document.getElementById("roomId");
const vim = document.getElementById("toggleVim");

//const socket = io("https://text-sockets.herokuapp.com/");
const socket = io("http://localhost:8080/");

const roomId = "3265";
roomEl.innerHTML = "room id: " + roomId;

socket.emit("join", roomId);
socket.on("joined", (documentData) => {
    let doc = Text.of(documentData.doc);
    let updates = documentData.updates;

    // CODEMIRROR
    const state = EditorState.create({
        doc: doc,
        extensions: [
            basicSetup,
            markdown(),
            collab({ startVersion: updates.length }),
            EditorView.lineWrapping,
            editorClient(updates.length, doc),
        ],
    });

    let view = new EditorView({
        state,
        parent: document.body,
    });

    function editorClient(version, doc) {
        let plugin = ViewPlugin.define((view) => ({
            update(editorUpdate) {
                if (editorUpdate.docChanged) {
                    const unsentUpdates = sendableUpdates(view.state).map(
                        (u) => {
                            const serializedUpdate = {
                                updateJSON: u.changes.toJSON(),
                                clientID: u.clientID,
                            };

                            return serializedUpdate;
                        }
                    );

                    socket.emit("clientOpUpdate", {
                        version: getSyncedVersion(view.state),
                        updates: unsentUpdates,
                    });
                }
            },
        }));
        return plugin;
    }
    socket.on("serverOpUpdate", (changes) => {
        const deserializedChangeSet = changes.updates.map((u) => {
            return {
                changes: ChangeSet.fromJSON(u.updateJSON),
                clientID: u.clientID,
            };
        });
        view.dispatch(receiveUpdates(view.state, deserializedChangeSet));
    });
});
