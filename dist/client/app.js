"use strict";
const send = document.getElementById("send");
const github = document.getElementById("github");
const roomEl = document.getElementById("roomId");
const vim = document.getElementById("toggleVim");
const socket = io("http://localhost:8080/");
const roomId = "3265";
roomEl.innerHTML = "room id: " + roomId;
socket.emit("join", roomId);
socket.on("joined", ({ data, msg }) => {
    codeMirror.setValue(data.join("\n"));
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
    // prevent changes from triggering on content update
    if (ch[0].origin === undefined || ch[0].origin === "setValue") {
        return;
    }
    else {
        console.log(ch[0]);
        const ops = ch[0];
        socket.emit("clientUpdate", { ops });
    }
});
// switch mode between vim and default
vim.addEventListener("change", (e) => {
    if (e.target.checked) {
        codeMirror.setOption("keyMap", "vim");
    }
    else {
        codeMirror.setOption("keyMap", "default");
    }
});
// fetch github content
github.addEventListener("click", () => {
    socket.emit("loadGithub");
});
// socket connection
socket.on("serverOpUpdate", (data) => {
    codeMirror.replaceRange(data.text, data.from, data.to);
});
socket.on("serverContentUpdate", ({ ops, html }) => {
    codeMirror.setValue(data.join("\n"));
});
socket.on("welcome", (msg) => {
    console.log(msg);
});
