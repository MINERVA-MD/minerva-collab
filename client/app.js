import { EditorState, basicSetup, EditorView } from "@codemirror/basic-setup";
import { sendableUpdates, receiveUpdates } from "@codemirror/collab";
import { markdown } from "@codemirror/lang-markdown";

const send = document.getElementById("send");
const github = document.getElementById("github");
const roomEl = document.getElementById("roomId");
const vim = document.getElementById("toggleVim");

const socket = io("http://localhost:8080/");
const roomId = "3265";
roomEl.innerHTML = "room id: " + roomId;

socket.emit("join", roomId);

// CODEMIRROR
let view = new EditorView({
    state: EditorState.create({
        extensions: [
            basicSetup,
            markdown(),
            EditorView.lineWrapping,
            EditorView.updateListener.of((update) => {
                setTimeout(() => {
                    if (update.docChanged) {
                        console.log(update.changes.toJSON());
                    }
                }, 200);
            }),
        ],
    }),
    parent: document.body,
});

console.log(view.state);
