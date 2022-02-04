"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDocumentHeight = exports.updateGutterSpace = exports.updateDisplaySimple = exports.postUpdateDisplay = exports.updateDisplayIfNeeded = exports.maybeClipScrollbars = exports.DisplayUpdate = void 0;
const saw_special_spans_js_1 = require("../line/saw_special_spans.js");
const spans_js_1 = require("../line/spans.js");
const utils_line_js_1 = require("../line/utils_line.js");
const position_measurement_js_1 = require("../measurement/position_measurement.js");
const browser_js_1 = require("../util/browser.js");
const dom_js_1 = require("../util/dom.js");
const event_js_1 = require("../util/event.js");
const operation_group_js_1 = require("../util/operation_group.js");
const misc_js_1 = require("../util/misc.js");
const update_line_js_1 = require("./update_line.js");
const highlight_worker_js_1 = require("./highlight_worker.js");
const line_numbers_js_1 = require("./line_numbers.js");
const scrollbars_js_1 = require("./scrollbars.js");
const selection_js_1 = require("./selection.js");
const update_lines_js_1 = require("./update_lines.js");
const view_tracking_js_1 = require("./view_tracking.js");
// DISPLAY DRAWING
class DisplayUpdate {
    constructor(cm, viewport, force) {
        let display = cm.display;
        this.viewport = viewport;
        // Store some values that we'll need later (but don't want to force a relayout for)
        this.visible = (0, update_lines_js_1.visibleLines)(display, cm.doc, viewport);
        this.editorIsHidden = !display.wrapper.offsetWidth;
        this.wrapperHeight = display.wrapper.clientHeight;
        this.wrapperWidth = display.wrapper.clientWidth;
        this.oldDisplayWidth = (0, position_measurement_js_1.displayWidth)(cm);
        this.force = force;
        this.dims = (0, position_measurement_js_1.getDimensions)(cm);
        this.events = [];
    }
    signal(emitter, type) {
        if ((0, event_js_1.hasHandler)(emitter, type))
            this.events.push(arguments);
    }
    finish() {
        for (let i = 0; i < this.events.length; i++)
            event_js_1.signal.apply(null, this.events[i]);
    }
}
exports.DisplayUpdate = DisplayUpdate;
function maybeClipScrollbars(cm) {
    let display = cm.display;
    if (!display.scrollbarsClipped && display.scroller.offsetWidth) {
        display.nativeBarWidth = display.scroller.offsetWidth - display.scroller.clientWidth;
        display.heightForcer.style.height = (0, position_measurement_js_1.scrollGap)(cm) + "px";
        display.sizer.style.marginBottom = -display.nativeBarWidth + "px";
        display.sizer.style.borderRightWidth = (0, position_measurement_js_1.scrollGap)(cm) + "px";
        display.scrollbarsClipped = true;
    }
}
exports.maybeClipScrollbars = maybeClipScrollbars;
function selectionSnapshot(cm) {
    if (cm.hasFocus())
        return null;
    let active = (0, dom_js_1.activeElt)();
    if (!active || !(0, dom_js_1.contains)(cm.display.lineDiv, active))
        return null;
    let result = { activeElt: active };
    if (window.getSelection) {
        let sel = window.getSelection();
        if (sel.anchorNode && sel.extend && (0, dom_js_1.contains)(cm.display.lineDiv, sel.anchorNode)) {
            result.anchorNode = sel.anchorNode;
            result.anchorOffset = sel.anchorOffset;
            result.focusNode = sel.focusNode;
            result.focusOffset = sel.focusOffset;
        }
    }
    return result;
}
function restoreSelection(snapshot) {
    if (!snapshot || !snapshot.activeElt || snapshot.activeElt == (0, dom_js_1.activeElt)())
        return;
    snapshot.activeElt.focus();
    if (!/^(INPUT|TEXTAREA)$/.test(snapshot.activeElt.nodeName) &&
        snapshot.anchorNode && (0, dom_js_1.contains)(document.body, snapshot.anchorNode) && (0, dom_js_1.contains)(document.body, snapshot.focusNode)) {
        let sel = window.getSelection(), range = document.createRange();
        range.setEnd(snapshot.anchorNode, snapshot.anchorOffset);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        sel.extend(snapshot.focusNode, snapshot.focusOffset);
    }
}
// Does the actual updating of the line display. Bails out
// (returning false) when there is nothing to be done and forced is
// false.
function updateDisplayIfNeeded(cm, update) {
    let display = cm.display, doc = cm.doc;
    if (update.editorIsHidden) {
        (0, view_tracking_js_1.resetView)(cm);
        return false;
    }
    // Bail out if the visible area is already rendered and nothing changed.
    if (!update.force &&
        update.visible.from >= display.viewFrom && update.visible.to <= display.viewTo &&
        (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo) &&
        display.renderedView == display.view && (0, view_tracking_js_1.countDirtyView)(cm) == 0)
        return false;
    if ((0, line_numbers_js_1.maybeUpdateLineNumberWidth)(cm)) {
        (0, view_tracking_js_1.resetView)(cm);
        update.dims = (0, position_measurement_js_1.getDimensions)(cm);
    }
    // Compute a suitable new viewport (from & to)
    let end = doc.first + doc.size;
    let from = Math.max(update.visible.from - cm.options.viewportMargin, doc.first);
    let to = Math.min(end, update.visible.to + cm.options.viewportMargin);
    if (display.viewFrom < from && from - display.viewFrom < 20)
        from = Math.max(doc.first, display.viewFrom);
    if (display.viewTo > to && display.viewTo - to < 20)
        to = Math.min(end, display.viewTo);
    if (saw_special_spans_js_1.sawCollapsedSpans) {
        from = (0, spans_js_1.visualLineNo)(cm.doc, from);
        to = (0, spans_js_1.visualLineEndNo)(cm.doc, to);
    }
    let different = from != display.viewFrom || to != display.viewTo ||
        display.lastWrapHeight != update.wrapperHeight || display.lastWrapWidth != update.wrapperWidth;
    (0, view_tracking_js_1.adjustView)(cm, from, to);
    display.viewOffset = (0, spans_js_1.heightAtLine)((0, utils_line_js_1.getLine)(cm.doc, display.viewFrom));
    // Position the mover div to align with the current scroll position
    cm.display.mover.style.top = display.viewOffset + "px";
    let toUpdate = (0, view_tracking_js_1.countDirtyView)(cm);
    if (!different && toUpdate == 0 && !update.force && display.renderedView == display.view &&
        (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo))
        return false;
    // For big changes, we hide the enclosing element during the
    // update, since that speeds up the operations on most browsers.
    let selSnapshot = selectionSnapshot(cm);
    if (toUpdate > 4)
        display.lineDiv.style.display = "none";
    patchDisplay(cm, display.updateLineNumbers, update.dims);
    if (toUpdate > 4)
        display.lineDiv.style.display = "";
    display.renderedView = display.view;
    // There might have been a widget with a focused element that got
    // hidden or updated, if so re-focus it.
    restoreSelection(selSnapshot);
    // Prevent selection and cursors from interfering with the scroll
    // width and height.
    (0, dom_js_1.removeChildren)(display.cursorDiv);
    (0, dom_js_1.removeChildren)(display.selectionDiv);
    display.gutters.style.height = display.sizer.style.minHeight = 0;
    if (different) {
        display.lastWrapHeight = update.wrapperHeight;
        display.lastWrapWidth = update.wrapperWidth;
        (0, highlight_worker_js_1.startWorker)(cm, 400);
    }
    display.updateLineNumbers = null;
    return true;
}
exports.updateDisplayIfNeeded = updateDisplayIfNeeded;
function postUpdateDisplay(cm, update) {
    let viewport = update.viewport;
    for (let first = true;; first = false) {
        if (!first || !cm.options.lineWrapping || update.oldDisplayWidth == (0, position_measurement_js_1.displayWidth)(cm)) {
            // Clip forced viewport to actual scrollable area.
            if (viewport && viewport.top != null)
                viewport = { top: Math.min(cm.doc.height + (0, position_measurement_js_1.paddingVert)(cm.display) - (0, position_measurement_js_1.displayHeight)(cm), viewport.top) };
            // Updated line heights might result in the drawn area not
            // actually covering the viewport. Keep looping until it does.
            update.visible = (0, update_lines_js_1.visibleLines)(cm.display, cm.doc, viewport);
            if (update.visible.from >= cm.display.viewFrom && update.visible.to <= cm.display.viewTo)
                break;
        }
        else if (first) {
            update.visible = (0, update_lines_js_1.visibleLines)(cm.display, cm.doc, viewport);
        }
        if (!updateDisplayIfNeeded(cm, update))
            break;
        (0, update_lines_js_1.updateHeightsInViewport)(cm);
        let barMeasure = (0, scrollbars_js_1.measureForScrollbars)(cm);
        (0, selection_js_1.updateSelection)(cm);
        (0, scrollbars_js_1.updateScrollbars)(cm, barMeasure);
        setDocumentHeight(cm, barMeasure);
        update.force = false;
    }
    update.signal(cm, "update", cm);
    if (cm.display.viewFrom != cm.display.reportedViewFrom || cm.display.viewTo != cm.display.reportedViewTo) {
        update.signal(cm, "viewportChange", cm, cm.display.viewFrom, cm.display.viewTo);
        cm.display.reportedViewFrom = cm.display.viewFrom;
        cm.display.reportedViewTo = cm.display.viewTo;
    }
}
exports.postUpdateDisplay = postUpdateDisplay;
function updateDisplaySimple(cm, viewport) {
    let update = new DisplayUpdate(cm, viewport);
    if (updateDisplayIfNeeded(cm, update)) {
        (0, update_lines_js_1.updateHeightsInViewport)(cm);
        postUpdateDisplay(cm, update);
        let barMeasure = (0, scrollbars_js_1.measureForScrollbars)(cm);
        (0, selection_js_1.updateSelection)(cm);
        (0, scrollbars_js_1.updateScrollbars)(cm, barMeasure);
        setDocumentHeight(cm, barMeasure);
        update.finish();
    }
}
exports.updateDisplaySimple = updateDisplaySimple;
// Sync the actual display DOM structure with display.view, removing
// nodes for lines that are no longer in view, and creating the ones
// that are not there yet, and updating the ones that are out of
// date.
function patchDisplay(cm, updateNumbersFrom, dims) {
    let display = cm.display, lineNumbers = cm.options.lineNumbers;
    let container = display.lineDiv, cur = container.firstChild;
    function rm(node) {
        let next = node.nextSibling;
        // Works around a throw-scroll bug in OS X Webkit
        if (browser_js_1.webkit && browser_js_1.mac && cm.display.currentWheelTarget == node)
            node.style.display = "none";
        else
            node.parentNode.removeChild(node);
        return next;
    }
    let view = display.view, lineN = display.viewFrom;
    // Loop over the elements in the view, syncing cur (the DOM nodes
    // in display.lineDiv) with the view as we go.
    for (let i = 0; i < view.length; i++) {
        let lineView = view[i];
        if (lineView.hidden) {
        }
        else if (!lineView.node || lineView.node.parentNode != container) { // Not drawn yet
            let node = (0, update_line_js_1.buildLineElement)(cm, lineView, lineN, dims);
            container.insertBefore(node, cur);
        }
        else { // Already drawn
            while (cur != lineView.node)
                cur = rm(cur);
            let updateNumber = lineNumbers && updateNumbersFrom != null &&
                updateNumbersFrom <= lineN && lineView.lineNumber;
            if (lineView.changes) {
                if ((0, misc_js_1.indexOf)(lineView.changes, "gutter") > -1)
                    updateNumber = false;
                (0, update_line_js_1.updateLineForChanges)(cm, lineView, lineN, dims);
            }
            if (updateNumber) {
                (0, dom_js_1.removeChildren)(lineView.lineNumber);
                lineView.lineNumber.appendChild(document.createTextNode((0, utils_line_js_1.lineNumberFor)(cm.options, lineN)));
            }
            cur = lineView.node.nextSibling;
        }
        lineN += lineView.size;
    }
    while (cur)
        cur = rm(cur);
}
function updateGutterSpace(display) {
    let width = display.gutters.offsetWidth;
    display.sizer.style.marginLeft = width + "px";
    // Send an event to consumers responding to changes in gutter width.
    (0, operation_group_js_1.signalLater)(display, "gutterChanged", display);
}
exports.updateGutterSpace = updateGutterSpace;
function setDocumentHeight(cm, measure) {
    cm.display.sizer.style.minHeight = measure.docHeight + "px";
    cm.display.heightForcer.style.top = measure.docHeight + "px";
    cm.display.gutters.style.height = (measure.docHeight + cm.display.barHeight + (0, position_measurement_js_1.scrollGap)(cm)) + "px";
}
exports.setDocumentHeight = setDocumentHeight;
