"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visibleLines = exports.updateHeightsInViewport = void 0;
const spans_js_1 = require("../line/spans.js");
const utils_line_js_1 = require("../line/utils_line.js");
const position_measurement_js_1 = require("../measurement/position_measurement.js");
const browser_js_1 = require("../util/browser.js");
// Read the actual heights of the rendered lines, and update their
// stored heights to match.
function updateHeightsInViewport(cm) {
    let display = cm.display;
    let prevBottom = display.lineDiv.offsetTop;
    let viewTop = Math.max(0, display.scroller.getBoundingClientRect().top);
    let oldHeight = display.lineDiv.getBoundingClientRect().top;
    let mustScroll = 0;
    for (let i = 0; i < display.view.length; i++) {
        let cur = display.view[i], wrapping = cm.options.lineWrapping;
        let height, width = 0;
        if (cur.hidden)
            continue;
        oldHeight += cur.line.height;
        if (browser_js_1.ie && browser_js_1.ie_version < 8) {
            let bot = cur.node.offsetTop + cur.node.offsetHeight;
            height = bot - prevBottom;
            prevBottom = bot;
        }
        else {
            let box = cur.node.getBoundingClientRect();
            height = box.bottom - box.top;
            // Check that lines don't extend past the right of the current
            // editor width
            if (!wrapping && cur.text.firstChild)
                width = cur.text.firstChild.getBoundingClientRect().right - box.left - 1;
        }
        let diff = cur.line.height - height;
        if (diff > .005 || diff < -.005) {
            if (oldHeight < viewTop)
                mustScroll -= diff;
            (0, utils_line_js_1.updateLineHeight)(cur.line, height);
            updateWidgetHeight(cur.line);
            if (cur.rest)
                for (let j = 0; j < cur.rest.length; j++)
                    updateWidgetHeight(cur.rest[j]);
        }
        if (width > cm.display.sizerWidth) {
            let chWidth = Math.ceil(width / (0, position_measurement_js_1.charWidth)(cm.display));
            if (chWidth > cm.display.maxLineLength) {
                cm.display.maxLineLength = chWidth;
                cm.display.maxLine = cur.line;
                cm.display.maxLineChanged = true;
            }
        }
    }
    if (Math.abs(mustScroll) > 2)
        display.scroller.scrollTop += mustScroll;
}
exports.updateHeightsInViewport = updateHeightsInViewport;
// Read and store the height of line widgets associated with the
// given line.
function updateWidgetHeight(line) {
    if (line.widgets)
        for (let i = 0; i < line.widgets.length; ++i) {
            let w = line.widgets[i], parent = w.node.parentNode;
            if (parent)
                w.height = parent.offsetHeight;
        }
}
// Compute the lines that are visible in a given viewport (defaults
// the the current scroll position). viewport may contain top,
// height, and ensure (see op.scrollToPos) properties.
function visibleLines(display, doc, viewport) {
    let top = viewport && viewport.top != null ? Math.max(0, viewport.top) : display.scroller.scrollTop;
    top = Math.floor(top - (0, position_measurement_js_1.paddingTop)(display));
    let bottom = viewport && viewport.bottom != null ? viewport.bottom : top + display.wrapper.clientHeight;
    let from = (0, utils_line_js_1.lineAtHeight)(doc, top), to = (0, utils_line_js_1.lineAtHeight)(doc, bottom);
    // Ensure is a {from: {line, ch}, to: {line, ch}} object, and
    // forces those lines into the viewport (if possible).
    if (viewport && viewport.ensure) {
        let ensureFrom = viewport.ensure.from.line, ensureTo = viewport.ensure.to.line;
        if (ensureFrom < from) {
            from = ensureFrom;
            to = (0, utils_line_js_1.lineAtHeight)(doc, (0, spans_js_1.heightAtLine)((0, utils_line_js_1.getLine)(doc, ensureFrom)) + display.wrapper.clientHeight);
        }
        else if (Math.min(ensureTo, doc.lastLine()) >= to) {
            from = (0, utils_line_js_1.lineAtHeight)(doc, (0, spans_js_1.heightAtLine)((0, utils_line_js_1.getLine)(doc, ensureTo)) - display.wrapper.clientHeight);
            to = ensureTo;
        }
    }
    return { from: from, to: Math.max(to, from + 1) };
}
exports.visibleLines = visibleLines;
