"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNearSelection = void 0;
const operations_js_1 = require("../display/operations.js");
const scrolling_js_1 = require("../display/scrolling.js");
const pos_js_1 = require("../line/pos.js");
const changes_js_1 = require("../model/changes.js");
const misc_js_1 = require("../util/misc.js");
// Helper for deleting text near the selection(s), used to implement
// backspace, delete, and similar functionality.
function deleteNearSelection(cm, compute) {
    let ranges = cm.doc.sel.ranges, kill = [];
    // Build up a set of ranges to kill first, merging overlapping
    // ranges.
    for (let i = 0; i < ranges.length; i++) {
        let toKill = compute(ranges[i]);
        while (kill.length && (0, pos_js_1.cmp)(toKill.from, (0, misc_js_1.lst)(kill).to) <= 0) {
            let replaced = kill.pop();
            if ((0, pos_js_1.cmp)(replaced.from, toKill.from) < 0) {
                toKill.from = replaced.from;
                break;
            }
        }
        kill.push(toKill);
    }
    // Next, remove those actual ranges.
    (0, operations_js_1.runInOp)(cm, () => {
        for (let i = kill.length - 1; i >= 0; i--)
            (0, changes_js_1.replaceRange)(cm.doc, "", kill[i].from, kill[i].to, "+delete");
        (0, scrolling_js_1.ensureCursorVisible)(cm);
    });
}
exports.deleteNearSelection = deleteNearSelection;
