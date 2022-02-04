"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGutters = exports.renderGutters = exports.getGutters = void 0;
const dom_js_1 = require("../util/dom.js");
const view_tracking_js_1 = require("./view_tracking.js");
const line_numbers_js_1 = require("./line_numbers.js");
const update_display_js_1 = require("./update_display.js");
function getGutters(gutters, lineNumbers) {
    let result = [], sawLineNumbers = false;
    for (let i = 0; i < gutters.length; i++) {
        let name = gutters[i], style = null;
        if (typeof name != "string") {
            style = name.style;
            name = name.className;
        }
        if (name == "CodeMirror-linenumbers") {
            if (!lineNumbers)
                continue;
            else
                sawLineNumbers = true;
        }
        result.push({ className: name, style });
    }
    if (lineNumbers && !sawLineNumbers)
        result.push({ className: "CodeMirror-linenumbers", style: null });
    return result;
}
exports.getGutters = getGutters;
// Rebuild the gutter elements, ensure the margin to the left of the
// code matches their width.
function renderGutters(display) {
    let gutters = display.gutters, specs = display.gutterSpecs;
    (0, dom_js_1.removeChildren)(gutters);
    display.lineGutter = null;
    for (let i = 0; i < specs.length; ++i) {
        let { className, style } = specs[i];
        let gElt = gutters.appendChild((0, dom_js_1.elt)("div", null, "CodeMirror-gutter " + className));
        if (style)
            gElt.style.cssText = style;
        if (className == "CodeMirror-linenumbers") {
            display.lineGutter = gElt;
            gElt.style.width = (display.lineNumWidth || 1) + "px";
        }
    }
    gutters.style.display = specs.length ? "" : "none";
    (0, update_display_js_1.updateGutterSpace)(display);
}
exports.renderGutters = renderGutters;
function updateGutters(cm) {
    renderGutters(cm.display);
    (0, view_tracking_js_1.regChange)(cm);
    (0, line_numbers_js_1.alignHorizontally)(cm);
}
exports.updateGutters = updateGutters;
