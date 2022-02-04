"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeReplacedSel = exports.computeSelAfterChange = exports.changeEnd = void 0;
const pos_js_1 = require("../line/pos.js");
const misc_js_1 = require("../util/misc.js");
const selection_js_1 = require("./selection.js");
// Compute the position of the end of a change (its 'to' property
// refers to the pre-change end).
function changeEnd(change) {
    if (!change.text)
        return change.to;
    return (0, pos_js_1.Pos)(change.from.line + change.text.length - 1, (0, misc_js_1.lst)(change.text).length + (change.text.length == 1 ? change.from.ch : 0));
}
exports.changeEnd = changeEnd;
// Adjust a position to refer to the post-change position of the
// same text, or the end of the change if the change covers it.
function adjustForChange(pos, change) {
    if ((0, pos_js_1.cmp)(pos, change.from) < 0)
        return pos;
    if ((0, pos_js_1.cmp)(pos, change.to) <= 0)
        return changeEnd(change);
    let line = pos.line + change.text.length - (change.to.line - change.from.line) - 1, ch = pos.ch;
    if (pos.line == change.to.line)
        ch += changeEnd(change).ch - change.to.ch;
    return (0, pos_js_1.Pos)(line, ch);
}
function computeSelAfterChange(doc, change) {
    let out = [];
    for (let i = 0; i < doc.sel.ranges.length; i++) {
        let range = doc.sel.ranges[i];
        out.push(new selection_js_1.Range(adjustForChange(range.anchor, change), adjustForChange(range.head, change)));
    }
    return (0, selection_js_1.normalizeSelection)(doc.cm, out, doc.sel.primIndex);
}
exports.computeSelAfterChange = computeSelAfterChange;
function offsetPos(pos, old, nw) {
    if (pos.line == old.line)
        return (0, pos_js_1.Pos)(nw.line, pos.ch - old.ch + nw.ch);
    else
        return (0, pos_js_1.Pos)(nw.line + (pos.line - old.line), pos.ch);
}
// Used by replaceSelections to allow moving the selection to the
// start or around the replaced test. Hint may be "start" or "around".
function computeReplacedSel(doc, changes, hint) {
    let out = [];
    let oldPrev = (0, pos_js_1.Pos)(doc.first, 0), newPrev = oldPrev;
    for (let i = 0; i < changes.length; i++) {
        let change = changes[i];
        let from = offsetPos(change.from, oldPrev, newPrev);
        let to = offsetPos(changeEnd(change), oldPrev, newPrev);
        oldPrev = change.to;
        newPrev = to;
        if (hint == "around") {
            let range = doc.sel.ranges[i], inv = (0, pos_js_1.cmp)(range.head, range.anchor) < 0;
            out[i] = new selection_js_1.Range(inv ? to : from, inv ? from : to);
        }
        else {
            out[i] = new selection_js_1.Range(from, from);
        }
    }
    return new selection_js_1.Selection(out, doc.sel.primIndex);
}
exports.computeReplacedSel = computeReplacedSel;
