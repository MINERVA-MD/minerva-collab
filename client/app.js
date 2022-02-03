const send = document.getElementById("send");
const roomEl = document.getElementById("roomId");
const vim = document.getElementById("toggleVim");

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
    keyMap: "default",
    value: "",
    mode: "markdown",
});

// CodeMirror
let data = "";

codeMirror.on("changes", (e, ch) => {
    console.log(ch[0]);
    const ops = ch[0];
    socket.emit("clientUpdate", { ops });
});

// switch mode between vim and default
vim.addEventListener("change", (e) => {
    if (e.target.checked) {
        codeMirror.setOption("keyMap", "vim");
    } else {
        codeMirror.setOption("keyMap", "default");
    }
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
