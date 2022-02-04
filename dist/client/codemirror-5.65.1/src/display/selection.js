"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restartBlink = exports.drawSelectionCursor = exports.prepareSelection = exports.updateSelection = void 0;
const pos_js_1 = require("../line/pos.js");
const spans_js_1 = require("../line/spans.js");
const utils_line_js_1 = require("../line/utils_line.js");
const position_measurement_js_1 = require("../measurement/position_measurement.js");
const bidi_js_1 = require("../util/bidi.js");
const dom_js_1 = require("../util/dom.js");
const focus_js_1 = require("./focus.js");
function updateSelection(cm) {
    cm.display.input.showSelection(cm.display.input.prepareSelection());
}
exports.updateSelection = updateSelection;
function prepareSelection(cm, primary = true) {
    let doc = cm.doc, result = {};
    let curFragment = result.cursors = document.createDocumentFragment();
    let selFragment = result.selection = document.createDocumentFragment();
    let customCursor = cm.options.$customCursor;
    if (customCursor)
        primary = true;
    for (let i = 0; i < doc.sel.ranges.length; i++) {
        if (!primary && i == doc.sel.primIndex)
            continue;
        let range = doc.sel.ranges[i];
        if (range.from().line >= cm.display.viewTo || range.to().line < cm.display.viewFrom)
            continue;
        let collapsed = range.empty();
        if (customCursor) {
            let head = customCursor(cm, range);
            if (head)
                drawSelectionCursor(cm, head, curFragment);
        }
        else if (collapsed || cm.options.showCursorWhenSelecting) {
            drawSelectionCursor(cm, range.head, curFragment);
        }
        if (!collapsed)
            drawSelectionRange(cm, range, selFragment);
    }
    return result;
}
exports.prepareSelection = prepareSelection;
// Draws a cursor for the given range
function drawSelectionCursor(cm, head, output) {
    let pos = (0, position_measurement_js_1.cursorCoords)(cm, head, "div", null, null, !cm.options.singleCursorHeightPerLine);
    let cursor = output.appendChild((0, dom_js_1.elt)("div", "\u00a0", "CodeMirror-cursor"));
    cursor.style.left = pos.left + "px";
    cursor.style.top = pos.top + "px";
    cursor.style.height = Math.max(0, pos.bottom - pos.top) * cm.options.cursorHeight + "px";
    if (/\bcm-fat-cursor\b/.test(cm.getWrapperElement().className)) {
        let charPos = (0, position_measurement_js_1.charCoords)(cm, head, "div", null, null);
        let width = charPos.right - charPos.left;
        cursor.style.width = (width > 0 ? width : cm.defaultCharWidth()) + "px";
    }
    if (pos.other) {
        // Secondary cursor, shown when on a 'jump' in bi-directional text
        let otherCursor = output.appendChild((0, dom_js_1.elt)("div", "\u00a0", "CodeMirror-cursor CodeMirror-secondarycursor"));
        otherCursor.style.display = "";
        otherCursor.style.left = pos.other.left + "px";
        otherCursor.style.top = pos.other.top + "px";
        otherCursor.style.height = (pos.other.bottom - pos.other.top) * .85 + "px";
    }
}
exports.drawSelectionCursor = drawSelectionCursor;
function cmpCoords(a, b) { return a.top - b.top || a.left - b.left; }
// Draws the given range as a highlighted selection
function drawSelectionRange(cm, range, output) {
    let display = cm.display, doc = cm.doc;
    let fragment = document.createDocumentFragment();
    let padding = (0, position_measurement_js_1.paddingH)(cm.display), leftSide = padding.left;
    let rightSide = Math.max(display.sizerWidth, (0, position_measurement_js_1.displayWidth)(cm) - display.sizer.offsetLeft) - padding.right;
    let docLTR = doc.direction == "ltr";
    function add(left, top, width, bottom) {
        if (top < 0)
            top = 0;
        top = Math.round(top);
        bottom = Math.round(bottom);
        fragment.appendChild((0, dom_js_1.elt)("div", null, "CodeMirror-selected", `position: absolute; left: ${left}px;
                             top: ${top}px; width: ${width == null ? rightSide - left : width}px;
                             height: ${bottom - top}px`));
    }
    function drawForLine(line, fromArg, toArg) {
        let lineObj = (0, utils_line_js_1.getLine)(doc, line);
        let lineLen = lineObj.text.length;
        let start, end;
        function coords(ch, bias) {
            return (0, position_measurement_js_1.charCoords)(cm, (0, pos_js_1.Pos)(line, ch), "div", lineObj, bias);
        }
        function wrapX(pos, dir, side) {
            let extent = (0, position_measurement_js_1.wrappedLineExtentChar)(cm, lineObj, null, pos);
            let prop = (dir == "ltr") == (side == "after") ? "left" : "right";
            let ch = side == "after" ? extent.begin : extent.end - (/\s/.test(lineObj.text.charAt(extent.end - 1)) ? 2 : 1);
            return coords(ch, prop)[prop];
        }
        let order = (0, bidi_js_1.getOrder)(lineObj, doc.direction);
        (0, bidi_js_1.iterateBidiSections)(order, fromArg || 0, toArg == null ? lineLen : toArg, (from, to, dir, i) => {
            let ltr = dir == "ltr";
            let fromPos = coords(from, ltr ? "left" : "right");
            let toPos = coords(to - 1, ltr ? "right" : "left");
            let openStart = fromArg == null && from == 0, openEnd = toArg == null && to == lineLen;
            let first = i == 0, last = !order || i == order.length - 1;
            if (toPos.top - fromPos.top <= 3) { // Single line
                let openLeft = (docLTR ? openStart : openEnd) && first;
                let openRight = (docLTR ? openEnd : openStart) && last;
                let left = openLeft ? leftSide : (ltr ? fromPos : toPos).left;
                let right = openRight ? rightSide : (ltr ? toPos : fromPos).right;
                add(left, fromPos.top, right - left, fromPos.bottom);
            }
            else { // Multiple lines
                let topLeft, topRight, botLeft, botRight;
                if (ltr) {
                    topLeft = docLTR && openStart && first ? leftSide : fromPos.left;
                    topRight = docLTR ? rightSide : wrapX(from, dir, "before");
                    botLeft = docLTR ? leftSide : wrapX(to, dir, "after");
                    botRight = docLTR && openEnd && last ? rightSide : toPos.right;
                }
                else {
                    topLeft = !docLTR ? leftSide : wrapX(from, dir, "before");
                    topRight = !docLTR && openStart && first ? rightSide : fromPos.right;
                    botLeft = !docLTR && openEnd && last ? leftSide : toPos.left;
                    botRight = !docLTR ? rightSide : wrapX(to, dir, "after");
                }
                add(topLeft, fromPos.top, topRight - topLeft, fromPos.bottom);
                if (fromPos.bottom < toPos.top)
                    add(leftSide, fromPos.bottom, null, toPos.top);
                add(botLeft, toPos.top, botRight - botLeft, toPos.bottom);
            }
            if (!start || cmpCoords(fromPos, start) < 0)
                start = fromPos;
            if (cmpCoords(toPos, start) < 0)
                start = toPos;
            if (!end || cmpCoords(fromPos, end) < 0)
                end = fromPos;
            if (cmpCoords(toPos, end) < 0)
                end = toPos;
        });
        return { start: start, end: end };
    }
    let sFrom = range.from(), sTo = range.to();
    if (sFrom.line == sTo.line) {
        drawForLine(sFrom.line, sFrom.ch, sTo.ch);
    }
    else {
        let fromLine = (0, utils_line_js_1.getLine)(doc, sFrom.line), toLine = (0, utils_line_js_1.getLine)(doc, sTo.line);
        let singleVLine = (0, spans_js_1.visualLine)(fromLine) == (0, spans_js_1.visualLine)(toLine);
        let leftEnd = drawForLine(sFrom.line, sFrom.ch, singleVLine ? fromLine.text.length + 1 : null).end;
        let rightStart = drawForLine(sTo.line, singleVLine ? 0 : null, sTo.ch).start;
        if (singleVLine) {
            if (leftEnd.top < rightStart.top - 2) {
                add(leftEnd.right, leftEnd.top, null, leftEnd.bottom);
                add(leftSide, rightStart.top, rightStart.left, rightStart.bottom);
            }
            else {
                add(leftEnd.right, leftEnd.top, rightStart.left - leftEnd.right, leftEnd.bottom);
            }
        }
        if (leftEnd.bottom < rightStart.top)
            add(leftSide, leftEnd.bottom, null, rightStart.top);
    }
    output.appendChild(fragment);
}
// Cursor-blinking
function restartBlink(cm) {
    if (!cm.state.focused)
        return;
    let display = cm.display;
    clearInterval(display.blinker);
    let on = true;
    display.cursorDiv.style.visibility = "";
    if (cm.options.cursorBlinkRate > 0)
        display.blinker = setInterval(() => {
            if (!cm.hasFocus())
                (0, focus_js_1.onBlur)(cm);
            display.cursorDiv.style.visibility = (on = !on) ? "" : "hidden";
        }, cm.options.cursorBlinkRate);
    else if (cm.options.cursorBlinkRate < 0)
        display.cursorDiv.style.visibility = "hidden";
}
exports.restartBlink = restartBlink;
