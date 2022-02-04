"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detachSharedMarkers = exports.copySharedMarkers = exports.findSharedMarkers = exports.SharedTextMarker = exports.markText = exports.TextMarker = void 0;
const dom_js_1 = require("../util/dom.js");
const event_js_1 = require("../util/event.js");
const operations_js_1 = require("../display/operations.js");
const pos_js_1 = require("../line/pos.js");
const utils_line_js_1 = require("../line/utils_line.js");
const position_measurement_js_1 = require("../measurement/position_measurement.js");
const saw_special_spans_js_1 = require("../line/saw_special_spans.js");
const spans_js_1 = require("../line/spans.js");
const misc_js_1 = require("../util/misc.js");
const operation_group_js_1 = require("../util/operation_group.js");
const widgets_js_1 = require("../measurement/widgets.js");
const view_tracking_js_1 = require("../display/view_tracking.js");
const document_data_js_1 = require("./document_data.js");
const history_js_1 = require("./history.js");
const selection_updates_js_1 = require("./selection_updates.js");
// TEXTMARKERS
// Created with markText and setBookmark methods. A TextMarker is a
// handle that can be used to clear or find a marked position in the
// document. Line objects hold arrays (markedSpans) containing
// {from, to, marker} object pointing to such marker objects, and
// indicating that such a marker is present on that line. Multiple
// lines may point to the same marker when it spans across lines.
// The spans will have null for their from/to properties when the
// marker continues beyond the start/end of the line. Markers have
// links back to the lines they currently touch.
// Collapsed markers have unique ids, in order to be able to order
// them, which is needed for uniquely determining an outer marker
// when they overlap (they may nest, but not partially overlap).
let nextMarkerId = 0;
class TextMarker {
    constructor(doc, type) {
        this.lines = [];
        this.type = type;
        this.doc = doc;
        this.id = ++nextMarkerId;
    }
    // Clear the marker.
    clear() {
        if (this.explicitlyCleared)
            return;
        let cm = this.doc.cm, withOp = cm && !cm.curOp;
        if (withOp)
            (0, operations_js_1.startOperation)(cm);
        if ((0, event_js_1.hasHandler)(this, "clear")) {
            let found = this.find();
            if (found)
                (0, operation_group_js_1.signalLater)(this, "clear", found.from, found.to);
        }
        let min = null, max = null;
        for (let i = 0; i < this.lines.length; ++i) {
            let line = this.lines[i];
            let span = (0, spans_js_1.getMarkedSpanFor)(line.markedSpans, this);
            if (cm && !this.collapsed)
                (0, view_tracking_js_1.regLineChange)(cm, (0, utils_line_js_1.lineNo)(line), "text");
            else if (cm) {
                if (span.to != null)
                    max = (0, utils_line_js_1.lineNo)(line);
                if (span.from != null)
                    min = (0, utils_line_js_1.lineNo)(line);
            }
            line.markedSpans = (0, spans_js_1.removeMarkedSpan)(line.markedSpans, span);
            if (span.from == null && this.collapsed && !(0, spans_js_1.lineIsHidden)(this.doc, line) && cm)
                (0, utils_line_js_1.updateLineHeight)(line, (0, position_measurement_js_1.textHeight)(cm.display));
        }
        if (cm && this.collapsed && !cm.options.lineWrapping)
            for (let i = 0; i < this.lines.length; ++i) {
                let visual = (0, spans_js_1.visualLine)(this.lines[i]), len = (0, spans_js_1.lineLength)(visual);
                if (len > cm.display.maxLineLength) {
                    cm.display.maxLine = visual;
                    cm.display.maxLineLength = len;
                    cm.display.maxLineChanged = true;
                }
            }
        if (min != null && cm && this.collapsed)
            (0, view_tracking_js_1.regChange)(cm, min, max + 1);
        this.lines.length = 0;
        this.explicitlyCleared = true;
        if (this.atomic && this.doc.cantEdit) {
            this.doc.cantEdit = false;
            if (cm)
                (0, selection_updates_js_1.reCheckSelection)(cm.doc);
        }
        if (cm)
            (0, operation_group_js_1.signalLater)(cm, "markerCleared", cm, this, min, max);
        if (withOp)
            (0, operations_js_1.endOperation)(cm);
        if (this.parent)
            this.parent.clear();
    }
    // Find the position of the marker in the document. Returns a {from,
    // to} object by default. Side can be passed to get a specific side
    // -- 0 (both), -1 (left), or 1 (right). When lineObj is true, the
    // Pos objects returned contain a line object, rather than a line
    // number (used to prevent looking up the same line twice).
    find(side, lineObj) {
        if (side == null && this.type == "bookmark")
            side = 1;
        let from, to;
        for (let i = 0; i < this.lines.length; ++i) {
            let line = this.lines[i];
            let span = (0, spans_js_1.getMarkedSpanFor)(line.markedSpans, this);
            if (span.from != null) {
                from = (0, pos_js_1.Pos)(lineObj ? line : (0, utils_line_js_1.lineNo)(line), span.from);
                if (side == -1)
                    return from;
            }
            if (span.to != null) {
                to = (0, pos_js_1.Pos)(lineObj ? line : (0, utils_line_js_1.lineNo)(line), span.to);
                if (side == 1)
                    return to;
            }
        }
        return from && { from: from, to: to };
    }
    // Signals that the marker's widget changed, and surrounding layout
    // should be recomputed.
    changed() {
        let pos = this.find(-1, true), widget = this, cm = this.doc.cm;
        if (!pos || !cm)
            return;
        (0, operations_js_1.runInOp)(cm, () => {
            let line = pos.line, lineN = (0, utils_line_js_1.lineNo)(pos.line);
            let view = (0, position_measurement_js_1.findViewForLine)(cm, lineN);
            if (view) {
                (0, position_measurement_js_1.clearLineMeasurementCacheFor)(view);
                cm.curOp.selectionChanged = cm.curOp.forceUpdate = true;
            }
            cm.curOp.updateMaxLine = true;
            if (!(0, spans_js_1.lineIsHidden)(widget.doc, line) && widget.height != null) {
                let oldHeight = widget.height;
                widget.height = null;
                let dHeight = (0, widgets_js_1.widgetHeight)(widget) - oldHeight;
                if (dHeight)
                    (0, utils_line_js_1.updateLineHeight)(line, line.height + dHeight);
            }
            (0, operation_group_js_1.signalLater)(cm, "markerChanged", cm, this);
        });
    }
    attachLine(line) {
        if (!this.lines.length && this.doc.cm) {
            let op = this.doc.cm.curOp;
            if (!op.maybeHiddenMarkers || (0, misc_js_1.indexOf)(op.maybeHiddenMarkers, this) == -1)
                (op.maybeUnhiddenMarkers || (op.maybeUnhiddenMarkers = [])).push(this);
        }
        this.lines.push(line);
    }
    detachLine(line) {
        this.lines.splice((0, misc_js_1.indexOf)(this.lines, line), 1);
        if (!this.lines.length && this.doc.cm) {
            let op = this.doc.cm.curOp;
            (op.maybeHiddenMarkers || (op.maybeHiddenMarkers = [])).push(this);
        }
    }
}
exports.TextMarker = TextMarker;
(0, event_js_1.eventMixin)(TextMarker);
// Create a marker, wire it up to the right lines, and
function markText(doc, from, to, options, type) {
    // Shared markers (across linked documents) are handled separately
    // (markTextShared will call out to this again, once per
    // document).
    if (options && options.shared)
        return markTextShared(doc, from, to, options, type);
    // Ensure we are in an operation.
    if (doc.cm && !doc.cm.curOp)
        return (0, operations_js_1.operation)(doc.cm, markText)(doc, from, to, options, type);
    let marker = new TextMarker(doc, type), diff = (0, pos_js_1.cmp)(from, to);
    if (options)
        (0, misc_js_1.copyObj)(options, marker, false);
    // Don't connect empty markers unless clearWhenEmpty is false
    if (diff > 0 || diff == 0 && marker.clearWhenEmpty !== false)
        return marker;
    if (marker.replacedWith) {
        // Showing up as a widget implies collapsed (widget replaces text)
        marker.collapsed = true;
        marker.widgetNode = (0, dom_js_1.eltP)("span", [marker.replacedWith], "CodeMirror-widget");
        if (!options.handleMouseEvents)
            marker.widgetNode.setAttribute("cm-ignore-events", "true");
        if (options.insertLeft)
            marker.widgetNode.insertLeft = true;
    }
    if (marker.collapsed) {
        if ((0, spans_js_1.conflictingCollapsedRange)(doc, from.line, from, to, marker) ||
            from.line != to.line && (0, spans_js_1.conflictingCollapsedRange)(doc, to.line, from, to, marker))
            throw new Error("Inserting collapsed marker partially overlapping an existing one");
        (0, saw_special_spans_js_1.seeCollapsedSpans)();
    }
    if (marker.addToHistory)
        (0, history_js_1.addChangeToHistory)(doc, { from: from, to: to, origin: "markText" }, doc.sel, NaN);
    let curLine = from.line, cm = doc.cm, updateMaxLine;
    doc.iter(curLine, to.line + 1, line => {
        if (cm && marker.collapsed && !cm.options.lineWrapping && (0, spans_js_1.visualLine)(line) == cm.display.maxLine)
            updateMaxLine = true;
        if (marker.collapsed && curLine != from.line)
            (0, utils_line_js_1.updateLineHeight)(line, 0);
        (0, spans_js_1.addMarkedSpan)(line, new spans_js_1.MarkedSpan(marker, curLine == from.line ? from.ch : null, curLine == to.line ? to.ch : null), doc.cm && doc.cm.curOp);
        ++curLine;
    });
    // lineIsHidden depends on the presence of the spans, so needs a second pass
    if (marker.collapsed)
        doc.iter(from.line, to.line + 1, line => {
            if ((0, spans_js_1.lineIsHidden)(doc, line))
                (0, utils_line_js_1.updateLineHeight)(line, 0);
        });
    if (marker.clearOnEnter)
        (0, event_js_1.on)(marker, "beforeCursorEnter", () => marker.clear());
    if (marker.readOnly) {
        (0, saw_special_spans_js_1.seeReadOnlySpans)();
        if (doc.history.done.length || doc.history.undone.length)
            doc.clearHistory();
    }
    if (marker.collapsed) {
        marker.id = ++nextMarkerId;
        marker.atomic = true;
    }
    if (cm) {
        // Sync editor state
        if (updateMaxLine)
            cm.curOp.updateMaxLine = true;
        if (marker.collapsed)
            (0, view_tracking_js_1.regChange)(cm, from.line, to.line + 1);
        else if (marker.className || marker.startStyle || marker.endStyle || marker.css ||
            marker.attributes || marker.title)
            for (let i = from.line; i <= to.line; i++)
                (0, view_tracking_js_1.regLineChange)(cm, i, "text");
        if (marker.atomic)
            (0, selection_updates_js_1.reCheckSelection)(cm.doc);
        (0, operation_group_js_1.signalLater)(cm, "markerAdded", cm, marker);
    }
    return marker;
}
exports.markText = markText;
// SHARED TEXTMARKERS
// A shared marker spans multiple linked documents. It is
// implemented as a meta-marker-object controlling multiple normal
// markers.
class SharedTextMarker {
    constructor(markers, primary) {
        this.markers = markers;
        this.primary = primary;
        for (let i = 0; i < markers.length; ++i)
            markers[i].parent = this;
    }
    clear() {
        if (this.explicitlyCleared)
            return;
        this.explicitlyCleared = true;
        for (let i = 0; i < this.markers.length; ++i)
            this.markers[i].clear();
        (0, operation_group_js_1.signalLater)(this, "clear");
    }
    find(side, lineObj) {
        return this.primary.find(side, lineObj);
    }
}
exports.SharedTextMarker = SharedTextMarker;
(0, event_js_1.eventMixin)(SharedTextMarker);
function markTextShared(doc, from, to, options, type) {
    options = (0, misc_js_1.copyObj)(options);
    options.shared = false;
    let markers = [markText(doc, from, to, options, type)], primary = markers[0];
    let widget = options.widgetNode;
    (0, document_data_js_1.linkedDocs)(doc, doc => {
        if (widget)
            options.widgetNode = widget.cloneNode(true);
        markers.push(markText(doc, (0, pos_js_1.clipPos)(doc, from), (0, pos_js_1.clipPos)(doc, to), options, type));
        for (let i = 0; i < doc.linked.length; ++i)
            if (doc.linked[i].isParent)
                return;
        primary = (0, misc_js_1.lst)(markers);
    });
    return new SharedTextMarker(markers, primary);
}
function findSharedMarkers(doc) {
    return doc.findMarks((0, pos_js_1.Pos)(doc.first, 0), doc.clipPos((0, pos_js_1.Pos)(doc.lastLine())), m => m.parent);
}
exports.findSharedMarkers = findSharedMarkers;
function copySharedMarkers(doc, markers) {
    for (let i = 0; i < markers.length; i++) {
        let marker = markers[i], pos = marker.find();
        let mFrom = doc.clipPos(pos.from), mTo = doc.clipPos(pos.to);
        if ((0, pos_js_1.cmp)(mFrom, mTo)) {
            let subMark = markText(doc, mFrom, mTo, marker.primary, marker.primary.type);
            marker.markers.push(subMark);
            subMark.parent = marker;
        }
    }
}
exports.copySharedMarkers = copySharedMarkers;
function detachSharedMarkers(markers) {
    for (let i = 0; i < markers.length; i++) {
        let marker = markers[i], linked = [marker.primary.doc];
        (0, document_data_js_1.linkedDocs)(marker.primary.doc, d => linked.push(d));
        for (let j = 0; j < marker.markers.length; j++) {
            let subMarker = marker.markers[j];
            if ((0, misc_js_1.indexOf)(linked, subMarker.doc) == -1) {
                subMarker.parent = null;
                marker.markers.splice(j--, 1);
            }
        }
    }
}
exports.detachSharedMarkers = detachSharedMarkers;
