import { text } from "express";
import { CodeMirrorOps } from "../types/CodeMirrorDelta";

let textData: Array<string[]> = [[""]];

export default function parseChanges(ch: CodeMirrorOps) {
    switch (ch.origin) {
        case "+input":
            let lineNum = ch.from.line;
            console.log(ch.removed.length);

        case "+delete":

        case "paste":

        default:
            break;
    }
}
