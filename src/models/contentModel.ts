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
            remove(
                ch.from.line,
                ch.from.ch,
                ch.to.ch,
                ch.to.line,
                ch.text,
                ch.removed,
                textData
            );
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
    retain: number,
    text: string[],
    remove: number,
    content: Array<string[]>
) {
    // edits are happening on one line
    if (text.length === 1) {
        const lineArray = content[line][0].split("");
        content[line] = lineArray;
        content[line].splice(retain, remove, text[0]);
        const lineString = content[line].join("");
        content[line] = [lineString];
    } else {
        // multi-line edits
        // breaks string at line index to be split and edited
        let lineArray: string[];
        if (content[line] !== undefined) {
            lineArray = content[line][0].split("");
        } else {
            lineArray = [""];
        }
        content[line] = lineArray;

        //split to new line at cursor index
        const oldLine = content[line].slice(0, retain).join("");
        let newLine = content[line].slice(retain).join("");
        if (newLine === undefined || newLine === "") {
            newLine = "";
        }
        //console.log({ old: oldLine, new: newLine });

        // insert new line
        for (let i = 0; i < text.length - 1; i++) {
            const lineText = text[i];
            console.log(lineText);
            content.splice(line + 1, 0, [newLine]);
            content[line] = [oldLine];
        }
    }
    console.log(content);
}

function remove(
    line: number,
    retain: number,
    index: number,
    initLine: number,
    text: string[],
    remove: string[],
    content: Array<string[]>
) {
    // handle single line delete
    const lineArray = content[line][0].split("");

    lineArray.splice(retain, remove[0].length);

    const lineString = lineArray.join("");
    if (lineString === undefined || lineString === "") {
        console.log(true);
        content.splice(line, 0);
        console.log(content);
    } else {
        console.log("also here");
        content[line] = [lineString];
    }

    // multi-line delete
    if (line !== initLine) {
        // set end line delete
        const initLineArray = content[initLine][0].split("");
        initLineArray.splice(0, index);
        content[initLine] = [initLineArray.join("")];

        console.log(content);
    }
}

export function setTextData(data: string) {
    textData = [data.split("\n")];
}

export { textData };
