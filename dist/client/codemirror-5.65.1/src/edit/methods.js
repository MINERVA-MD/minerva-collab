"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deleteNearSelection_js_1 = require("./deleteNearSelection.js");
const commands_js_1 = require("./commands.js");
const document_data_js_1 = require("../model/document_data.js");
const dom_js_1 = require("../util/dom.js");
const event_js_1 = require("../util/event.js");
const highlight_js_1 = require("../line/highlight.js");
const indent_js_1 = require("../input/indent.js");
const input_js_1 = require("../input/input.js");
const key_events_js_1 = require("./key_events.js");
const mouse_events_js_1 = require("./mouse_events.js");
const keymap_js_1 = require("../input/keymap.js");
const movement_js_1 = require("../input/movement.js");
const operations_js_1 = require("../display/operations.js");
const pos_js_1 = require("../line/pos.js");
const position_measurement_js_1 = require("../measurement/position_measurement.js");
const selection_js_1 = require("../model/selection.js");
const selection_updates_js_1 = require("../model/selection_updates.js");
const scrolling_js_1 = require("../display/scrolling.js");
const spans_js_1 = require("../line/spans.js");
const update_display_js_1 = require("../display/update_display.js");
const misc_js_1 = require("../util/misc.js");
const operation_group_js_1 = require("../util/operation_group.js");
const utils_line_js_1 = require("../line/utils_line.js");
const view_tracking_js_1 = require("../display/view_tracking.js");
// The publicly visible API. Note that methodOp(f) means
// 'wrap f in an operation, performed on its `this` parameter'.
// This is not the complete set of editor methods. Most of the
// methods defined on the Doc type are also injected into
// CodeMirror.prototype, for backwards compatibility and
// convenience.
function default_1(CodeMirror) {
    let optionHandlers = CodeMirror.optionHandlers;
    let helpers = CodeMirror.helpers = {};
    CodeMirror.prototype = {
        constructor: CodeMirror,
        focus: function () { window.focus(); this.display.input.focus(); },
        setOption: function (option, value) {
            let options = this.options, old = options[option];
            if (options[option] == value && option != "mode")
                return;
            options[option] = value;
            if (optionHandlers.hasOwnProperty(option))
                (0, operations_js_1.operation)(this, optionHandlers[option])(this, value, old);
            (0, event_js_1.signal)(this, "optionChange", this, option);
        },
        getOption: function (option) { return this.options[option]; },
        getDoc: function () { return this.doc; },
        addKeyMap: function (map, bottom) {
            this.state.keyMaps[bottom ? "push" : "unshift"]((0, keymap_js_1.getKeyMap)(map));
        },
        removeKeyMap: function (map) {
            let maps = this.state.keyMaps;
            for (let i = 0; i < maps.length; ++i)
                if (maps[i] == map || maps[i].name == map) {
                    maps.splice(i, 1);
                    return true;
                }
        },
        addOverlay: (0, operations_js_1.methodOp)(function (spec, options) {
            let mode = spec.token ? spec : CodeMirror.getMode(this.options, spec);
            if (mode.startState)
                throw new Error("Overlays may not be stateful.");
            (0, misc_js_1.insertSorted)(this.state.overlays, { mode: mode, modeSpec: spec, opaque: options && options.opaque,
                priority: (options && options.priority) || 0 }, overlay => overlay.priority);
            this.state.modeGen++;
            (0, view_tracking_js_1.regChange)(this);
        }),
        removeOverlay: (0, operations_js_1.methodOp)(function (spec) {
            let overlays = this.state.overlays;
            for (let i = 0; i < overlays.length; ++i) {
                let cur = overlays[i].modeSpec;
                if (cur == spec || typeof spec == "string" && cur.name == spec) {
                    overlays.splice(i, 1);
                    this.state.modeGen++;
                    (0, view_tracking_js_1.regChange)(this);
                    return;
                }
            }
        }),
        indentLine: (0, operations_js_1.methodOp)(function (n, dir, aggressive) {
            if (typeof dir != "string" && typeof dir != "number") {
                if (dir == null)
                    dir = this.options.smartIndent ? "smart" : "prev";
                else
                    dir = dir ? "add" : "subtract";
            }
            if ((0, utils_line_js_1.isLine)(this.doc, n))
                (0, indent_js_1.indentLine)(this, n, dir, aggressive);
        }),
        indentSelection: (0, operations_js_1.methodOp)(function (how) {
            let ranges = this.doc.sel.ranges, end = -1;
            for (let i = 0; i < ranges.length; i++) {
                let range = ranges[i];
                if (!range.empty()) {
                    let from = range.from(), to = range.to();
                    let start = Math.max(end, from.line);
                    end = Math.min(this.lastLine(), to.line - (to.ch ? 0 : 1)) + 1;
                    for (let j = start; j < end; ++j)
                        (0, indent_js_1.indentLine)(this, j, how);
                    let newRanges = this.doc.sel.ranges;
                    if (from.ch == 0 && ranges.length == newRanges.length && newRanges[i].from().ch > 0)
                        (0, selection_updates_js_1.replaceOneSelection)(this.doc, i, new selection_js_1.Range(from, newRanges[i].to()), misc_js_1.sel_dontScroll);
                }
                else if (range.head.line > end) {
                    (0, indent_js_1.indentLine)(this, range.head.line, how, true);
                    end = range.head.line;
                    if (i == this.doc.sel.primIndex)
                        (0, scrolling_js_1.ensureCursorVisible)(this);
                }
            }
        }),
        // Fetch the parser token for a given character. Useful for hacks
        // that want to inspect the mode state (say, for completion).
        getTokenAt: function (pos, precise) {
            return (0, highlight_js_1.takeToken)(this, pos, precise);
        },
        getLineTokens: function (line, precise) {
            return (0, highlight_js_1.takeToken)(this, (0, pos_js_1.Pos)(line), precise, true);
        },
        getTokenTypeAt: function (pos) {
            pos = (0, pos_js_1.clipPos)(this.doc, pos);
            let styles = (0, highlight_js_1.getLineStyles)(this, (0, utils_line_js_1.getLine)(this.doc, pos.line));
            let before = 0, after = (styles.length - 1) / 2, ch = pos.ch;
            let type;
            if (ch == 0)
                type = styles[2];
            else
                for (;;) {
                    let mid = (before + after) >> 1;
                    if ((mid ? styles[mid * 2 - 1] : 0) >= ch)
                        after = mid;
                    else if (styles[mid * 2 + 1] < ch)
                        before = mid + 1;
                    else {
                        type = styles[mid * 2 + 2];
                        break;
                    }
                }
            let cut = type ? type.indexOf("overlay ") : -1;
            return cut < 0 ? type : cut == 0 ? null : type.slice(0, cut - 1);
        },
        getModeAt: function (pos) {
            let mode = this.doc.mode;
            if (!mode.innerMode)
                return mode;
            return CodeMirror.innerMode(mode, this.getTokenAt(pos).state).mode;
        },
        getHelper: function (pos, type) {
            return this.getHelpers(pos, type)[0];
        },
        getHelpers: function (pos, type) {
            let found = [];
            if (!helpers.hasOwnProperty(type))
                return found;
            let help = helpers[type], mode = this.getModeAt(pos);
            if (typeof mode[type] == "string") {
                if (help[mode[type]])
                    found.push(help[mode[type]]);
            }
            else if (mode[type]) {
                for (let i = 0; i < mode[type].length; i++) {
                    let val = help[mode[type][i]];
                    if (val)
                        found.push(val);
                }
            }
            else if (mode.helperType && help[mode.helperType]) {
                found.push(help[mode.helperType]);
            }
            else if (help[mode.name]) {
                found.push(help[mode.name]);
            }
            for (let i = 0; i < help._global.length; i++) {
                let cur = help._global[i];
                if (cur.pred(mode, this) && (0, misc_js_1.indexOf)(found, cur.val) == -1)
                    found.push(cur.val);
            }
            return found;
        },
        getStateAfter: function (line, precise) {
            let doc = this.doc;
            line = (0, pos_js_1.clipLine)(doc, line == null ? doc.first + doc.size - 1 : line);
            return (0, highlight_js_1.getContextBefore)(this, line + 1, precise).state;
        },
        cursorCoords: function (start, mode) {
            let pos, range = this.doc.sel.primary();
            if (start == null)
                pos = range.head;
            else if (typeof start == "object")
                pos = (0, pos_js_1.clipPos)(this.doc, start);
            else
                pos = start ? range.from() : range.to();
            return (0, position_measurement_js_1.cursorCoords)(this, pos, mode || "page");
        },
        charCoords: function (pos, mode) {
            return (0, position_measurement_js_1.charCoords)(this, (0, pos_js_1.clipPos)(this.doc, pos), mode || "page");
        },
        coordsChar: function (coords, mode) {
            coords = (0, position_measurement_js_1.fromCoordSystem)(this, coords, mode || "page");
            return (0, position_measurement_js_1.coordsChar)(this, coords.left, coords.top);
        },
        lineAtHeight: function (height, mode) {
            height = (0, position_measurement_js_1.fromCoordSystem)(this, { top: height, left: 0 }, mode || "page").top;
            return (0, utils_line_js_1.lineAtHeight)(this.doc, height + this.display.viewOffset);
        },
        heightAtLine: function (line, mode, includeWidgets) {
            let end = false, lineObj;
            if (typeof line == "number") {
                let last = this.doc.first + this.doc.size - 1;
                if (line < this.doc.first)
                    line = this.doc.first;
                else if (line > last) {
                    line = last;
                    end = true;
                }
                lineObj = (0, utils_line_js_1.getLine)(this.doc, line);
            }
            else {
                lineObj = line;
            }
            return (0, position_measurement_js_1.intoCoordSystem)(this, lineObj, { top: 0, left: 0 }, mode || "page", includeWidgets || end).top +
                (end ? this.doc.height - (0, spans_js_1.heightAtLine)(lineObj) : 0);
        },
        defaultTextHeight: function () { return (0, position_measurement_js_1.textHeight)(this.display); },
        defaultCharWidth: function () { return (0, position_measurement_js_1.charWidth)(this.display); },
        getViewport: function () { return { from: this.display.viewFrom, to: this.display.viewTo }; },
        addWidget: function (pos, node, scroll, vert, horiz) {
            let display = this.display;
            pos = (0, position_measurement_js_1.cursorCoords)(this, (0, pos_js_1.clipPos)(this.doc, pos));
            let top = pos.bottom, left = pos.left;
            node.style.position = "absolute";
            node.setAttribute("cm-ignore-events", "true");
            this.display.input.setUneditable(node);
            display.sizer.appendChild(node);
            if (vert == "over") {
                top = pos.top;
            }
            else if (vert == "above" || vert == "near") {
                let vspace = Math.max(display.wrapper.clientHeight, this.doc.height), hspace = Math.max(display.sizer.clientWidth, display.lineSpace.clientWidth);
                // Default to positioning above (if specified and possible); otherwise default to positioning below
                if ((vert == 'above' || pos.bottom + node.offsetHeight > vspace) && pos.top > node.offsetHeight)
                    top = pos.top - node.offsetHeight;
                else if (pos.bottom + node.offsetHeight <= vspace)
                    top = pos.bottom;
                if (left + node.offsetWidth > hspace)
                    left = hspace - node.offsetWidth;
            }
            node.style.top = top + "px";
            node.style.left = node.style.right = "";
            if (horiz == "right") {
                left = display.sizer.clientWidth - node.offsetWidth;
                node.style.right = "0px";
            }
            else {
                if (horiz == "left")
                    left = 0;
                else if (horiz == "middle")
                    left = (display.sizer.clientWidth - node.offsetWidth) / 2;
                node.style.left = left + "px";
            }
            if (scroll)
                (0, scrolling_js_1.scrollIntoView)(this, { left, top, right: left + node.offsetWidth, bottom: top + node.offsetHeight });
        },
        triggerOnKeyDown: (0, operations_js_1.methodOp)(key_events_js_1.onKeyDown),
        triggerOnKeyPress: (0, operations_js_1.methodOp)(key_events_js_1.onKeyPress),
        triggerOnKeyUp: key_events_js_1.onKeyUp,
        triggerOnMouseDown: (0, operations_js_1.methodOp)(mouse_events_js_1.onMouseDown),
        execCommand: function (cmd) {
            if (commands_js_1.commands.hasOwnProperty(cmd))
                return commands_js_1.commands[cmd].call(null, this);
        },
        triggerElectric: (0, operations_js_1.methodOp)(function (text) { (0, input_js_1.triggerElectric)(this, text); }),
        findPosH: function (from, amount, unit, visually) {
            let dir = 1;
            if (amount < 0) {
                dir = -1;
                amount = -amount;
            }
            let cur = (0, pos_js_1.clipPos)(this.doc, from);
            for (let i = 0; i < amount; ++i) {
                cur = findPosH(this.doc, cur, dir, unit, visually);
                if (cur.hitSide)
                    break;
            }
            return cur;
        },
        moveH: (0, operations_js_1.methodOp)(function (dir, unit) {
            this.extendSelectionsBy(range => {
                if (this.display.shift || this.doc.extend || range.empty())
                    return findPosH(this.doc, range.head, dir, unit, this.options.rtlMoveVisually);
                else
                    return dir < 0 ? range.from() : range.to();
            }, misc_js_1.sel_move);
        }),
        deleteH: (0, operations_js_1.methodOp)(function (dir, unit) {
            let sel = this.doc.sel, doc = this.doc;
            if (sel.somethingSelected())
                doc.replaceSelection("", null, "+delete");
            else
                (0, deleteNearSelection_js_1.deleteNearSelection)(this, range => {
                    let other = findPosH(doc, range.head, dir, unit, false);
                    return dir < 0 ? { from: other, to: range.head } : { from: range.head, to: other };
                });
        }),
        findPosV: function (from, amount, unit, goalColumn) {
            let dir = 1, x = goalColumn;
            if (amount < 0) {
                dir = -1;
                amount = -amount;
            }
            let cur = (0, pos_js_1.clipPos)(this.doc, from);
            for (let i = 0; i < amount; ++i) {
                let coords = (0, position_measurement_js_1.cursorCoords)(this, cur, "div");
                if (x == null)
                    x = coords.left;
                else
                    coords.left = x;
                cur = findPosV(this, coords, dir, unit);
                if (cur.hitSide)
                    break;
            }
            return cur;
        },
        moveV: (0, operations_js_1.methodOp)(function (dir, unit) {
            let doc = this.doc, goals = [];
            let collapse = !this.display.shift && !doc.extend && doc.sel.somethingSelected();
            doc.extendSelectionsBy(range => {
                if (collapse)
                    return dir < 0 ? range.from() : range.to();
                let headPos = (0, position_measurement_js_1.cursorCoords)(this, range.head, "div");
                if (range.goalColumn != null)
                    headPos.left = range.goalColumn;
                goals.push(headPos.left);
                let pos = findPosV(this, headPos, dir, unit);
                if (unit == "page" && range == doc.sel.primary())
                    (0, scrolling_js_1.addToScrollTop)(this, (0, position_measurement_js_1.charCoords)(this, pos, "div").top - headPos.top);
                return pos;
            }, misc_js_1.sel_move);
            if (goals.length)
                for (let i = 0; i < doc.sel.ranges.length; i++)
                    doc.sel.ranges[i].goalColumn = goals[i];
        }),
        // Find the word at the given position (as returned by coordsChar).
        findWordAt: function (pos) {
            let doc = this.doc, line = (0, utils_line_js_1.getLine)(doc, pos.line).text;
            let start = pos.ch, end = pos.ch;
            if (line) {
                let helper = this.getHelper(pos, "wordChars");
                if ((pos.sticky == "before" || end == line.length) && start)
                    --start;
                else
                    ++end;
                let startChar = line.charAt(start);
                let check = (0, misc_js_1.isWordChar)(startChar, helper)
                    ? ch => (0, misc_js_1.isWordChar)(ch, helper)
                    : /\s/.test(startChar) ? ch => /\s/.test(ch)
                        : ch => (!/\s/.test(ch) && !(0, misc_js_1.isWordChar)(ch));
                while (start > 0 && check(line.charAt(start - 1)))
                    --start;
                while (end < line.length && check(line.charAt(end)))
                    ++end;
            }
            return new selection_js_1.Range((0, pos_js_1.Pos)(pos.line, start), (0, pos_js_1.Pos)(pos.line, end));
        },
        toggleOverwrite: function (value) {
            if (value != null && value == this.state.overwrite)
                return;
            if (this.state.overwrite = !this.state.overwrite)
                (0, dom_js_1.addClass)(this.display.cursorDiv, "CodeMirror-overwrite");
            else
                (0, dom_js_1.rmClass)(this.display.cursorDiv, "CodeMirror-overwrite");
            (0, event_js_1.signal)(this, "overwriteToggle", this, this.state.overwrite);
        },
        hasFocus: function () { return this.display.input.getField() == (0, dom_js_1.activeElt)(); },
        isReadOnly: function () { return !!(this.options.readOnly || this.doc.cantEdit); },
        scrollTo: (0, operations_js_1.methodOp)(function (x, y) { (0, scrolling_js_1.scrollToCoords)(this, x, y); }),
        getScrollInfo: function () {
            let scroller = this.display.scroller;
            return { left: scroller.scrollLeft, top: scroller.scrollTop,
                height: scroller.scrollHeight - (0, position_measurement_js_1.scrollGap)(this) - this.display.barHeight,
                width: scroller.scrollWidth - (0, position_measurement_js_1.scrollGap)(this) - this.display.barWidth,
                clientHeight: (0, position_measurement_js_1.displayHeight)(this), clientWidth: (0, position_measurement_js_1.displayWidth)(this) };
        },
        scrollIntoView: (0, operations_js_1.methodOp)(function (range, margin) {
            if (range == null) {
                range = { from: this.doc.sel.primary().head, to: null };
                if (margin == null)
                    margin = this.options.cursorScrollMargin;
            }
            else if (typeof range == "number") {
                range = { from: (0, pos_js_1.Pos)(range, 0), to: null };
            }
            else if (range.from == null) {
                range = { from: range, to: null };
            }
            if (!range.to)
                range.to = range.from;
            range.margin = margin || 0;
            if (range.from.line != null) {
                (0, scrolling_js_1.scrollToRange)(this, range);
            }
            else {
                (0, scrolling_js_1.scrollToCoordsRange)(this, range.from, range.to, range.margin);
            }
        }),
        setSize: (0, operations_js_1.methodOp)(function (width, height) {
            let interpret = val => typeof val == "number" || /^\d+$/.test(String(val)) ? val + "px" : val;
            if (width != null)
                this.display.wrapper.style.width = interpret(width);
            if (height != null)
                this.display.wrapper.style.height = interpret(height);
            if (this.options.lineWrapping)
                (0, position_measurement_js_1.clearLineMeasurementCache)(this);
            let lineNo = this.display.viewFrom;
            this.doc.iter(lineNo, this.display.viewTo, line => {
                if (line.widgets)
                    for (let i = 0; i < line.widgets.length; i++)
                        if (line.widgets[i].noHScroll) {
                            (0, view_tracking_js_1.regLineChange)(this, lineNo, "widget");
                            break;
                        }
                ++lineNo;
            });
            this.curOp.forceUpdate = true;
            (0, event_js_1.signal)(this, "refresh", this);
        }),
        operation: function (f) { return (0, operations_js_1.runInOp)(this, f); },
        startOperation: function () { return (0, operations_js_1.startOperation)(this); },
        endOperation: function () { return (0, operations_js_1.endOperation)(this); },
        refresh: (0, operations_js_1.methodOp)(function () {
            let oldHeight = this.display.cachedTextHeight;
            (0, view_tracking_js_1.regChange)(this);
            this.curOp.forceUpdate = true;
            (0, position_measurement_js_1.clearCaches)(this);
            (0, scrolling_js_1.scrollToCoords)(this, this.doc.scrollLeft, this.doc.scrollTop);
            (0, update_display_js_1.updateGutterSpace)(this.display);
            if (oldHeight == null || Math.abs(oldHeight - (0, position_measurement_js_1.textHeight)(this.display)) > .5 || this.options.lineWrapping)
                (0, position_measurement_js_1.estimateLineHeights)(this);
            (0, event_js_1.signal)(this, "refresh", this);
        }),
        swapDoc: (0, operations_js_1.methodOp)(function (doc) {
            let old = this.doc;
            old.cm = null;
            // Cancel the current text selection if any (#5821)
            if (this.state.selectingText)
                this.state.selectingText();
            (0, document_data_js_1.attachDoc)(this, doc);
            (0, position_measurement_js_1.clearCaches)(this);
            this.display.input.reset();
            (0, scrolling_js_1.scrollToCoords)(this, doc.scrollLeft, doc.scrollTop);
            this.curOp.forceScroll = true;
            (0, operation_group_js_1.signalLater)(this, "swapDoc", this, old);
            return old;
        }),
        phrase: function (phraseText) {
            let phrases = this.options.phrases;
            return phrases && Object.prototype.hasOwnProperty.call(phrases, phraseText) ? phrases[phraseText] : phraseText;
        },
        getInputField: function () { return this.display.input.getField(); },
        getWrapperElement: function () { return this.display.wrapper; },
        getScrollerElement: function () { return this.display.scroller; },
        getGutterElement: function () { return this.display.gutters; }
    };
    (0, event_js_1.eventMixin)(CodeMirror);
    CodeMirror.registerHelper = function (type, name, value) {
        if (!helpers.hasOwnProperty(type))
            helpers[type] = CodeMirror[type] = { _global: [] };
        helpers[type][name] = value;
    };
    CodeMirror.registerGlobalHelper = function (type, name, predicate, value) {
        CodeMirror.registerHelper(type, name, value);
        helpers[type]._global.push({ pred: predicate, val: value });
    };
}
exports.default = default_1;
// Used for horizontal relative motion. Dir is -1 or 1 (left or
// right), unit can be "codepoint", "char", "column" (like char, but
// doesn't cross line boundaries), "word" (across next word), or
// "group" (to the start of next group of word or
// non-word-non-whitespace chars). The visually param controls
// whether, in right-to-left text, direction 1 means to move towards
// the next index in the string, or towards the character to the right
// of the current position. The resulting position will have a
// hitSide=true property if it reached the end of the document.
function findPosH(doc, pos, dir, unit, visually) {
    let oldPos = pos;
    let origDir = dir;
    let lineObj = (0, utils_line_js_1.getLine)(doc, pos.line);
    let lineDir = visually && doc.direction == "rtl" ? -dir : dir;
    function findNextLine() {
        let l = pos.line + lineDir;
        if (l < doc.first || l >= doc.first + doc.size)
            return false;
        pos = new pos_js_1.Pos(l, pos.ch, pos.sticky);
        return lineObj = (0, utils_line_js_1.getLine)(doc, l);
    }
    function moveOnce(boundToLine) {
        let next;
        if (unit == "codepoint") {
            let ch = lineObj.text.charCodeAt(pos.ch + (dir > 0 ? 0 : -1));
            if (isNaN(ch)) {
                next = null;
            }
            else {
                let astral = dir > 0 ? ch >= 0xD800 && ch < 0xDC00 : ch >= 0xDC00 && ch < 0xDFFF;
                next = new pos_js_1.Pos(pos.line, Math.max(0, Math.min(lineObj.text.length, pos.ch + dir * (astral ? 2 : 1))), -dir);
            }
        }
        else if (visually) {
            next = (0, movement_js_1.moveVisually)(doc.cm, lineObj, pos, dir);
        }
        else {
            next = (0, movement_js_1.moveLogically)(lineObj, pos, dir);
        }
        if (next == null) {
            if (!boundToLine && findNextLine())
                pos = (0, movement_js_1.endOfLine)(visually, doc.cm, lineObj, pos.line, lineDir);
            else
                return false;
        }
        else {
            pos = next;
        }
        return true;
    }
    if (unit == "char" || unit == "codepoint") {
        moveOnce();
    }
    else if (unit == "column") {
        moveOnce(true);
    }
    else if (unit == "word" || unit == "group") {
        let sawType = null, group = unit == "group";
        let helper = doc.cm && doc.cm.getHelper(pos, "wordChars");
        for (let first = true;; first = false) {
            if (dir < 0 && !moveOnce(!first))
                break;
            let cur = lineObj.text.charAt(pos.ch) || "\n";
            let type = (0, misc_js_1.isWordChar)(cur, helper) ? "w"
                : group && cur == "\n" ? "n"
                    : !group || /\s/.test(cur) ? null
                        : "p";
            if (group && !first && !type)
                type = "s";
            if (sawType && sawType != type) {
                if (dir < 0) {
                    dir = 1;
                    moveOnce();
                    pos.sticky = "after";
                }
                break;
            }
            if (type)
                sawType = type;
            if (dir > 0 && !moveOnce(!first))
                break;
        }
    }
    let result = (0, selection_updates_js_1.skipAtomic)(doc, pos, oldPos, origDir, true);
    if ((0, pos_js_1.equalCursorPos)(oldPos, result))
        result.hitSide = true;
    return result;
}
// For relative vertical movement. Dir may be -1 or 1. Unit can be
// "page" or "line". The resulting position will have a hitSide=true
// property if it reached the end of the document.
function findPosV(cm, pos, dir, unit) {
    let doc = cm.doc, x = pos.left, y;
    if (unit == "page") {
        let pageSize = Math.min(cm.display.wrapper.clientHeight, window.innerHeight || document.documentElement.clientHeight);
        let moveAmount = Math.max(pageSize - .5 * (0, position_measurement_js_1.textHeight)(cm.display), 3);
        y = (dir > 0 ? pos.bottom : pos.top) + dir * moveAmount;
    }
    else if (unit == "line") {
        y = dir > 0 ? pos.bottom + 3 : pos.top - 3;
    }
    let target;
    for (;;) {
        target = (0, position_measurement_js_1.coordsChar)(cm, x, y);
        if (!target.outside)
            break;
        if (dir < 0 ? y <= 0 : y >= doc.height) {
            target.hitSide = true;
            break;
        }
        y += dir * 5;
    }
    return target;
}
