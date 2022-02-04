"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.directionChanged = exports.attachDoc = exports.linkedDocs = exports.updateDoc = exports.isWholeLineUpdate = void 0;
const mode_state_js_1 = require("../display/mode_state.js");
const operations_js_1 = require("../display/operations.js");
const view_tracking_js_1 = require("../display/view_tracking.js");
const line_data_js_1 = require("../line/line_data.js");
const spans_js_1 = require("../line/spans.js");
const utils_line_js_1 = require("../line/utils_line.js");
const position_measurement_js_1 = require("../measurement/position_measurement.js");
const dom_js_1 = require("../util/dom.js");
const misc_js_1 = require("../util/misc.js");
const operation_group_js_1 = require("../util/operation_group.js");
// DOCUMENT DATA STRUCTURE
// By default, updates that start and end at the beginning of a line
// are treated specially, in order to make the association of line
// widgets and marker elements with the text behave more intuitive.
function isWholeLineUpdate(doc, change) {
    return change.from.ch == 0 && change.to.ch == 0 && (0, misc_js_1.lst)(change.text) == "" &&
        (!doc.cm || doc.cm.options.wholeLineUpdateBefore);
}
exports.isWholeLineUpdate = isWholeLineUpdate;
// Perform a change on the document data structure.
function updateDoc(doc, change, markedSpans, estimateHeight) {
    function spansFor(n) { return markedSpans ? markedSpans[n] : null; }
    function update(line, text, spans) {
        (0, line_data_js_1.updateLine)(line, text, spans, estimateHeight);
        (0, operation_group_js_1.signalLater)(line, "change", line, change);
    }
    function linesFor(start, end) {
        let result = [];
        for (let i = start; i < end; ++i)
            result.push(new line_data_js_1.Line(text[i], spansFor(i), estimateHeight));
        return result;
    }
    let from = change.from, to = change.to, text = change.text;
    let firstLine = (0, utils_line_js_1.getLine)(doc, from.line), lastLine = (0, utils_line_js_1.getLine)(doc, to.line);
    let lastText = (0, misc_js_1.lst)(text), lastSpans = spansFor(text.length - 1), nlines = to.line - from.line;
    // Adjust the line structure
    if (change.full) {
        doc.insert(0, linesFor(0, text.length));
        doc.remove(text.length, doc.size - text.length);
    }
    else if (isWholeLineUpdate(doc, change)) {
        // This is a whole-line replace. Treated specially to make
        // sure line objects move the way they are supposed to.
        let added = linesFor(0, text.length - 1);
        update(lastLine, lastLine.text, lastSpans);
        if (nlines)
            doc.remove(from.line, nlines);
        if (added.length)
            doc.insert(from.line, added);
    }
    else if (firstLine == lastLine) {
        if (text.length == 1) {
            update(firstLine, firstLine.text.slice(0, from.ch) + lastText + firstLine.text.slice(to.ch), lastSpans);
        }
        else {
            let added = linesFor(1, text.length - 1);
            added.push(new line_data_js_1.Line(lastText + firstLine.text.slice(to.ch), lastSpans, estimateHeight));
            update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0));
            doc.insert(from.line + 1, added);
        }
    }
    else if (text.length == 1) {
        update(firstLine, firstLine.text.slice(0, from.ch) + text[0] + lastLine.text.slice(to.ch), spansFor(0));
        doc.remove(from.line + 1, nlines);
    }
    else {
        update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0));
        update(lastLine, lastText + lastLine.text.slice(to.ch), lastSpans);
        let added = linesFor(1, text.length - 1);
        if (nlines > 1)
            doc.remove(from.line + 1, nlines - 1);
        doc.insert(from.line + 1, added);
    }
    (0, operation_group_js_1.signalLater)(doc, "change", doc, change);
}
exports.updateDoc = updateDoc;
// Call f for all linked documents.
function linkedDocs(doc, f, sharedHistOnly) {
    function propagate(doc, skip, sharedHist) {
        if (doc.linked)
            for (let i = 0; i < doc.linked.length; ++i) {
                let rel = doc.linked[i];
                if (rel.doc == skip)
                    continue;
                let shared = sharedHist && rel.sharedHist;
                if (sharedHistOnly && !shared)
                    continue;
                f(rel.doc, shared);
                propagate(rel.doc, doc, shared);
            }
    }
    propagate(doc, null, true);
}
exports.linkedDocs = linkedDocs;
// Attach a document to an editor.
function attachDoc(cm, doc) {
    if (doc.cm)
        throw new Error("This document is already in use.");
    cm.doc = doc;
    doc.cm = cm;
    (0, position_measurement_js_1.estimateLineHeights)(cm);
    (0, mode_state_js_1.loadMode)(cm);
    setDirectionClass(cm);
    cm.options.direction = doc.direction;
    if (!cm.options.lineWrapping)
        (0, spans_js_1.findMaxLine)(cm);
    cm.options.mode = doc.modeOption;
    (0, view_tracking_js_1.regChange)(cm);
}
exports.attachDoc = attachDoc;
function setDirectionClass(cm) {
    ;
    (cm.doc.direction == "rtl" ? dom_js_1.addClass : dom_js_1.rmClass)(cm.display.lineDiv, "CodeMirror-rtl");
}
function directionChanged(cm) {
    (0, operations_js_1.runInOp)(cm, () => {
        setDirectionClass(cm);
        (0, view_tracking_js_1.regChange)(cm);
    });
}
exports.directionChanged = directionChanged;
