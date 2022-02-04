"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onBlur = exports.onFocus = exports.delayBlurEvent = exports.ensureFocus = void 0;
const selection_js_1 = require("./selection.js");
const browser_js_1 = require("../util/browser.js");
const dom_js_1 = require("../util/dom.js");
const event_js_1 = require("../util/event.js");
function ensureFocus(cm) {
    if (!cm.hasFocus()) {
        cm.display.input.focus();
        if (!cm.state.focused)
            onFocus(cm);
    }
}
exports.ensureFocus = ensureFocus;
function delayBlurEvent(cm) {
    cm.state.delayingBlurEvent = true;
    setTimeout(() => {
        if (cm.state.delayingBlurEvent) {
            cm.state.delayingBlurEvent = false;
            if (cm.state.focused)
                onBlur(cm);
        }
    }, 100);
}
exports.delayBlurEvent = delayBlurEvent;
function onFocus(cm, e) {
    if (cm.state.delayingBlurEvent && !cm.state.draggingText)
        cm.state.delayingBlurEvent = false;
    if (cm.options.readOnly == "nocursor")
        return;
    if (!cm.state.focused) {
        (0, event_js_1.signal)(cm, "focus", cm, e);
        cm.state.focused = true;
        (0, dom_js_1.addClass)(cm.display.wrapper, "CodeMirror-focused");
        // This test prevents this from firing when a context
        // menu is closed (since the input reset would kill the
        // select-all detection hack)
        if (!cm.curOp && cm.display.selForContextMenu != cm.doc.sel) {
            cm.display.input.reset();
            if (browser_js_1.webkit)
                setTimeout(() => cm.display.input.reset(true), 20); // Issue #1730
        }
        cm.display.input.receivedFocus();
    }
    (0, selection_js_1.restartBlink)(cm);
}
exports.onFocus = onFocus;
function onBlur(cm, e) {
    if (cm.state.delayingBlurEvent)
        return;
    if (cm.state.focused) {
        (0, event_js_1.signal)(cm, "blur", cm, e);
        cm.state.focused = false;
        (0, dom_js_1.rmClass)(cm.display.wrapper, "CodeMirror-focused");
    }
    clearInterval(cm.display.blinker);
    setTimeout(() => { if (!cm.state.focused)
        cm.display.shift = false; }, 150);
}
exports.onBlur = onBlur;
