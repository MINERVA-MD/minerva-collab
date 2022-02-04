"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CodeMirror_js_1 = __importDefault(require("../edit/CodeMirror.js"));
const operations_js_1 = require("../display/operations.js");
const line_data_js_1 = require("../line/line_data.js");
const pos_js_1 = require("../line/pos.js");
const spans_js_1 = require("../line/spans.js");
const utils_line_js_1 = require("../line/utils_line.js");
const dom_js_1 = require("../util/dom.js");
const feature_detection_js_1 = require("../util/feature_detection.js");
const misc_js_1 = require("../util/misc.js");
const scrolling_js_1 = require("../display/scrolling.js");
const changes_js_1 = require("./changes.js");
const change_measurement_js_1 = require("./change_measurement.js");
const chunk_js_1 = require("./chunk.js");
const document_data_js_1 = require("./document_data.js");
const history_js_1 = require("./history.js");
const line_widget_js_1 = require("./line_widget.js");
const mark_text_js_1 = require("./mark_text.js");
const selection_js_1 = require("./selection.js");
const selection_updates_js_1 = require("./selection_updates.js");
let nextDocId = 0;
let Doc = function (text, mode, firstLine, lineSep, direction) {
    if (!(this instanceof Doc))
        return new Doc(text, mode, firstLine, lineSep, direction);
    if (firstLine == null)
        firstLine = 0;
    chunk_js_1.BranchChunk.call(this, [new chunk_js_1.LeafChunk([new line_data_js_1.Line("", null)])]);
    this.first = firstLine;
    this.scrollTop = this.scrollLeft = 0;
    this.cantEdit = false;
    this.cleanGeneration = 1;
    this.modeFrontier = this.highlightFrontier = firstLine;
    let start = (0, pos_js_1.Pos)(firstLine, 0);
    this.sel = (0, selection_js_1.simpleSelection)(start);
    this.history = new history_js_1.History(null);
    this.id = ++nextDocId;
    this.modeOption = mode;
    this.lineSep = lineSep;
    this.direction = (direction == "rtl") ? "rtl" : "ltr";
    this.extend = false;
    if (typeof text == "string")
        text = this.splitLines(text);
    (0, document_data_js_1.updateDoc)(this, { from: start, to: start, text: text });
    (0, selection_updates_js_1.setSelection)(this, (0, selection_js_1.simpleSelection)(start), misc_js_1.sel_dontScroll);
};
Doc.prototype = (0, misc_js_1.createObj)(chunk_js_1.BranchChunk.prototype, {
    constructor: Doc,
    // Iterate over the document. Supports two forms -- with only one
    // argument, it calls that for each line in the document. With
    // three, it iterates over the range given by the first two (with
    // the second being non-inclusive).
    iter: function (from, to, op) {
        if (op)
            this.iterN(from - this.first, to - from, op);
        else
            this.iterN(this.first, this.first + this.size, from);
    },
    // Non-public interface for adding and removing lines.
    insert: function (at, lines) {
        let height = 0;
        for (let i = 0; i < lines.length; ++i)
            height += lines[i].height;
        this.insertInner(at - this.first, lines, height);
    },
    remove: function (at, n) { this.removeInner(at - this.first, n); },
    // From here, the methods are part of the public interface. Most
    // are also available from CodeMirror (editor) instances.
    getValue: function (lineSep) {
        let lines = (0, utils_line_js_1.getLines)(this, this.first, this.first + this.size);
        if (lineSep === false)
            return lines;
        return lines.join(lineSep || this.lineSeparator());
    },
    setValue: (0, operations_js_1.docMethodOp)(function (code) {
        let top = (0, pos_js_1.Pos)(this.first, 0), last = this.first + this.size - 1;
        (0, changes_js_1.makeChange)(this, { from: top, to: (0, pos_js_1.Pos)(last, (0, utils_line_js_1.getLine)(this, last).text.length),
            text: this.splitLines(code), origin: "setValue", full: true }, true);
        if (this.cm)
            (0, scrolling_js_1.scrollToCoords)(this.cm, 0, 0);
        (0, selection_updates_js_1.setSelection)(this, (0, selection_js_1.simpleSelection)(top), misc_js_1.sel_dontScroll);
    }),
    replaceRange: function (code, from, to, origin) {
        from = (0, pos_js_1.clipPos)(this, from);
        to = to ? (0, pos_js_1.clipPos)(this, to) : from;
        (0, changes_js_1.replaceRange)(this, code, from, to, origin);
    },
    getRange: function (from, to, lineSep) {
        let lines = (0, utils_line_js_1.getBetween)(this, (0, pos_js_1.clipPos)(this, from), (0, pos_js_1.clipPos)(this, to));
        if (lineSep === false)
            return lines;
        if (lineSep === '')
            return lines.join('');
        return lines.join(lineSep || this.lineSeparator());
    },
    getLine: function (line) { let l = this.getLineHandle(line); return l && l.text; },
    getLineHandle: function (line) { if ((0, utils_line_js_1.isLine)(this, line))
        return (0, utils_line_js_1.getLine)(this, line); },
    getLineNumber: function (line) { return (0, utils_line_js_1.lineNo)(line); },
    getLineHandleVisualStart: function (line) {
        if (typeof line == "number")
            line = (0, utils_line_js_1.getLine)(this, line);
        return (0, spans_js_1.visualLine)(line);
    },
    lineCount: function () { return this.size; },
    firstLine: function () { return this.first; },
    lastLine: function () { return this.first + this.size - 1; },
    clipPos: function (pos) { return (0, pos_js_1.clipPos)(this, pos); },
    getCursor: function (start) {
        let range = this.sel.primary(), pos;
        if (start == null || start == "head")
            pos = range.head;
        else if (start == "anchor")
            pos = range.anchor;
        else if (start == "end" || start == "to" || start === false)
            pos = range.to();
        else
            pos = range.from();
        return pos;
    },
    listSelections: function () { return this.sel.ranges; },
    somethingSelected: function () { return this.sel.somethingSelected(); },
    setCursor: (0, operations_js_1.docMethodOp)(function (line, ch, options) {
        (0, selection_updates_js_1.setSimpleSelection)(this, (0, pos_js_1.clipPos)(this, typeof line == "number" ? (0, pos_js_1.Pos)(line, ch || 0) : line), null, options);
    }),
    setSelection: (0, operations_js_1.docMethodOp)(function (anchor, head, options) {
        (0, selection_updates_js_1.setSimpleSelection)(this, (0, pos_js_1.clipPos)(this, anchor), (0, pos_js_1.clipPos)(this, head || anchor), options);
    }),
    extendSelection: (0, operations_js_1.docMethodOp)(function (head, other, options) {
        (0, selection_updates_js_1.extendSelection)(this, (0, pos_js_1.clipPos)(this, head), other && (0, pos_js_1.clipPos)(this, other), options);
    }),
    extendSelections: (0, operations_js_1.docMethodOp)(function (heads, options) {
        (0, selection_updates_js_1.extendSelections)(this, (0, pos_js_1.clipPosArray)(this, heads), options);
    }),
    extendSelectionsBy: (0, operations_js_1.docMethodOp)(function (f, options) {
        let heads = (0, misc_js_1.map)(this.sel.ranges, f);
        (0, selection_updates_js_1.extendSelections)(this, (0, pos_js_1.clipPosArray)(this, heads), options);
    }),
    setSelections: (0, operations_js_1.docMethodOp)(function (ranges, primary, options) {
        if (!ranges.length)
            return;
        let out = [];
        for (let i = 0; i < ranges.length; i++)
            out[i] = new selection_js_1.Range((0, pos_js_1.clipPos)(this, ranges[i].anchor), (0, pos_js_1.clipPos)(this, ranges[i].head || ranges[i].anchor));
        if (primary == null)
            primary = Math.min(ranges.length - 1, this.sel.primIndex);
        (0, selection_updates_js_1.setSelection)(this, (0, selection_js_1.normalizeSelection)(this.cm, out, primary), options);
    }),
    addSelection: (0, operations_js_1.docMethodOp)(function (anchor, head, options) {
        let ranges = this.sel.ranges.slice(0);
        ranges.push(new selection_js_1.Range((0, pos_js_1.clipPos)(this, anchor), (0, pos_js_1.clipPos)(this, head || anchor)));
        (0, selection_updates_js_1.setSelection)(this, (0, selection_js_1.normalizeSelection)(this.cm, ranges, ranges.length - 1), options);
    }),
    getSelection: function (lineSep) {
        let ranges = this.sel.ranges, lines;
        for (let i = 0; i < ranges.length; i++) {
            let sel = (0, utils_line_js_1.getBetween)(this, ranges[i].from(), ranges[i].to());
            lines = lines ? lines.concat(sel) : sel;
        }
        if (lineSep === false)
            return lines;
        else
            return lines.join(lineSep || this.lineSeparator());
    },
    getSelections: function (lineSep) {
        let parts = [], ranges = this.sel.ranges;
        for (let i = 0; i < ranges.length; i++) {
            let sel = (0, utils_line_js_1.getBetween)(this, ranges[i].from(), ranges[i].to());
            if (lineSep !== false)
                sel = sel.join(lineSep || this.lineSeparator());
            parts[i] = sel;
        }
        return parts;
    },
    replaceSelection: function (code, collapse, origin) {
        let dup = [];
        for (let i = 0; i < this.sel.ranges.length; i++)
            dup[i] = code;
        this.replaceSelections(dup, collapse, origin || "+input");
    },
    replaceSelections: (0, operations_js_1.docMethodOp)(function (code, collapse, origin) {
        let changes = [], sel = this.sel;
        for (let i = 0; i < sel.ranges.length; i++) {
            let range = sel.ranges[i];
            changes[i] = { from: range.from(), to: range.to(), text: this.splitLines(code[i]), origin: origin };
        }
        let newSel = collapse && collapse != "end" && (0, change_measurement_js_1.computeReplacedSel)(this, changes, collapse);
        for (let i = changes.length - 1; i >= 0; i--)
            (0, changes_js_1.makeChange)(this, changes[i]);
        if (newSel)
            (0, selection_updates_js_1.setSelectionReplaceHistory)(this, newSel);
        else if (this.cm)
            (0, scrolling_js_1.ensureCursorVisible)(this.cm);
    }),
    undo: (0, operations_js_1.docMethodOp)(function () { (0, changes_js_1.makeChangeFromHistory)(this, "undo"); }),
    redo: (0, operations_js_1.docMethodOp)(function () { (0, changes_js_1.makeChangeFromHistory)(this, "redo"); }),
    undoSelection: (0, operations_js_1.docMethodOp)(function () { (0, changes_js_1.makeChangeFromHistory)(this, "undo", true); }),
    redoSelection: (0, operations_js_1.docMethodOp)(function () { (0, changes_js_1.makeChangeFromHistory)(this, "redo", true); }),
    setExtending: function (val) { this.extend = val; },
    getExtending: function () { return this.extend; },
    historySize: function () {
        let hist = this.history, done = 0, undone = 0;
        for (let i = 0; i < hist.done.length; i++)
            if (!hist.done[i].ranges)
                ++done;
        for (let i = 0; i < hist.undone.length; i++)
            if (!hist.undone[i].ranges)
                ++undone;
        return { undo: done, redo: undone };
    },
    clearHistory: function () {
        this.history = new history_js_1.History(this.history);
        (0, document_data_js_1.linkedDocs)(this, doc => doc.history = this.history, true);
    },
    markClean: function () {
        this.cleanGeneration = this.changeGeneration(true);
    },
    changeGeneration: function (forceSplit) {
        if (forceSplit)
            this.history.lastOp = this.history.lastSelOp = this.history.lastOrigin = null;
        return this.history.generation;
    },
    isClean: function (gen) {
        return this.history.generation == (gen || this.cleanGeneration);
    },
    getHistory: function () {
        return { done: (0, history_js_1.copyHistoryArray)(this.history.done),
            undone: (0, history_js_1.copyHistoryArray)(this.history.undone) };
    },
    setHistory: function (histData) {
        let hist = this.history = new history_js_1.History(this.history);
        hist.done = (0, history_js_1.copyHistoryArray)(histData.done.slice(0), null, true);
        hist.undone = (0, history_js_1.copyHistoryArray)(histData.undone.slice(0), null, true);
    },
    setGutterMarker: (0, operations_js_1.docMethodOp)(function (line, gutterID, value) {
        return (0, changes_js_1.changeLine)(this, line, "gutter", line => {
            let markers = line.gutterMarkers || (line.gutterMarkers = {});
            markers[gutterID] = value;
            if (!value && (0, misc_js_1.isEmpty)(markers))
                line.gutterMarkers = null;
            return true;
        });
    }),
    clearGutter: (0, operations_js_1.docMethodOp)(function (gutterID) {
        this.iter(line => {
            if (line.gutterMarkers && line.gutterMarkers[gutterID]) {
                (0, changes_js_1.changeLine)(this, line, "gutter", () => {
                    line.gutterMarkers[gutterID] = null;
                    if ((0, misc_js_1.isEmpty)(line.gutterMarkers))
                        line.gutterMarkers = null;
                    return true;
                });
            }
        });
    }),
    lineInfo: function (line) {
        let n;
        if (typeof line == "number") {
            if (!(0, utils_line_js_1.isLine)(this, line))
                return null;
            n = line;
            line = (0, utils_line_js_1.getLine)(this, line);
            if (!line)
                return null;
        }
        else {
            n = (0, utils_line_js_1.lineNo)(line);
            if (n == null)
                return null;
        }
        return { line: n, handle: line, text: line.text, gutterMarkers: line.gutterMarkers,
            textClass: line.textClass, bgClass: line.bgClass, wrapClass: line.wrapClass,
            widgets: line.widgets };
    },
    addLineClass: (0, operations_js_1.docMethodOp)(function (handle, where, cls) {
        return (0, changes_js_1.changeLine)(this, handle, where == "gutter" ? "gutter" : "class", line => {
            let prop = where == "text" ? "textClass"
                : where == "background" ? "bgClass"
                    : where == "gutter" ? "gutterClass" : "wrapClass";
            if (!line[prop])
                line[prop] = cls;
            else if ((0, dom_js_1.classTest)(cls).test(line[prop]))
                return false;
            else
                line[prop] += " " + cls;
            return true;
        });
    }),
    removeLineClass: (0, operations_js_1.docMethodOp)(function (handle, where, cls) {
        return (0, changes_js_1.changeLine)(this, handle, where == "gutter" ? "gutter" : "class", line => {
            let prop = where == "text" ? "textClass"
                : where == "background" ? "bgClass"
                    : where == "gutter" ? "gutterClass" : "wrapClass";
            let cur = line[prop];
            if (!cur)
                return false;
            else if (cls == null)
                line[prop] = null;
            else {
                let found = cur.match((0, dom_js_1.classTest)(cls));
                if (!found)
                    return false;
                let end = found.index + found[0].length;
                line[prop] = cur.slice(0, found.index) + (!found.index || end == cur.length ? "" : " ") + cur.slice(end) || null;
            }
            return true;
        });
    }),
    addLineWidget: (0, operations_js_1.docMethodOp)(function (handle, node, options) {
        return (0, line_widget_js_1.addLineWidget)(this, handle, node, options);
    }),
    removeLineWidget: function (widget) { widget.clear(); },
    markText: function (from, to, options) {
        return (0, mark_text_js_1.markText)(this, (0, pos_js_1.clipPos)(this, from), (0, pos_js_1.clipPos)(this, to), options, options && options.type || "range");
    },
    setBookmark: function (pos, options) {
        let realOpts = { replacedWith: options && (options.nodeType == null ? options.widget : options),
            insertLeft: options && options.insertLeft,
            clearWhenEmpty: false, shared: options && options.shared,
            handleMouseEvents: options && options.handleMouseEvents };
        pos = (0, pos_js_1.clipPos)(this, pos);
        return (0, mark_text_js_1.markText)(this, pos, pos, realOpts, "bookmark");
    },
    findMarksAt: function (pos) {
        pos = (0, pos_js_1.clipPos)(this, pos);
        let markers = [], spans = (0, utils_line_js_1.getLine)(this, pos.line).markedSpans;
        if (spans)
            for (let i = 0; i < spans.length; ++i) {
                let span = spans[i];
                if ((span.from == null || span.from <= pos.ch) &&
                    (span.to == null || span.to >= pos.ch))
                    markers.push(span.marker.parent || span.marker);
            }
        return markers;
    },
    findMarks: function (from, to, filter) {
        from = (0, pos_js_1.clipPos)(this, from);
        to = (0, pos_js_1.clipPos)(this, to);
        let found = [], lineNo = from.line;
        this.iter(from.line, to.line + 1, line => {
            let spans = line.markedSpans;
            if (spans)
                for (let i = 0; i < spans.length; i++) {
                    let span = spans[i];
                    if (!(span.to != null && lineNo == from.line && from.ch >= span.to ||
                        span.from == null && lineNo != from.line ||
                        span.from != null && lineNo == to.line && span.from >= to.ch) &&
                        (!filter || filter(span.marker)))
                        found.push(span.marker.parent || span.marker);
                }
            ++lineNo;
        });
        return found;
    },
    getAllMarks: function () {
        let markers = [];
        this.iter(line => {
            let sps = line.markedSpans;
            if (sps)
                for (let i = 0; i < sps.length; ++i)
                    if (sps[i].from != null)
                        markers.push(sps[i].marker);
        });
        return markers;
    },
    posFromIndex: function (off) {
        let ch, lineNo = this.first, sepSize = this.lineSeparator().length;
        this.iter(line => {
            let sz = line.text.length + sepSize;
            if (sz > off) {
                ch = off;
                return true;
            }
            off -= sz;
            ++lineNo;
        });
        return (0, pos_js_1.clipPos)(this, (0, pos_js_1.Pos)(lineNo, ch));
    },
    indexFromPos: function (coords) {
        coords = (0, pos_js_1.clipPos)(this, coords);
        let index = coords.ch;
        if (coords.line < this.first || coords.ch < 0)
            return 0;
        let sepSize = this.lineSeparator().length;
        this.iter(this.first, coords.line, line => {
            index += line.text.length + sepSize;
        });
        return index;
    },
    copy: function (copyHistory) {
        let doc = new Doc((0, utils_line_js_1.getLines)(this, this.first, this.first + this.size), this.modeOption, this.first, this.lineSep, this.direction);
        doc.scrollTop = this.scrollTop;
        doc.scrollLeft = this.scrollLeft;
        doc.sel = this.sel;
        doc.extend = false;
        if (copyHistory) {
            doc.history.undoDepth = this.history.undoDepth;
            doc.setHistory(this.getHistory());
        }
        return doc;
    },
    linkedDoc: function (options) {
        if (!options)
            options = {};
        let from = this.first, to = this.first + this.size;
        if (options.from != null && options.from > from)
            from = options.from;
        if (options.to != null && options.to < to)
            to = options.to;
        let copy = new Doc((0, utils_line_js_1.getLines)(this, from, to), options.mode || this.modeOption, from, this.lineSep, this.direction);
        if (options.sharedHist)
            copy.history = this.history;
        (this.linked || (this.linked = [])).push({ doc: copy, sharedHist: options.sharedHist });
        copy.linked = [{ doc: this, isParent: true, sharedHist: options.sharedHist }];
        (0, mark_text_js_1.copySharedMarkers)(copy, (0, mark_text_js_1.findSharedMarkers)(this));
        return copy;
    },
    unlinkDoc: function (other) {
        if (other instanceof CodeMirror_js_1.default)
            other = other.doc;
        if (this.linked)
            for (let i = 0; i < this.linked.length; ++i) {
                let link = this.linked[i];
                if (link.doc != other)
                    continue;
                this.linked.splice(i, 1);
                other.unlinkDoc(this);
                (0, mark_text_js_1.detachSharedMarkers)((0, mark_text_js_1.findSharedMarkers)(this));
                break;
            }
        // If the histories were shared, split them again
        if (other.history == this.history) {
            let splitIds = [other.id];
            (0, document_data_js_1.linkedDocs)(other, doc => splitIds.push(doc.id), true);
            other.history = new history_js_1.History(null);
            other.history.done = (0, history_js_1.copyHistoryArray)(this.history.done, splitIds);
            other.history.undone = (0, history_js_1.copyHistoryArray)(this.history.undone, splitIds);
        }
    },
    iterLinkedDocs: function (f) { (0, document_data_js_1.linkedDocs)(this, f); },
    getMode: function () { return this.mode; },
    getEditor: function () { return this.cm; },
    splitLines: function (str) {
        if (this.lineSep)
            return str.split(this.lineSep);
        return (0, feature_detection_js_1.splitLinesAuto)(str);
    },
    lineSeparator: function () { return this.lineSep || "\n"; },
    setDirection: (0, operations_js_1.docMethodOp)(function (dir) {
        if (dir != "rtl")
            dir = "ltr";
        if (dir == this.direction)
            return;
        this.direction = dir;
        this.iter(line => line.order = null);
        if (this.cm)
            (0, document_data_js_1.directionChanged)(this.cm);
    })
});
// Public alias.
Doc.prototype.eachLine = Doc.prototype.iter;
exports.default = Doc;
