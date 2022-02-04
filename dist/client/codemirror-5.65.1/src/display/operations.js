"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.docMethodOp = exports.methodOp = exports.operation = exports.runInOp = exports.endOperation = exports.startOperation = void 0;
const pos_js_1 = require("../line/pos.js");
const spans_js_1 = require("../line/spans.js");
const position_measurement_js_1 = require("../measurement/position_measurement.js");
const event_js_1 = require("../util/event.js");
const dom_js_1 = require("../util/dom.js");
const operation_group_js_1 = require("../util/operation_group.js");
const focus_js_1 = require("./focus.js");
const scrollbars_js_1 = require("./scrollbars.js");
const selection_js_1 = require("./selection.js");
const scrolling_js_1 = require("./scrolling.js");
const update_display_js_1 = require("./update_display.js");
const update_lines_js_1 = require("./update_lines.js");
// Operations are used to wrap a series of changes to the editor
// state in such a way that each change won't have to update the
// cursor and display (which would be awkward, slow, and
// error-prone). Instead, display updates are batched and then all
// combined and executed at once.
let nextOpId = 0;
// Start a new operation.
function startOperation(cm) {
    cm.curOp = {
        cm: cm,
        viewChanged: false,
        startHeight: cm.doc.height,
        forceUpdate: false,
        updateInput: 0,
        typing: false,
        changeObjs: null,
        cursorActivityHandlers: null,
        cursorActivityCalled: 0,
        selectionChanged: false,
        updateMaxLine: false,
        scrollLeft: null, scrollTop: null,
        scrollToPos: null,
        focus: false,
        id: ++nextOpId,
        markArrays: null // Used by addMarkedSpan
    };
    (0, operation_group_js_1.pushOperation)(cm.curOp);
}
exports.startOperation = startOperation;
// Finish an operation, updating the display and signalling delayed events
function endOperation(cm) {
    let op = cm.curOp;
    if (op)
        (0, operation_group_js_1.finishOperation)(op, group => {
            for (let i = 0; i < group.ops.length; i++)
                group.ops[i].cm.curOp = null;
            endOperations(group);
        });
}
exports.endOperation = endOperation;
// The DOM updates done when an operation finishes are batched so
// that the minimum number of relayouts are required.
function endOperations(group) {
    let ops = group.ops;
    for (let i = 0; i < ops.length; i++) // Read DOM
        endOperation_R1(ops[i]);
    for (let i = 0; i < ops.length; i++) // Write DOM (maybe)
        endOperation_W1(ops[i]);
    for (let i = 0; i < ops.length; i++) // Read DOM
        endOperation_R2(ops[i]);
    for (let i = 0; i < ops.length; i++) // Write DOM (maybe)
        endOperation_W2(ops[i]);
    for (let i = 0; i < ops.length; i++) // Read DOM
        endOperation_finish(ops[i]);
}
function endOperation_R1(op) {
    let cm = op.cm, display = cm.display;
    (0, update_display_js_1.maybeClipScrollbars)(cm);
    if (op.updateMaxLine)
        (0, spans_js_1.findMaxLine)(cm);
    op.mustUpdate = op.viewChanged || op.forceUpdate || op.scrollTop != null ||
        op.scrollToPos && (op.scrollToPos.from.line < display.viewFrom ||
            op.scrollToPos.to.line >= display.viewTo) ||
        display.maxLineChanged && cm.options.lineWrapping;
    op.update = op.mustUpdate &&
        new update_display_js_1.DisplayUpdate(cm, op.mustUpdate && { top: op.scrollTop, ensure: op.scrollToPos }, op.forceUpdate);
}
function endOperation_W1(op) {
    op.updatedDisplay = op.mustUpdate && (0, update_display_js_1.updateDisplayIfNeeded)(op.cm, op.update);
}
function endOperation_R2(op) {
    let cm = op.cm, display = cm.display;
    if (op.updatedDisplay)
        (0, update_lines_js_1.updateHeightsInViewport)(cm);
    op.barMeasure = (0, scrollbars_js_1.measureForScrollbars)(cm);
    // If the max line changed since it was last measured, measure it,
    // and ensure the document's width matches it.
    // updateDisplay_W2 will use these properties to do the actual resizing
    if (display.maxLineChanged && !cm.options.lineWrapping) {
        op.adjustWidthTo = (0, position_measurement_js_1.measureChar)(cm, display.maxLine, display.maxLine.text.length).left + 3;
        cm.display.sizerWidth = op.adjustWidthTo;
        op.barMeasure.scrollWidth =
            Math.max(display.scroller.clientWidth, display.sizer.offsetLeft + op.adjustWidthTo + (0, position_measurement_js_1.scrollGap)(cm) + cm.display.barWidth);
        op.maxScrollLeft = Math.max(0, display.sizer.offsetLeft + op.adjustWidthTo - (0, position_measurement_js_1.displayWidth)(cm));
    }
    if (op.updatedDisplay || op.selectionChanged)
        op.preparedSelection = display.input.prepareSelection();
}
function endOperation_W2(op) {
    let cm = op.cm;
    if (op.adjustWidthTo != null) {
        cm.display.sizer.style.minWidth = op.adjustWidthTo + "px";
        if (op.maxScrollLeft < cm.doc.scrollLeft)
            (0, scrolling_js_1.setScrollLeft)(cm, Math.min(cm.display.scroller.scrollLeft, op.maxScrollLeft), true);
        cm.display.maxLineChanged = false;
    }
    let takeFocus = op.focus && op.focus == (0, dom_js_1.activeElt)();
    if (op.preparedSelection)
        cm.display.input.showSelection(op.preparedSelection, takeFocus);
    if (op.updatedDisplay || op.startHeight != cm.doc.height)
        (0, scrollbars_js_1.updateScrollbars)(cm, op.barMeasure);
    if (op.updatedDisplay)
        (0, update_display_js_1.setDocumentHeight)(cm, op.barMeasure);
    if (op.selectionChanged)
        (0, selection_js_1.restartBlink)(cm);
    if (cm.state.focused && op.updateInput)
        cm.display.input.reset(op.typing);
    if (takeFocus)
        (0, focus_js_1.ensureFocus)(op.cm);
}
function endOperation_finish(op) {
    let cm = op.cm, display = cm.display, doc = cm.doc;
    if (op.updatedDisplay)
        (0, update_display_js_1.postUpdateDisplay)(cm, op.update);
    // Abort mouse wheel delta measurement, when scrolling explicitly
    if (display.wheelStartX != null && (op.scrollTop != null || op.scrollLeft != null || op.scrollToPos))
        display.wheelStartX = display.wheelStartY = null;
    // Propagate the scroll position to the actual DOM scroller
    if (op.scrollTop != null)
        (0, scrolling_js_1.setScrollTop)(cm, op.scrollTop, op.forceScroll);
    if (op.scrollLeft != null)
        (0, scrolling_js_1.setScrollLeft)(cm, op.scrollLeft, true, true);
    // If we need to scroll a specific position into view, do so.
    if (op.scrollToPos) {
        let rect = (0, scrolling_js_1.scrollPosIntoView)(cm, (0, pos_js_1.clipPos)(doc, op.scrollToPos.from), (0, pos_js_1.clipPos)(doc, op.scrollToPos.to), op.scrollToPos.margin);
        (0, scrolling_js_1.maybeScrollWindow)(cm, rect);
    }
    // Fire events for markers that are hidden/unidden by editing or
    // undoing
    let hidden = op.maybeHiddenMarkers, unhidden = op.maybeUnhiddenMarkers;
    if (hidden)
        for (let i = 0; i < hidden.length; ++i)
            if (!hidden[i].lines.length)
                (0, event_js_1.signal)(hidden[i], "hide");
    if (unhidden)
        for (let i = 0; i < unhidden.length; ++i)
            if (unhidden[i].lines.length)
                (0, event_js_1.signal)(unhidden[i], "unhide");
    if (display.wrapper.offsetHeight)
        doc.scrollTop = cm.display.scroller.scrollTop;
    // Fire change events, and delayed event handlers
    if (op.changeObjs)
        (0, event_js_1.signal)(cm, "changes", cm, op.changeObjs);
    if (op.update)
        op.update.finish();
}
// Run the given function in an operation
function runInOp(cm, f) {
    if (cm.curOp)
        return f();
    startOperation(cm);
    try {
        return f();
    }
    finally {
        endOperation(cm);
    }
}
exports.runInOp = runInOp;
// Wraps a function in an operation. Returns the wrapped function.
function operation(cm, f) {
    return function () {
        if (cm.curOp)
            return f.apply(cm, arguments);
        startOperation(cm);
        try {
            return f.apply(cm, arguments);
        }
        finally {
            endOperation(cm);
        }
    };
}
exports.operation = operation;
// Used to add methods to editor and doc instances, wrapping them in
// operations.
function methodOp(f) {
    return function () {
        if (this.curOp)
            return f.apply(this, arguments);
        startOperation(this);
        try {
            return f.apply(this, arguments);
        }
        finally {
            endOperation(this);
        }
    };
}
exports.methodOp = methodOp;
function docMethodOp(f) {
    return function () {
        let cm = this.cm;
        if (!cm || cm.curOp)
            return f.apply(this, arguments);
        startOperation(cm);
        try {
            return f.apply(this, arguments);
        }
        finally {
            endOperation(cm);
        }
    };
}
exports.docMethodOp = docMethodOp;
