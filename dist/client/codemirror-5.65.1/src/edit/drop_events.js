"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearDragCursor = exports.onDragOver = exports.onDragStart = exports.onDrop = void 0;
const selection_js_1 = require("../display/selection.js");
const operations_js_1 = require("../display/operations.js");
const pos_js_1 = require("../line/pos.js");
const position_measurement_js_1 = require("../measurement/position_measurement.js");
const widgets_js_1 = require("../measurement/widgets.js");
const changes_js_1 = require("../model/changes.js");
const change_measurement_js_1 = require("../model/change_measurement.js");
const selection_js_2 = require("../model/selection.js");
const selection_updates_js_1 = require("../model/selection_updates.js");
const browser_js_1 = require("../util/browser.js");
const dom_js_1 = require("../util/dom.js");
const event_js_1 = require("../util/event.js");
const misc_js_1 = require("../util/misc.js");
// Kludge to work around strange IE behavior where it'll sometimes
// re-fire a series of drag-related events right after the drop (#1551)
let lastDrop = 0;
function onDrop(e) {
    let cm = this;
    clearDragCursor(cm);
    if ((0, event_js_1.signalDOMEvent)(cm, e) || (0, widgets_js_1.eventInWidget)(cm.display, e))
        return;
    (0, event_js_1.e_preventDefault)(e);
    if (browser_js_1.ie)
        lastDrop = +new Date;
    let pos = (0, position_measurement_js_1.posFromMouse)(cm, e, true), files = e.dataTransfer.files;
    if (!pos || cm.isReadOnly())
        return;
    // Might be a file drop, in which case we simply extract the text
    // and insert it.
    if (files && files.length && window.FileReader && window.File) {
        let n = files.length, text = Array(n), read = 0;
        const markAsReadAndPasteIfAllFilesAreRead = () => {
            if (++read == n) {
                (0, operations_js_1.operation)(cm, () => {
                    pos = (0, pos_js_1.clipPos)(cm.doc, pos);
                    let change = { from: pos, to: pos,
                        text: cm.doc.splitLines(text.filter(t => t != null).join(cm.doc.lineSeparator())),
                        origin: "paste" };
                    (0, changes_js_1.makeChange)(cm.doc, change);
                    (0, selection_updates_js_1.setSelectionReplaceHistory)(cm.doc, (0, selection_js_2.simpleSelection)((0, pos_js_1.clipPos)(cm.doc, pos), (0, pos_js_1.clipPos)(cm.doc, (0, change_measurement_js_1.changeEnd)(change))));
                })();
            }
        };
        const readTextFromFile = (file, i) => {
            if (cm.options.allowDropFileTypes &&
                (0, misc_js_1.indexOf)(cm.options.allowDropFileTypes, file.type) == -1) {
                markAsReadAndPasteIfAllFilesAreRead();
                return;
            }
            let reader = new FileReader;
            reader.onerror = () => markAsReadAndPasteIfAllFilesAreRead();
            reader.onload = () => {
                let content = reader.result;
                if (/[\x00-\x08\x0e-\x1f]{2}/.test(content)) {
                    markAsReadAndPasteIfAllFilesAreRead();
                    return;
                }
                text[i] = content;
                markAsReadAndPasteIfAllFilesAreRead();
            };
            reader.readAsText(file);
        };
        for (let i = 0; i < files.length; i++)
            readTextFromFile(files[i], i);
    }
    else { // Normal drop
        // Don't do a replace if the drop happened inside of the selected text.
        if (cm.state.draggingText && cm.doc.sel.contains(pos) > -1) {
            cm.state.draggingText(e);
            // Ensure the editor is re-focused
            setTimeout(() => cm.display.input.focus(), 20);
            return;
        }
        try {
            let text = e.dataTransfer.getData("Text");
            if (text) {
                let selected;
                if (cm.state.draggingText && !cm.state.draggingText.copy)
                    selected = cm.listSelections();
                (0, selection_updates_js_1.setSelectionNoUndo)(cm.doc, (0, selection_js_2.simpleSelection)(pos, pos));
                if (selected)
                    for (let i = 0; i < selected.length; ++i)
                        (0, changes_js_1.replaceRange)(cm.doc, "", selected[i].anchor, selected[i].head, "drag");
                cm.replaceSelection(text, "around", "paste");
                cm.display.input.focus();
            }
        }
        catch (e) { }
    }
}
exports.onDrop = onDrop;
function onDragStart(cm, e) {
    if (browser_js_1.ie && (!cm.state.draggingText || +new Date - lastDrop < 100)) {
        (0, event_js_1.e_stop)(e);
        return;
    }
    if ((0, event_js_1.signalDOMEvent)(cm, e) || (0, widgets_js_1.eventInWidget)(cm.display, e))
        return;
    e.dataTransfer.setData("Text", cm.getSelection());
    e.dataTransfer.effectAllowed = "copyMove";
    // Use dummy image instead of default browsers image.
    // Recent Safari (~6.0.2) have a tendency to segfault when this happens, so we don't do it there.
    if (e.dataTransfer.setDragImage && !browser_js_1.safari) {
        let img = (0, dom_js_1.elt)("img", null, null, "position: fixed; left: 0; top: 0;");
        img.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
        if (browser_js_1.presto) {
            img.width = img.height = 1;
            cm.display.wrapper.appendChild(img);
            // Force a relayout, or Opera won't use our image for some obscure reason
            img._top = img.offsetTop;
        }
        e.dataTransfer.setDragImage(img, 0, 0);
        if (browser_js_1.presto)
            img.parentNode.removeChild(img);
    }
}
exports.onDragStart = onDragStart;
function onDragOver(cm, e) {
    let pos = (0, position_measurement_js_1.posFromMouse)(cm, e);
    if (!pos)
        return;
    let frag = document.createDocumentFragment();
    (0, selection_js_1.drawSelectionCursor)(cm, pos, frag);
    if (!cm.display.dragCursor) {
        cm.display.dragCursor = (0, dom_js_1.elt)("div", null, "CodeMirror-cursors CodeMirror-dragcursors");
        cm.display.lineSpace.insertBefore(cm.display.dragCursor, cm.display.cursorDiv);
    }
    (0, dom_js_1.removeChildrenAndAdd)(cm.display.dragCursor, frag);
}
exports.onDragOver = onDragOver;
function clearDragCursor(cm) {
    if (cm.display.dragCursor) {
        cm.display.lineSpace.removeChild(cm.display.dragCursor);
        cm.display.dragCursor = null;
    }
}
exports.clearDragCursor = clearDragCursor;
