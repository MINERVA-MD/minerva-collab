"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasBadZoomedRects = exports.hasCopyEvent = exports.hasSelection = exports.splitLinesAuto = exports.hasBadBidiRects = exports.zeroWidthElement = exports.dragAndDrop = void 0;
const dom_js_1 = require("./dom.js");
const browser_js_1 = require("./browser.js");
// Detect drag-and-drop
exports.dragAndDrop = function () {
    // There is *some* kind of drag-and-drop support in IE6-8, but I
    // couldn't get it to work yet.
    if (browser_js_1.ie && browser_js_1.ie_version < 9)
        return false;
    let div = (0, dom_js_1.elt)('div');
    return "draggable" in div || "dragDrop" in div;
}();
let zwspSupported;
function zeroWidthElement(measure) {
    if (zwspSupported == null) {
        let test = (0, dom_js_1.elt)("span", "\u200b");
        (0, dom_js_1.removeChildrenAndAdd)(measure, (0, dom_js_1.elt)("span", [test, document.createTextNode("x")]));
        if (measure.firstChild.offsetHeight != 0)
            zwspSupported = test.offsetWidth <= 1 && test.offsetHeight > 2 && !(browser_js_1.ie && browser_js_1.ie_version < 8);
    }
    let node = zwspSupported ? (0, dom_js_1.elt)("span", "\u200b") :
        (0, dom_js_1.elt)("span", "\u00a0", null, "display: inline-block; width: 1px; margin-right: -1px");
    node.setAttribute("cm-text", "");
    return node;
}
exports.zeroWidthElement = zeroWidthElement;
// Feature-detect IE's crummy client rect reporting for bidi text
let badBidiRects;
function hasBadBidiRects(measure) {
    if (badBidiRects != null)
        return badBidiRects;
    let txt = (0, dom_js_1.removeChildrenAndAdd)(measure, document.createTextNode("A\u062eA"));
    let r0 = (0, dom_js_1.range)(txt, 0, 1).getBoundingClientRect();
    let r1 = (0, dom_js_1.range)(txt, 1, 2).getBoundingClientRect();
    (0, dom_js_1.removeChildren)(measure);
    if (!r0 || r0.left == r0.right)
        return false; // Safari returns null in some cases (#2780)
    return badBidiRects = (r1.right - r0.right < 3);
}
exports.hasBadBidiRects = hasBadBidiRects;
// See if "".split is the broken IE version, if so, provide an
// alternative way to split lines.
exports.splitLinesAuto = "\n\nb".split(/\n/).length != 3 ? string => {
    let pos = 0, result = [], l = string.length;
    while (pos <= l) {
        let nl = string.indexOf("\n", pos);
        if (nl == -1)
            nl = string.length;
        let line = string.slice(pos, string.charAt(nl - 1) == "\r" ? nl - 1 : nl);
        let rt = line.indexOf("\r");
        if (rt != -1) {
            result.push(line.slice(0, rt));
            pos += rt + 1;
        }
        else {
            result.push(line);
            pos = nl + 1;
        }
    }
    return result;
} : string => string.split(/\r\n?|\n/);
exports.hasSelection = window.getSelection ? te => {
    try {
        return te.selectionStart != te.selectionEnd;
    }
    catch (e) {
        return false;
    }
} : te => {
    let range;
    try {
        range = te.ownerDocument.selection.createRange();
    }
    catch (e) { }
    if (!range || range.parentElement() != te)
        return false;
    return range.compareEndPoints("StartToEnd", range) != 0;
};
exports.hasCopyEvent = (() => {
    let e = (0, dom_js_1.elt)("div");
    if ("oncopy" in e)
        return true;
    e.setAttribute("oncopy", "return;");
    return typeof e.oncopy == "function";
})();
let badZoomedRects = null;
function hasBadZoomedRects(measure) {
    if (badZoomedRects != null)
        return badZoomedRects;
    let node = (0, dom_js_1.removeChildrenAndAdd)(measure, (0, dom_js_1.elt)("span", "x"));
    let normal = node.getBoundingClientRect();
    let fromRange = (0, dom_js_1.range)(node, 0, 1).getBoundingClientRect();
    return badZoomedRects = Math.abs(normal.left - fromRange.left) > 1;
}
exports.hasBadZoomedRects = hasBadZoomedRects;
