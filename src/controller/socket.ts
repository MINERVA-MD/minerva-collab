import { Socket } from "socket.io";
import http from "http";
import { insertChar, deleteChar } from "../models/contentModel";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export default function socket(io: {
  on: (
    arg0: string,
    arg1: (
      socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
    ) => void
  ) => void;
  in: (arg0: any) => {
    (): any;
    new (): any;
    emit: { (arg0: string, arg1: string | string[]): void; new (): any };
  };
}) {
  io.on("connection", (socket: Socket) => {
    socket.emit("welcome", `Welcome ${socket.id}`);

    socket.on("join", (roomId) => {
      socket.join(roomId);
      socket.emit("joined", `joined room ${roomId}`);

      // Naive
      socket.on("update", (data) => {
        socket.in(roomId).emit("update", data);
      });

      // Position/Byte solution
      socket.on("insert", ({ pos, char }) => {
        const data = insertChar(pos, char);
        socket.in(roomId).emit("update", data);
      });
      socket.on("delete", (pos) => {
        const data = deleteChar(pos);
        socket.in(roomId).emit("update", data);
      });
    });
  });
}
