import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import http from "http";

export default function socket(io: http.Server) {
  io.on("connection", (socket: Socket) => {
    socket.emit("welcome", "I'm a poop");
  });
}
