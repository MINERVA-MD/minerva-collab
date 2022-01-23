const editor = document.getElementById("editor");
const send = document.getElementById("send");
const roomEl = document.getElementById("roomId");

const socket = io("localhost:8080/");
const roomId = "3265";
roomEl.innerHTML = "room id: " + roomId;

socket.emit("join", roomId);
socket.on("joined", (msg) => {
    console.log(msg);
});

editor.addEventListener("keyup", (e) => {
    const data = e.target.value;
    socket.emit("update", data);
});

socket.on("update", (data) => {
    editor.value = data;
});

socket.on("welcome", (msg) => {
    console.log(msg);
});
