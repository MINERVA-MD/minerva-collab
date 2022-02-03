const send = document.getElementById("send");
const roomEl = document.getElementById("roomId");

const socket = io("http://localhost:8080/");
const roomId = "3265";
roomEl.innerHTML = "room id: " + roomId;

socket.emit("join", roomId);
socket.on("joined", (msg) => {
    console.log(msg);
});

// codemirror config
var codeMirror = CodeMirror(document.body, {
    lineWrapping: true,
    lineNumbers: true,
    value: "",
    mode: "markdown",
});

let data = "";

codeMirror.on("changes", (e, ch) => {
    console.log(ch[0]);
    socket.emit('clientUpdate', ch[0]);
});

// needs to be rewritten
socket.on("update", ({ data, shift }) => {
    const { selectionStart, selectionEnd } = editor;
    editor.value = data;
    editor.selectionStart = selectionStart + shift;
    editor.selectionEnd = selectionEnd + shift;
    console.log("update  " + data);
});

socket.on("welcome", (msg) => {
    console.log(msg);
});
