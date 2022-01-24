const editor = document.getElementById("editor");
const send = document.getElementById("send");
const roomEl = document.getElementById("roomId");

const socket = io("http://localhost:8080/");
const roomId = "3265";
roomEl.innerHTML = "room id: " + roomId;

socket.emit("join", roomId);
socket.on("joined", (msg) => {
    console.log(msg);
});

function getDiff(prev, curr) {
    const diff = Diff.diffChars(prev, curr);
    console.log(diff);
}

let data = "";

editor.addEventListener("input", (e) => {
    getDiff(data, e.currentTarget.value);
    data = e.currentTarget.value;
});

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
