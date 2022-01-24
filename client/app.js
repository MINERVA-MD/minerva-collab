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
    if (prev.length < curr.length) {
        let indexBreak;
        for (let i = 0; i < curr.length; i++) {
            const currChar = curr[i];
            const prevChar = prev[i];
            if (currChar != prevChar) {
                indexBreak = i;
                console.log(prev, curr);
                break;
            }
        }
        curr.substring();
    }
}
console.log(Diff);
editor.addEventListener("click", () => {
    if (editor.selectionStart == editor.selectionEnd) {
        //console.log(editor.selectionStart);
    }
});

// naive solution -- sending data each update
// editor.addEventListener("keyup", (e) => {
//     const data = e.target.value;
//     console.log(e.key);
//     socket.emit("update", data);
// });

// positional solution (theoretically scales bette)
// editor.addEventListener("keydown", (e) => {
//     if (editor.selectionStart === editor.selectionEnd && e.key.length == 1) {
//         socket.emit("insert", { pos: editor.selectionStart, char: e.key });
//     }
// });

// editor.addEventListener("keydown", (e) => {
//     console.log(e.key)
//     if (editor.selectionStart === editor.selectionEnd && e.key === "Backspace") {
//         socket.emit("delete", editor.selectionStart)
//     } else if (editor.selectionStart === editor.selectionEnd && e.key === "Enter") {
//         socket.emit("insert", { pos: editor.selectionStart, char: "\n" });
//     }
// })
let data = "";

// let prev;
// editor.addEventListener("keydown", (e) => {
//     prev = e.target.value
// })
// editor.addEventListener('keyup', (e) => {
//     if (prev !== e.target.value) {
//         getDiff(prev, e.target.value)
//     }
// })

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
