"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeMirror = void 0;
const Display_js_1 = require("../display/Display.js");
const focus_js_1 = require("../display/focus.js");
const line_numbers_js_1 = require("../display/line_numbers.js");
const operations_js_1 = require("../display/operations.js");
const scrollbars_js_1 = require("../display/scrollbars.js");
const scroll_events_js_1 = require("../display/scroll_events.js");
const scrolling_js_1 = require("../display/scrolling.js");
const pos_js_1 = require("../line/pos.js");
const position_measurement_js_1 = require("../measurement/position_measurement.js");
const widgets_js_1 = require("../measurement/widgets.js");
const Doc_js_1 = __importDefault(require("../model/Doc.js"));
const document_data_js_1 = require("../model/document_data.js");
const selection_js_1 = require("../model/selection.js");
const selection_updates_js_1 = require("../model/selection_updates.js");
const browser_js_1 = require("../util/browser.js");
const event_js_1 = require("../util/event.js");
const misc_js_1 = require("../util/misc.js");
const drop_events_js_1 = require("./drop_events.js");
const global_events_js_1 = require("./global_events.js");
const key_events_js_1 = require("./key_events.js");
const mouse_events_js_1 = require("./mouse_events.js");
const utils_js_1 = require("./utils.js");
const options_js_1 = require("./options.js");
// A CodeMirror instance represents an editor. This is the object
// that user code is usually dealing with.
function CodeMirror(place, options) {
    if (!(this instanceof CodeMirror))
        return new CodeMirror(place, options);
    this.options = options = options ? (0, misc_js_1.copyObj)(options) : {};
    // Determine effective options based on given values and defaults.
    (0, misc_js_1.copyObj)(options_js_1.defaults, options, false);
    let doc = options.value;
    if (typeof doc == "string")
        doc = new Doc_js_1.default(doc, options.mode, null, options.lineSeparator, options.direction);
    else if (options.mode)
        doc.modeOption = options.mode;
    this.doc = doc;
    let input = new CodeMirror.inputStyles[options.inputStyle](this);
    let display = this.display = new Display_js_1.Display(place, doc, input, options);
    display.wrapper.CodeMirror = this;
    (0, utils_js_1.themeChanged)(this);
    if (options.lineWrapping)
        this.display.wrapper.className += " CodeMirror-wrap";
    (0, scrollbars_js_1.initScrollbars)(this);
    this.state = {
        keyMaps: [],
        overlays: [],
        modeGen: 0,
        overwrite: false,
        delayingBlurEvent: false,
        focused: false,
        suppressEdits: false,
        pasteIncoming: -1, cutIncoming: -1,
        selectingText: false,
        draggingText: false,
        highlight: new misc_js_1.Delayed(),
        keySeq: null,
        specialChars: null
    };
    if (options.autofocus && !browser_js_1.mobile)
        display.input.focus();
    // Override magic textarea content restore that IE sometimes does
    // on our hidden textarea on reload
    if (browser_js_1.ie && browser_js_1.ie_version < 11)
        setTimeout(() => this.display.input.reset(true), 20);
    registerEventHandlers(this);
    (0, global_events_js_1.ensureGlobalHandlers)();
    (0, operations_js_1.startOperation)(this);
    this.curOp.forceUpdate = true;
    (0, document_data_js_1.attachDoc)(this, doc);
    if ((options.autofocus && !browser_js_1.mobile) || this.hasFocus())
        setTimeout(() => {
            if (this.hasFocus() && !this.state.focused)
                (0, focus_js_1.onFocus)(this);
        }, 20);
    else
        (0, focus_js_1.onBlur)(this);
    for (let opt in options_js_1.optionHandlers)
        if (options_js_1.optionHandlers.hasOwnProperty(opt))
            options_js_1.optionHandlers[opt](this, options[opt], options_js_1.Init);
    (0, line_numbers_js_1.maybeUpdateLineNumberWidth)(this);
    if (options.finishInit)
        options.finishInit(this);
    for (let i = 0; i < initHooks.length; ++i)
        initHooks[i](this);
    (0, operations_js_1.endOperation)(this);
    // Suppress optimizelegibility in Webkit, since it breaks text
    // measuring on line wrapping boundaries.
    if (browser_js_1.webkit && options.lineWrapping &&
        getComputedStyle(display.lineDiv).textRendering == "optimizelegibility")
        display.lineDiv.style.textRendering = "auto";
}
exports.CodeMirror = CodeMirror;
// The default configuration options.
CodeMirror.defaults = options_js_1.defaults;
// Functions to run when options are changed.
CodeMirror.optionHandlers = options_js_1.optionHandlers;
exports.default = CodeMirror;
// Attach the necessary event handlers when initializing the editor
function registerEventHandlers(cm) {
    let d = cm.display;
    (0, event_js_1.on)(d.scroller, "mousedown", (0, operations_js_1.operation)(cm, mouse_events_js_1.onMouseDown));
    // Older IE's will not fire a second mousedown for a double click
    if (browser_js_1.ie && browser_js_1.ie_version < 11)
        (0, event_js_1.on)(d.scroller, "dblclick", (0, operations_js_1.operation)(cm, e => {
            if ((0, event_js_1.signalDOMEvent)(cm, e))
                return;
            let pos = (0, position_measurement_js_1.posFromMouse)(cm, e);
            if (!pos || (0, mouse_events_js_1.clickInGutter)(cm, e) || (0, widgets_js_1.eventInWidget)(cm.display, e))
                return;
            (0, event_js_1.e_preventDefault)(e);
            let word = cm.findWordAt(pos);
            (0, selection_updates_js_1.extendSelection)(cm.doc, word.anchor, word.head);
        }));
    else
        (0, event_js_1.on)(d.scroller, "dblclick", e => (0, event_js_1.signalDOMEvent)(cm, e) || (0, event_js_1.e_preventDefault)(e));
    // Some browsers fire contextmenu *after* opening the menu, at
    // which point we can't mess with it anymore. Context menu is
    // handled in onMouseDown for these browsers.
    (0, event_js_1.on)(d.scroller, "contextmenu", e => (0, mouse_events_js_1.onContextMenu)(cm, e));
    (0, event_js_1.on)(d.input.getField(), "contextmenu", e => {
        if (!d.scroller.contains(e.target))
            (0, mouse_events_js_1.onContextMenu)(cm, e);
    });
    // Used to suppress mouse event handling when a touch happens
    let touchFinished, prevTouch = { end: 0 };
    function finishTouch() {
        if (d.activeTouch) {
            touchFinished = setTimeout(() => d.activeTouch = null, 1000);
            prevTouch = d.activeTouch;
            prevTouch.end = +new Date;
        }
    }
    function isMouseLikeTouchEvent(e) {
        if (e.touches.length != 1)
            return false;
        let touch = e.touches[0];
        return touch.radiusX <= 1 && touch.radiusY <= 1;
    }
    function farAway(touch, other) {
        if (other.left == null)
            return true;
        let dx = other.left - touch.left, dy = other.top - touch.top;
        return dx * dx + dy * dy > 20 * 20;
    }
    (0, event_js_1.on)(d.scroller, "touchstart", e => {
        if (!(0, event_js_1.signalDOMEvent)(cm, e) && !isMouseLikeTouchEvent(e) && !(0, mouse_events_js_1.clickInGutter)(cm, e)) {
            d.input.ensurePolled();
            clearTimeout(touchFinished);
            let now = +new Date;
            d.activeTouch = { start: now, moved: false,
                prev: now - prevTouch.end <= 300 ? prevTouch : null };
            if (e.touches.length == 1) {
                d.activeTouch.left = e.touches[0].pageX;
                d.activeTouch.top = e.touches[0].pageY;
            }
        }
    });
    (0, event_js_1.on)(d.scroller, "touchmove", () => {
        if (d.activeTouch)
            d.activeTouch.moved = true;
    });
    (0, event_js_1.on)(d.scroller, "touchend", e => {
        let touch = d.activeTouch;
        if (touch && !(0, widgets_js_1.eventInWidget)(d, e) && touch.left != null &&
            !touch.moved && new Date - touch.start < 300) {
            let pos = cm.coordsChar(d.activeTouch, "page"), range;
            if (!touch.prev || farAway(touch, touch.prev)) // Single tap
                range = new selection_js_1.Range(pos, pos);
            else if (!touch.prev.prev || farAway(touch, touch.prev.prev)) // Double tap
                range = cm.findWordAt(pos);
            else // Triple tap
                range = new selection_js_1.Range((0, pos_js_1.Pos)(pos.line, 0), (0, pos_js_1.clipPos)(cm.doc, (0, pos_js_1.Pos)(pos.line + 1, 0)));
            cm.setSelection(range.anchor, range.head);
            cm.focus();
            (0, event_js_1.e_preventDefault)(e);
        }
        finishTouch();
    });
    (0, event_js_1.on)(d.scroller, "touchcancel", finishTouch);
    // Sync scrolling between fake scrollbars and real scrollable
    // area, ensure viewport is updated when scrolling.
    (0, event_js_1.on)(d.scroller, "scroll", () => {
        if (d.scroller.clientHeight) {
            (0, scrolling_js_1.updateScrollTop)(cm, d.scroller.scrollTop);
            (0, scrolling_js_1.setScrollLeft)(cm, d.scroller.scrollLeft, true);
            (0, event_js_1.signal)(cm, "scroll", cm);
        }
    });
    // Listen to wheel events in order to try and update the viewport on time.
    (0, event_js_1.on)(d.scroller, "mousewheel", e => (0, scroll_events_js_1.onScrollWheel)(cm, e));
    (0, event_js_1.on)(d.scroller, "DOMMouseScroll", e => (0, scroll_events_js_1.onScrollWheel)(cm, e));
    // Prevent wrapper from ever scrolling
    (0, event_js_1.on)(d.wrapper, "scroll", () => d.wrapper.scrollTop = d.wrapper.scrollLeft = 0);
    d.dragFunctions = {
        enter: e => { if (!(0, event_js_1.signalDOMEvent)(cm, e))
            (0, event_js_1.e_stop)(e); },
        over: e => { if (!(0, event_js_1.signalDOMEvent)(cm, e)) {
            (0, drop_events_js_1.onDragOver)(cm, e);
            (0, event_js_1.e_stop)(e);
        } },
        start: e => (0, drop_events_js_1.onDragStart)(cm, e),
        drop: (0, operations_js_1.operation)(cm, drop_events_js_1.onDrop),
        leave: e => { if (!(0, event_js_1.signalDOMEvent)(cm, e)) {
            (0, drop_events_js_1.clearDragCursor)(cm);
        } }
    };
    let inp = d.input.getField();
    (0, event_js_1.on)(inp, "keyup", e => key_events_js_1.onKeyUp.call(cm, e));
    (0, event_js_1.on)(inp, "keydown", (0, operations_js_1.operation)(cm, key_events_js_1.onKeyDown));
    (0, event_js_1.on)(inp, "keypress", (0, operations_js_1.operation)(cm, key_events_js_1.onKeyPress));
    (0, event_js_1.on)(inp, "focus", e => (0, focus_js_1.onFocus)(cm, e));
    (0, event_js_1.on)(inp, "blur", e => (0, focus_js_1.onBlur)(cm, e));
}
let initHooks = [];
CodeMirror.defineInitHook = f => initHooks.push(f);
