"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onContextMenu = exports.clickInGutter = exports.onMouseDown = void 0;
const focus_js_1 = require("../display/focus.js");
const operations_js_1 = require("../display/operations.js");
const update_lines_js_1 = require("../display/update_lines.js");
const pos_js_1 = require("../line/pos.js");
const utils_line_js_1 = require("../line/utils_line.js");
const position_measurement_js_1 = require("../measurement/position_measurement.js");
const widgets_js_1 = require("../measurement/widgets.js");
const selection_js_1 = require("../model/selection.js");
const selection_updates_js_1 = require("../model/selection_updates.js");
const browser_js_1 = require("../util/browser.js");
const bidi_js_1 = require("../util/bidi.js");
const dom_js_1 = require("../util/dom.js");
const event_js_1 = require("../util/event.js");
const feature_detection_js_1 = require("../util/feature_detection.js");
const misc_js_1 = require("../util/misc.js");
const keymap_js_1 = require("../input/keymap.js");
const misc_js_2 = require("../util/misc.js");
const key_events_js_1 = require("./key_events.js");
const commands_js_1 = require("./commands.js");
const DOUBLECLICK_DELAY = 400;
class PastClick {
    constructor(time, pos, button) {
        this.time = time;
        this.pos = pos;
        this.button = button;
    }
    compare(time, pos, button) {
        return this.time + DOUBLECLICK_DELAY > time &&
            (0, pos_js_1.cmp)(pos, this.pos) == 0 && button == this.button;
    }
}
let lastClick, lastDoubleClick;
function clickRepeat(pos, button) {
    let now = +new Date;
    if (lastDoubleClick && lastDoubleClick.compare(now, pos, button)) {
        lastClick = lastDoubleClick = null;
        return "triple";
    }
    else if (lastClick && lastClick.compare(now, pos, button)) {
        lastDoubleClick = new PastClick(now, pos, button);
        lastClick = null;
        return "double";
    }
    else {
        lastClick = new PastClick(now, pos, button);
        lastDoubleClick = null;
        return "single";
    }
}
// A mouse down can be a single click, double click, triple click,
// start of selection drag, start of text drag, new cursor
// (ctrl-click), rectangle drag (alt-drag), or xwin
// middle-click-paste. Or it might be a click on something we should
// not interfere with, such as a scrollbar or widget.
function onMouseDown(e) {
    let cm = this, display = cm.display;
    if ((0, event_js_1.signalDOMEvent)(cm, e) || display.activeTouch && display.input.supportsTouch())
        return;
    display.input.ensurePolled();
    display.shift = e.shiftKey;
    if ((0, widgets_js_1.eventInWidget)(display, e)) {
        if (!browser_js_1.webkit) {
            // Briefly turn off draggability, to allow widgets to do
            // normal dragging things.
            display.scroller.draggable = false;
            setTimeout(() => display.scroller.draggable = true, 100);
        }
        return;
    }
    if (clickInGutter(cm, e))
        return;
    let pos = (0, position_measurement_js_1.posFromMouse)(cm, e), button = (0, event_js_1.e_button)(e), repeat = pos ? clickRepeat(pos, button) : "single";
    window.focus();
    // #3261: make sure, that we're not starting a second selection
    if (button == 1 && cm.state.selectingText)
        cm.state.selectingText(e);
    if (pos && handleMappedButton(cm, button, pos, repeat, e))
        return;
    if (button == 1) {
        if (pos)
            leftButtonDown(cm, pos, repeat, e);
        else if ((0, event_js_1.e_target)(e) == display.scroller)
            (0, event_js_1.e_preventDefault)(e);
    }
    else if (button == 2) {
        if (pos)
            (0, selection_updates_js_1.extendSelection)(cm.doc, pos);
        setTimeout(() => display.input.focus(), 20);
    }
    else if (button == 3) {
        if (browser_js_1.captureRightClick)
            cm.display.input.onContextMenu(e);
        else
            (0, focus_js_1.delayBlurEvent)(cm);
    }
}
exports.onMouseDown = onMouseDown;
function handleMappedButton(cm, button, pos, repeat, event) {
    let name = "Click";
    if (repeat == "double")
        name = "Double" + name;
    else if (repeat == "triple")
        name = "Triple" + name;
    name = (button == 1 ? "Left" : button == 2 ? "Middle" : "Right") + name;
    return (0, key_events_js_1.dispatchKey)(cm, (0, keymap_js_1.addModifierNames)(name, event), event, bound => {
        if (typeof bound == "string")
            bound = commands_js_1.commands[bound];
        if (!bound)
            return false;
        let done = false;
        try {
            if (cm.isReadOnly())
                cm.state.suppressEdits = true;
            done = bound(cm, pos) != misc_js_2.Pass;
        }
        finally {
            cm.state.suppressEdits = false;
        }
        return done;
    });
}
function configureMouse(cm, repeat, event) {
    let option = cm.getOption("configureMouse");
    let value = option ? option(cm, repeat, event) : {};
    if (value.unit == null) {
        let rect = browser_js_1.chromeOS ? event.shiftKey && event.metaKey : event.altKey;
        value.unit = rect ? "rectangle" : repeat == "single" ? "char" : repeat == "double" ? "word" : "line";
    }
    if (value.extend == null || cm.doc.extend)
        value.extend = cm.doc.extend || event.shiftKey;
    if (value.addNew == null)
        value.addNew = browser_js_1.mac ? event.metaKey : event.ctrlKey;
    if (value.moveOnDrag == null)
        value.moveOnDrag = !(browser_js_1.mac ? event.altKey : event.ctrlKey);
    return value;
}
function leftButtonDown(cm, pos, repeat, event) {
    if (browser_js_1.ie)
        setTimeout((0, misc_js_1.bind)(focus_js_1.ensureFocus, cm), 0);
    else
        cm.curOp.focus = (0, dom_js_1.activeElt)();
    let behavior = configureMouse(cm, repeat, event);
    let sel = cm.doc.sel, contained;
    if (cm.options.dragDrop && feature_detection_js_1.dragAndDrop && !cm.isReadOnly() &&
        repeat == "single" && (contained = sel.contains(pos)) > -1 &&
        ((0, pos_js_1.cmp)((contained = sel.ranges[contained]).from(), pos) < 0 || pos.xRel > 0) &&
        ((0, pos_js_1.cmp)(contained.to(), pos) > 0 || pos.xRel < 0))
        leftButtonStartDrag(cm, event, pos, behavior);
    else
        leftButtonSelect(cm, event, pos, behavior);
}
// Start a text drag. When it ends, see if any dragging actually
// happen, and treat as a click if it didn't.
function leftButtonStartDrag(cm, event, pos, behavior) {
    let display = cm.display, moved = false;
    let dragEnd = (0, operations_js_1.operation)(cm, e => {
        if (browser_js_1.webkit)
            display.scroller.draggable = false;
        cm.state.draggingText = false;
        if (cm.state.delayingBlurEvent) {
            if (cm.hasFocus())
                cm.state.delayingBlurEvent = false;
            else
                (0, focus_js_1.delayBlurEvent)(cm);
        }
        (0, event_js_1.off)(display.wrapper.ownerDocument, "mouseup", dragEnd);
        (0, event_js_1.off)(display.wrapper.ownerDocument, "mousemove", mouseMove);
        (0, event_js_1.off)(display.scroller, "dragstart", dragStart);
        (0, event_js_1.off)(display.scroller, "drop", dragEnd);
        if (!moved) {
            (0, event_js_1.e_preventDefault)(e);
            if (!behavior.addNew)
                (0, selection_updates_js_1.extendSelection)(cm.doc, pos, null, null, behavior.extend);
            // Work around unexplainable focus problem in IE9 (#2127) and Chrome (#3081)
            if ((browser_js_1.webkit && !browser_js_1.safari) || browser_js_1.ie && browser_js_1.ie_version == 9)
                setTimeout(() => { display.wrapper.ownerDocument.body.focus({ preventScroll: true }); display.input.focus(); }, 20);
            else
                display.input.focus();
        }
    });
    let mouseMove = function (e2) {
        moved = moved || Math.abs(event.clientX - e2.clientX) + Math.abs(event.clientY - e2.clientY) >= 10;
    };
    let dragStart = () => moved = true;
    // Let the drag handler handle this.
    if (browser_js_1.webkit)
        display.scroller.draggable = true;
    cm.state.draggingText = dragEnd;
    dragEnd.copy = !behavior.moveOnDrag;
    (0, event_js_1.on)(display.wrapper.ownerDocument, "mouseup", dragEnd);
    (0, event_js_1.on)(display.wrapper.ownerDocument, "mousemove", mouseMove);
    (0, event_js_1.on)(display.scroller, "dragstart", dragStart);
    (0, event_js_1.on)(display.scroller, "drop", dragEnd);
    cm.state.delayingBlurEvent = true;
    setTimeout(() => display.input.focus(), 20);
    // IE's approach to draggable
    if (display.scroller.dragDrop)
        display.scroller.dragDrop();
}
function rangeForUnit(cm, pos, unit) {
    if (unit == "char")
        return new selection_js_1.Range(pos, pos);
    if (unit == "word")
        return cm.findWordAt(pos);
    if (unit == "line")
        return new selection_js_1.Range((0, pos_js_1.Pos)(pos.line, 0), (0, pos_js_1.clipPos)(cm.doc, (0, pos_js_1.Pos)(pos.line + 1, 0)));
    let result = unit(cm, pos);
    return new selection_js_1.Range(result.from, result.to);
}
// Normal selection, as opposed to text dragging.
function leftButtonSelect(cm, event, start, behavior) {
    if (browser_js_1.ie)
        (0, focus_js_1.delayBlurEvent)(cm);
    let display = cm.display, doc = cm.doc;
    (0, event_js_1.e_preventDefault)(event);
    let ourRange, ourIndex, startSel = doc.sel, ranges = startSel.ranges;
    if (behavior.addNew && !behavior.extend) {
        ourIndex = doc.sel.contains(start);
        if (ourIndex > -1)
            ourRange = ranges[ourIndex];
        else
            ourRange = new selection_js_1.Range(start, start);
    }
    else {
        ourRange = doc.sel.primary();
        ourIndex = doc.sel.primIndex;
    }
    if (behavior.unit == "rectangle") {
        if (!behavior.addNew)
            ourRange = new selection_js_1.Range(start, start);
        start = (0, position_measurement_js_1.posFromMouse)(cm, event, true, true);
        ourIndex = -1;
    }
    else {
        let range = rangeForUnit(cm, start, behavior.unit);
        if (behavior.extend)
            ourRange = (0, selection_updates_js_1.extendRange)(ourRange, range.anchor, range.head, behavior.extend);
        else
            ourRange = range;
    }
    if (!behavior.addNew) {
        ourIndex = 0;
        (0, selection_updates_js_1.setSelection)(doc, new selection_js_1.Selection([ourRange], 0), misc_js_1.sel_mouse);
        startSel = doc.sel;
    }
    else if (ourIndex == -1) {
        ourIndex = ranges.length;
        (0, selection_updates_js_1.setSelection)(doc, (0, selection_js_1.normalizeSelection)(cm, ranges.concat([ourRange]), ourIndex), { scroll: false, origin: "*mouse" });
    }
    else if (ranges.length > 1 && ranges[ourIndex].empty() && behavior.unit == "char" && !behavior.extend) {
        (0, selection_updates_js_1.setSelection)(doc, (0, selection_js_1.normalizeSelection)(cm, ranges.slice(0, ourIndex).concat(ranges.slice(ourIndex + 1)), 0), { scroll: false, origin: "*mouse" });
        startSel = doc.sel;
    }
    else {
        (0, selection_updates_js_1.replaceOneSelection)(doc, ourIndex, ourRange, misc_js_1.sel_mouse);
    }
    let lastPos = start;
    function extendTo(pos) {
        if ((0, pos_js_1.cmp)(lastPos, pos) == 0)
            return;
        lastPos = pos;
        if (behavior.unit == "rectangle") {
            let ranges = [], tabSize = cm.options.tabSize;
            let startCol = (0, misc_js_1.countColumn)((0, utils_line_js_1.getLine)(doc, start.line).text, start.ch, tabSize);
            let posCol = (0, misc_js_1.countColumn)((0, utils_line_js_1.getLine)(doc, pos.line).text, pos.ch, tabSize);
            let left = Math.min(startCol, posCol), right = Math.max(startCol, posCol);
            for (let line = Math.min(start.line, pos.line), end = Math.min(cm.lastLine(), Math.max(start.line, pos.line)); line <= end; line++) {
                let text = (0, utils_line_js_1.getLine)(doc, line).text, leftPos = (0, misc_js_1.findColumn)(text, left, tabSize);
                if (left == right)
                    ranges.push(new selection_js_1.Range((0, pos_js_1.Pos)(line, leftPos), (0, pos_js_1.Pos)(line, leftPos)));
                else if (text.length > leftPos)
                    ranges.push(new selection_js_1.Range((0, pos_js_1.Pos)(line, leftPos), (0, pos_js_1.Pos)(line, (0, misc_js_1.findColumn)(text, right, tabSize))));
            }
            if (!ranges.length)
                ranges.push(new selection_js_1.Range(start, start));
            (0, selection_updates_js_1.setSelection)(doc, (0, selection_js_1.normalizeSelection)(cm, startSel.ranges.slice(0, ourIndex).concat(ranges), ourIndex), { origin: "*mouse", scroll: false });
            cm.scrollIntoView(pos);
        }
        else {
            let oldRange = ourRange;
            let range = rangeForUnit(cm, pos, behavior.unit);
            let anchor = oldRange.anchor, head;
            if ((0, pos_js_1.cmp)(range.anchor, anchor) > 0) {
                head = range.head;
                anchor = (0, pos_js_1.minPos)(oldRange.from(), range.anchor);
            }
            else {
                head = range.anchor;
                anchor = (0, pos_js_1.maxPos)(oldRange.to(), range.head);
            }
            let ranges = startSel.ranges.slice(0);
            ranges[ourIndex] = bidiSimplify(cm, new selection_js_1.Range((0, pos_js_1.clipPos)(doc, anchor), head));
            (0, selection_updates_js_1.setSelection)(doc, (0, selection_js_1.normalizeSelection)(cm, ranges, ourIndex), misc_js_1.sel_mouse);
        }
    }
    let editorSize = display.wrapper.getBoundingClientRect();
    // Used to ensure timeout re-tries don't fire when another extend
    // happened in the meantime (clearTimeout isn't reliable -- at
    // least on Chrome, the timeouts still happen even when cleared,
    // if the clear happens after their scheduled firing time).
    let counter = 0;
    function extend(e) {
        let curCount = ++counter;
        let cur = (0, position_measurement_js_1.posFromMouse)(cm, e, true, behavior.unit == "rectangle");
        if (!cur)
            return;
        if ((0, pos_js_1.cmp)(cur, lastPos) != 0) {
            cm.curOp.focus = (0, dom_js_1.activeElt)();
            extendTo(cur);
            let visible = (0, update_lines_js_1.visibleLines)(display, doc);
            if (cur.line >= visible.to || cur.line < visible.from)
                setTimeout((0, operations_js_1.operation)(cm, () => { if (counter == curCount)
                    extend(e); }), 150);
        }
        else {
            let outside = e.clientY < editorSize.top ? -20 : e.clientY > editorSize.bottom ? 20 : 0;
            if (outside)
                setTimeout((0, operations_js_1.operation)(cm, () => {
                    if (counter != curCount)
                        return;
                    display.scroller.scrollTop += outside;
                    extend(e);
                }), 50);
        }
    }
    function done(e) {
        cm.state.selectingText = false;
        counter = Infinity;
        // If e is null or undefined we interpret this as someone trying
        // to explicitly cancel the selection rather than the user
        // letting go of the mouse button.
        if (e) {
            (0, event_js_1.e_preventDefault)(e);
            display.input.focus();
        }
        (0, event_js_1.off)(display.wrapper.ownerDocument, "mousemove", move);
        (0, event_js_1.off)(display.wrapper.ownerDocument, "mouseup", up);
        doc.history.lastSelOrigin = null;
    }
    let move = (0, operations_js_1.operation)(cm, e => {
        if (e.buttons === 0 || !(0, event_js_1.e_button)(e))
            done(e);
        else
            extend(e);
    });
    let up = (0, operations_js_1.operation)(cm, done);
    cm.state.selectingText = up;
    (0, event_js_1.on)(display.wrapper.ownerDocument, "mousemove", move);
    (0, event_js_1.on)(display.wrapper.ownerDocument, "mouseup", up);
}
// Used when mouse-selecting to adjust the anchor to the proper side
// of a bidi jump depending on the visual position of the head.
function bidiSimplify(cm, range) {
    let { anchor, head } = range, anchorLine = (0, utils_line_js_1.getLine)(cm.doc, anchor.line);
    if ((0, pos_js_1.cmp)(anchor, head) == 0 && anchor.sticky == head.sticky)
        return range;
    let order = (0, bidi_js_1.getOrder)(anchorLine);
    if (!order)
        return range;
    let index = (0, bidi_js_1.getBidiPartAt)(order, anchor.ch, anchor.sticky), part = order[index];
    if (part.from != anchor.ch && part.to != anchor.ch)
        return range;
    let boundary = index + ((part.from == anchor.ch) == (part.level != 1) ? 0 : 1);
    if (boundary == 0 || boundary == order.length)
        return range;
    // Compute the relative visual position of the head compared to the
    // anchor (<0 is to the left, >0 to the right)
    let leftSide;
    if (head.line != anchor.line) {
        leftSide = (head.line - anchor.line) * (cm.doc.direction == "ltr" ? 1 : -1) > 0;
    }
    else {
        let headIndex = (0, bidi_js_1.getBidiPartAt)(order, head.ch, head.sticky);
        let dir = headIndex - index || (head.ch - anchor.ch) * (part.level == 1 ? -1 : 1);
        if (headIndex == boundary - 1 || headIndex == boundary)
            leftSide = dir < 0;
        else
            leftSide = dir > 0;
    }
    let usePart = order[boundary + (leftSide ? -1 : 0)];
    let from = leftSide == (usePart.level == 1);
    let ch = from ? usePart.from : usePart.to, sticky = from ? "after" : "before";
    return anchor.ch == ch && anchor.sticky == sticky ? range : new selection_js_1.Range(new pos_js_1.Pos(anchor.line, ch, sticky), head);
}
// Determines whether an event happened in the gutter, and fires the
// handlers for the corresponding event.
function gutterEvent(cm, e, type, prevent) {
    let mX, mY;
    if (e.touches) {
        mX = e.touches[0].clientX;
        mY = e.touches[0].clientY;
    }
    else {
        try {
            mX = e.clientX;
            mY = e.clientY;
        }
        catch (e) {
            return false;
        }
    }
    if (mX >= Math.floor(cm.display.gutters.getBoundingClientRect().right))
        return false;
    if (prevent)
        (0, event_js_1.e_preventDefault)(e);
    let display = cm.display;
    let lineBox = display.lineDiv.getBoundingClientRect();
    if (mY > lineBox.bottom || !(0, event_js_1.hasHandler)(cm, type))
        return (0, event_js_1.e_defaultPrevented)(e);
    mY -= lineBox.top - display.viewOffset;
    for (let i = 0; i < cm.display.gutterSpecs.length; ++i) {
        let g = display.gutters.childNodes[i];
        if (g && g.getBoundingClientRect().right >= mX) {
            let line = (0, utils_line_js_1.lineAtHeight)(cm.doc, mY);
            let gutter = cm.display.gutterSpecs[i];
            (0, event_js_1.signal)(cm, type, cm, line, gutter.className, e);
            return (0, event_js_1.e_defaultPrevented)(e);
        }
    }
}
function clickInGutter(cm, e) {
    return gutterEvent(cm, e, "gutterClick", true);
}
exports.clickInGutter = clickInGutter;
// CONTEXT MENU HANDLING
// To make the context menu work, we need to briefly unhide the
// textarea (making it as unobtrusive as possible) to let the
// right-click take effect on it.
function onContextMenu(cm, e) {
    if ((0, widgets_js_1.eventInWidget)(cm.display, e) || contextMenuInGutter(cm, e))
        return;
    if ((0, event_js_1.signalDOMEvent)(cm, e, "contextmenu"))
        return;
    if (!browser_js_1.captureRightClick)
        cm.display.input.onContextMenu(e);
}
exports.onContextMenu = onContextMenu;
function contextMenuInGutter(cm, e) {
    if (!(0, event_js_1.hasHandler)(cm, "gutterContextMenu"))
        return false;
    return gutterEvent(cm, e, "gutterContextMenu", false);
}
