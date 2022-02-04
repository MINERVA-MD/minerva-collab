import { CodeMirrorOps } from "../types/CodeMirrorDelta";

let textData: Array<string[]> = [[""]];

export default function parseChanges(ch: CodeMirrorOps) {
    switch (ch.origin) {
        case "+input":
            if (ch.removed.length === 1 && ch.removed[0] === "") {
                // if no there is no delete op
                insert(ch.from.line, ch.from.ch, ch.text, 0, textData);
            } else {
                // if there is a delete op
            }
            break;

        case "+delete":
            remove(ch.from.line, ch.from.ch, ch.text, ch.removed, textData);
            break;

        case "paste":

        case "undo":

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
        const lineArray = content[line][0].split("");
        content[line] = lineArray;
        content[line].splice(index, remove, insertData);
    });
    const lineString = content[line].join("");
    content[line] = [lineString];
    console.log(content);
}

function remove(
    line: number,
    index: number,
    text: string[],
    remove: string[],
    content: Array<string[]>
) {
    remove.forEach((removeData, i) => {
        const lineArray = content[line][0].split("");
        content[line] = lineArray;
        content[line].splice(index, removeData.length);
    });
    const lineString = content[line].join("");
    content[line] = [lineString];
    console.log(content);
}

export function setTextData(data: string) {
    textData = [data.split("\n")];
}

export { textData };
