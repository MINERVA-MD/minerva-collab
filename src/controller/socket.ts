import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export default function socket(io: {
  on: (
    ev: string,
    cb: (
      socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
    ) => void
  ) => void;
}) {
  io.on("connection", (socket: Socket) => {
    socket.emit("welcome", "I'm a poop");
  });
}
