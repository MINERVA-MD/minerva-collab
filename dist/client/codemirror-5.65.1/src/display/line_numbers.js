"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maybeUpdateLineNumberWidth = exports.alignHorizontally = void 0;
const utils_line_js_1 = require("../line/utils_line.js");
const position_measurement_js_1 = require("../measurement/position_measurement.js");
const dom_js_1 = require("../util/dom.js");
const update_display_js_1 = require("./update_display.js");
// Re-align line numbers and gutter marks to compensate for
// horizontal scrolling.
function alignHorizontally(cm) {
    let display = cm.display, view = display.view;
    if (!display.alignWidgets && (!display.gutters.firstChild || !cm.options.fixedGutter))
        return;
    let comp = (0, position_measurement_js_1.compensateForHScroll)(display) - display.scroller.scrollLeft + cm.doc.scrollLeft;
    let gutterW = display.gutters.offsetWidth, left = comp + "px";
    for (let i = 0; i < view.length; i++)
        if (!view[i].hidden) {
            if (cm.options.fixedGutter) {
                if (view[i].gutter)
                    view[i].gutter.style.left = left;
                if (view[i].gutterBackground)
                    view[i].gutterBackground.style.left = left;
            }
            let align = view[i].alignable;
            if (align)
                for (let j = 0; j < align.length; j++)
                    align[j].style.left = left;
        }
    if (cm.options.fixedGutter)
        display.gutters.style.left = (comp + gutterW) + "px";
}
exports.alignHorizontally = alignHorizontally;
// Used to ensure that the line number gutter is still the right
// size for the current document size. Returns true when an update
// is needed.
function maybeUpdateLineNumberWidth(cm) {
    if (!cm.options.lineNumbers)
        return false;
    let doc = cm.doc, last = (0, utils_line_js_1.lineNumberFor)(cm.options, doc.first + doc.size - 1), display = cm.display;
    if (last.length != display.lineNumChars) {
        let test = display.measure.appendChild((0, dom_js_1.elt)("div", [(0, dom_js_1.elt)("div", last)], "CodeMirror-linenumber CodeMirror-gutter-elt"));
        let innerW = test.firstChild.offsetWidth, padding = test.offsetWidth - innerW;
        display.lineGutter.style.width = "";
        display.lineNumInnerWidth = Math.max(innerW, display.lineGutter.offsetWidth - padding) + 1;
        display.lineNumWidth = display.lineNumInnerWidth + padding;
        display.lineNumChars = display.lineNumInnerWidth ? last.length : -1;
        display.lineGutter.style.width = display.lineNumWidth + "px";
        (0, update_display_js_1.updateGutterSpace)(cm.display);
        return true;
    }
    return false;
}
exports.maybeUpdateLineNumberWidth = maybeUpdateLineNumberWidth;
