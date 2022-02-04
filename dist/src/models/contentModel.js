"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.textData = exports.setTextData = void 0;
let textData = [[""]];
exports.textData = textData;
function parseChanges(ch) {
    switch (ch.origin) {
        case "+input":
            if (ch.removed.length === 1 && ch.removed[0] === "") {
                // if no there is no delete op
                insert(ch.from.line, ch.from.ch, ch.text, 0, textData);
            }
            else {
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
exports.default = parseChanges;
// text manipulation operations
function insert(line, index, text, remove, content) {
    // edits are happening on one line
    if (text.length === 1) {
        const lineArray = content[line][0].split("");
        content[line] = lineArray;
        content[line].splice(index, remove, text[0]);
        const lineString = content[line].join("");
        content[line] = [lineString];
    }
    else {
        const returnOffset = text.length;
        const lineArray = content[line][0].split("");
        content[line] = lineArray;
        console.log(lineArray);
        // split line on new line
        const oldLine = content[line].slice(0, index);
        let newLine = content[line].slice(index);
        if (newLine === undefined || newLine === []) {
            newLine = [""];
        }
        // split doc
        content[line] = [oldLine.join("")];
        const oldDoc = content.slice(0, line);
        const newDoc = content.slice(line);
        oldDoc.push([newLine.join("")]);
        // why is this backwards?
        content = [newDoc[0], oldDoc[0]];
        // console.log(returnOffset);
        // if (content[line + returnOffset]) {
        //     // text.forEach((insertLine, i) => {
        //     //     console.log(content);
        //     //     const lineArray = content[line + i][0].split("");
        //     //     content[line + i] = lineArray;
        //     //     content[line + i].splice(index, remove, insertLine);
        //     // });
        // } else {
        //     for (let i = 0; i < returnOffset; i++) {
        //         content[line + i] = [""];
        //     }
        // }
    }
    console.log(content);
}
function remove(line, index, text, remove, content) {
    remove.forEach((removeLine, i) => {
        const lineArray = content[line][0].split("");
        content[line] = lineArray;
        content[line].splice(index, removeLine.length);
    });
    const lineString = content[line].join("");
    content[line] = [lineString];
    console.log(content);
}
function setTextData(data) {
    exports.textData = textData = [data.split("\n")];
}
exports.setTextData = setTextData;
