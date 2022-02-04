"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineOptions = exports.optionHandlers = exports.defaults = exports.Init = void 0;
const focus_js_1 = require("../display/focus.js");
const gutters_js_1 = require("../display/gutters.js");
const mode_state_js_1 = require("../display/mode_state.js");
const scrollbars_js_1 = require("../display/scrollbars.js");
const selection_js_1 = require("../display/selection.js");
const view_tracking_js_1 = require("../display/view_tracking.js");
const keymap_js_1 = require("../input/keymap.js");
const line_data_js_1 = require("../line/line_data.js");
const pos_js_1 = require("../line/pos.js");
const spans_js_1 = require("../line/spans.js");
const position_measurement_js_1 = require("../measurement/position_measurement.js");
const changes_js_1 = require("../model/changes.js");
const browser_js_1 = require("../util/browser.js");
const dom_js_1 = require("../util/dom.js");
const event_js_1 = require("../util/event.js");
const utils_js_1 = require("./utils.js");
exports.Init = { toString: function () { return "CodeMirror.Init"; } };
exports.defaults = {};
exports.optionHandlers = {};
function defineOptions(CodeMirror) {
    let optionHandlers = CodeMirror.optionHandlers;
    function option(name, deflt, handle, notOnInit) {
        CodeMirror.defaults[name] = deflt;
        if (handle)
            optionHandlers[name] =
                notOnInit ? (cm, val, old) => { if (old != exports.Init)
                    handle(cm, val, old); } : handle;
    }
    CodeMirror.defineOption = option;
    // Passed to option handlers when there is no old value.
    CodeMirror.Init = exports.Init;
    // These two are, on init, called from the constructor because they
    // have to be initialized before the editor can start at all.
    option("value", "", (cm, val) => cm.setValue(val), true);
    option("mode", null, (cm, val) => {
        cm.doc.modeOption = val;
        (0, mode_state_js_1.loadMode)(cm);
    }, true);
    option("indentUnit", 2, mode_state_js_1.loadMode, true);
    option("indentWithTabs", false);
    option("smartIndent", true);
    option("tabSize", 4, cm => {
        (0, mode_state_js_1.resetModeState)(cm);
        (0, position_measurement_js_1.clearCaches)(cm);
        (0, view_tracking_js_1.regChange)(cm);
    }, true);
    option("lineSeparator", null, (cm, val) => {
        cm.doc.lineSep = val;
        if (!val)
            return;
        let newBreaks = [], lineNo = cm.doc.first;
        cm.doc.iter(line => {
            for (let pos = 0;;) {
                let found = line.text.indexOf(val, pos);
                if (found == -1)
                    break;
                pos = found + val.length;
                newBreaks.push((0, pos_js_1.Pos)(lineNo, found));
            }
            lineNo++;
        });
        for (let i = newBreaks.length - 1; i >= 0; i--)
            (0, changes_js_1.replaceRange)(cm.doc, val, newBreaks[i], (0, pos_js_1.Pos)(newBreaks[i].line, newBreaks[i].ch + val.length));
    });
    option("specialChars", /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b\u200e\u200f\u2028\u2029\ufeff\ufff9-\ufffc]/g, (cm, val, old) => {
        cm.state.specialChars = new RegExp(val.source + (val.test("\t") ? "" : "|\t"), "g");
        if (old != exports.Init)
            cm.refresh();
    });
    option("specialCharPlaceholder", line_data_js_1.defaultSpecialCharPlaceholder, cm => cm.refresh(), true);
    option("electricChars", true);
    option("inputStyle", browser_js_1.mobile ? "contenteditable" : "textarea", () => {
        throw new Error("inputStyle can not (yet) be changed in a running editor"); // FIXME
    }, true);
    option("spellcheck", false, (cm, val) => cm.getInputField().spellcheck = val, true);
    option("autocorrect", false, (cm, val) => cm.getInputField().autocorrect = val, true);
    option("autocapitalize", false, (cm, val) => cm.getInputField().autocapitalize = val, true);
    option("rtlMoveVisually", !browser_js_1.windows);
    option("wholeLineUpdateBefore", true);
    option("theme", "default", cm => {
        (0, utils_js_1.themeChanged)(cm);
        (0, gutters_js_1.updateGutters)(cm);
    }, true);
    option("keyMap", "default", (cm, val, old) => {
        let next = (0, keymap_js_1.getKeyMap)(val);
        let prev = old != exports.Init && (0, keymap_js_1.getKeyMap)(old);
        if (prev && prev.detach)
            prev.detach(cm, next);
        if (next.attach)
            next.attach(cm, prev || null);
    });
    option("extraKeys", null);
    option("configureMouse", null);
    option("lineWrapping", false, wrappingChanged, true);
    option("gutters", [], (cm, val) => {
        cm.display.gutterSpecs = (0, gutters_js_1.getGutters)(val, cm.options.lineNumbers);
        (0, gutters_js_1.updateGutters)(cm);
    }, true);
    option("fixedGutter", true, (cm, val) => {
        cm.display.gutters.style.left = val ? (0, position_measurement_js_1.compensateForHScroll)(cm.display) + "px" : "0";
        cm.refresh();
    }, true);
    option("coverGutterNextToScrollbar", false, cm => (0, scrollbars_js_1.updateScrollbars)(cm), true);
    option("scrollbarStyle", "native", cm => {
        (0, scrollbars_js_1.initScrollbars)(cm);
        (0, scrollbars_js_1.updateScrollbars)(cm);
        cm.display.scrollbars.setScrollTop(cm.doc.scrollTop);
        cm.display.scrollbars.setScrollLeft(cm.doc.scrollLeft);
    }, true);
    option("lineNumbers", false, (cm, val) => {
        cm.display.gutterSpecs = (0, gutters_js_1.getGutters)(cm.options.gutters, val);
        (0, gutters_js_1.updateGutters)(cm);
    }, true);
    option("firstLineNumber", 1, gutters_js_1.updateGutters, true);
    option("lineNumberFormatter", integer => integer, gutters_js_1.updateGutters, true);
    option("showCursorWhenSelecting", false, selection_js_1.updateSelection, true);
    option("resetSelectionOnContextMenu", true);
    option("lineWiseCopyCut", true);
    option("pasteLinesPerSelection", true);
    option("selectionsMayTouch", false);
    option("readOnly", false, (cm, val) => {
        if (val == "nocursor") {
            (0, focus_js_1.onBlur)(cm);
            cm.display.input.blur();
        }
        cm.display.input.readOnlyChanged(val);
    });
    option("screenReaderLabel", null, (cm, val) => {
        val = (val === '') ? null : val;
        cm.display.input.screenReaderLabelChanged(val);
    });
    option("disableInput", false, (cm, val) => { if (!val)
        cm.display.input.reset(); }, true);
    option("dragDrop", true, dragDropChanged);
    option("allowDropFileTypes", null);
    option("cursorBlinkRate", 530);
    option("cursorScrollMargin", 0);
    option("cursorHeight", 1, selection_js_1.updateSelection, true);
    option("singleCursorHeightPerLine", true, selection_js_1.updateSelection, true);
    option("workTime", 100);
    option("workDelay", 100);
    option("flattenSpans", true, mode_state_js_1.resetModeState, true);
    option("addModeClass", false, mode_state_js_1.resetModeState, true);
    option("pollInterval", 100);
    option("undoDepth", 200, (cm, val) => cm.doc.history.undoDepth = val);
    option("historyEventDelay", 1250);
    option("viewportMargin", 10, cm => cm.refresh(), true);
    option("maxHighlightLength", 10000, mode_state_js_1.resetModeState, true);
    option("moveInputWithCursor", true, (cm, val) => {
        if (!val)
            cm.display.input.resetPosition();
    });
    option("tabindex", null, (cm, val) => cm.display.input.getField().tabIndex = val || "");
    option("autofocus", null);
    option("direction", "ltr", (cm, val) => cm.doc.setDirection(val), true);
    option("phrases", null);
}
exports.defineOptions = defineOptions;
function dragDropChanged(cm, value, old) {
    let wasOn = old && old != exports.Init;
    if (!value != !wasOn) {
        let funcs = cm.display.dragFunctions;
        let toggle = value ? event_js_1.on : event_js_1.off;
        toggle(cm.display.scroller, "dragstart", funcs.start);
        toggle(cm.display.scroller, "dragenter", funcs.enter);
        toggle(cm.display.scroller, "dragover", funcs.over);
        toggle(cm.display.scroller, "dragleave", funcs.leave);
        toggle(cm.display.scroller, "drop", funcs.drop);
    }
}
function wrappingChanged(cm) {
    if (cm.options.lineWrapping) {
        (0, dom_js_1.addClass)(cm.display.wrapper, "CodeMirror-wrap");
        cm.display.sizer.style.minWidth = "";
        cm.display.sizerWidth = null;
    }
    else {
        (0, dom_js_1.rmClass)(cm.display.wrapper, "CodeMirror-wrap");
        (0, spans_js_1.findMaxLine)(cm);
    }
    (0, position_measurement_js_1.estimateLineHeights)(cm);
    (0, view_tracking_js_1.regChange)(cm);
    (0, position_measurement_js_1.clearCaches)(cm);
    setTimeout(() => (0, scrollbars_js_1.updateScrollbars)(cm), 100);
}
