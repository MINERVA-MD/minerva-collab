import { CodeMirrorOps } from "../types/CodeMirrorDelta";

let textData: Array<string[]> = [[""]];

export default function parseChanges(ch: CodeMirrorOps) {
    switch (ch.origin) {
        case "+input":
            if (ch.removed.length === 1 && ch.removed[0] === "") {
                // if no there is no delete op
                insert(
                    ch.from.line,
                    ch.from.ch,
                    ch.text,
                    ch.removed.length,
                    textData
                );
            } else {
                // if there is a delete op
            }

        case "+delete":

        case "paste":

        default:
            break;
    }
}

// text manipulation operations
function insert(
    line: number,
    index: number,
    text: string[],
    remove: number,
    content: Array<string[]>
) {
    text.forEach((insertData, i) => {
        content[line].splice(index, remove, insertData);
        console.log(content);
    });
}
