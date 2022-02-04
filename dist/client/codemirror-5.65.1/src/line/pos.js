"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clipPosArray = exports.clipPos = exports.clipLine = exports.minPos = exports.maxPos = exports.copyPos = exports.equalCursorPos = exports.cmp = exports.Pos = void 0;
const utils_line_js_1 = require("./utils_line.js");
// A Pos instance represents a position within the text.
function Pos(line, ch, sticky = null) {
    if (!(this instanceof Pos))
        return new Pos(line, ch, sticky);
    this.line = line;
    this.ch = ch;
    this.sticky = sticky;
}
exports.Pos = Pos;
// Compare two positions, return 0 if they are the same, a negative
// number when a is less, and a positive number otherwise.
function cmp(a, b) { return a.line - b.line || a.ch - b.ch; }
exports.cmp = cmp;
function equalCursorPos(a, b) { return a.sticky == b.sticky && cmp(a, b) == 0; }
exports.equalCursorPos = equalCursorPos;
function copyPos(x) { return Pos(x.line, x.ch); }
exports.copyPos = copyPos;
function maxPos(a, b) { return cmp(a, b) < 0 ? b : a; }
exports.maxPos = maxPos;
function minPos(a, b) { return cmp(a, b) < 0 ? a : b; }
exports.minPos = minPos;
// Most of the external API clips given positions to make sure they
// actually exist within the document.
function clipLine(doc, n) { return Math.max(doc.first, Math.min(n, doc.first + doc.size - 1)); }
exports.clipLine = clipLine;
function clipPos(doc, pos) {
    if (pos.line < doc.first)
        return Pos(doc.first, 0);
    let last = doc.first + doc.size - 1;
    if (pos.line > last)
        return Pos(last, (0, utils_line_js_1.getLine)(doc, last).text.length);
    return clipToLen(pos, (0, utils_line_js_1.getLine)(doc, pos.line).text.length);
}
exports.clipPos = clipPos;
function clipToLen(pos, linelen) {
    let ch = pos.ch;
    if (ch == null || ch > linelen)
        return Pos(pos.line, linelen);
    else if (ch < 0)
        return Pos(pos.line, 0);
    else
        return pos;
}
function clipPosArray(doc, array) {
    let out = [];
    for (let i = 0; i < array.length; i++)
        out[i] = clipPos(doc, array[i]);
    return out;
}
exports.clipPosArray = clipPosArray;
