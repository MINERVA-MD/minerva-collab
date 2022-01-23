const idText = document.getElementById('id-input')
const form = document.getElementById('form')
const roomEl = document.getElementById('room-id')

const textForm = document.getElementById('text-send')
const content = document.getElementById('content')
const sendContent = document.getElementById('send-content')


let roomId;

socket.on('welcome', (msg) => {
  console.log(msg)
})