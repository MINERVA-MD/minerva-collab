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

// socket.emit("join", roomId);
// socket.on("joined", ({ data, msg }) => {
//     codeMirror.setValue(data.join("\n"));
// });

// // fetch github content
// github.addEventListener("click", () => {
//     socket.emit("loadGithub");
// });

// // socket connection
// socket.on("serverOpUpdate", (data) => {
//     codeMirror.replaceRange(data.text, data.from, data.to);
// });

// socket.on("serverContentUpdate", (data) => {
//     codeMirror.setValue(data.join("\n"));
// });

// socket.on("welcome", (msg) => {
//     console.log(msg);
// });
