import { text } from "express";
import { CodeMirrorDelta } from "../types/CodeMirrorDelta";

let textData: string[];

export default function parseChanges(ch: CodeMirrorDelta) {
  switch (ch.origin) {
    case "+input":

    case "+delete":

    case "paste":

    default:
      break;
  }
}
