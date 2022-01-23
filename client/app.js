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

editor.addEventListener("click", () => {
    if (editor.selectionStart == editor.selectionEnd) {
        console.log(editor.selectionStart);
    }
});

// naive solution -- sending data each update
// editor.addEventListener("keyup", (e) => {
//     const data = e.target.value;
//     console.log(e.key);
//     socket.emit("update", data);
// });

// positional solution (theoretically scales bette)
editor.addEventListener("keypress", (e) => {
    if (editor.selectionStart == editor.selectionEnd && e.key.length == 1) {
        socket.emit("insert", { pos: editor.selectionStart, char: e.key });
    }
});

socket.on("update", (data) => {
    editor.value = data;
});

socket.on("welcome", (msg) => {
    console.log(msg);
});
