"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hiddenTextarea = exports.disableBrowserMagic = exports.copyableRanges = exports.triggerElectric = exports.handlePaste = exports.applyTextInput = exports.setLastCopied = exports.lastCopied = void 0;
const operations_js_1 = require("../display/operations.js");
const scrolling_js_1 = require("../display/scrolling.js");
const pos_js_1 = require("../line/pos.js");
const utils_line_js_1 = require("../line/utils_line.js");
const changes_js_1 = require("../model/changes.js");
const browser_js_1 = require("../util/browser.js");
const dom_js_1 = require("../util/dom.js");
const misc_js_1 = require("../util/misc.js");
const operation_group_js_1 = require("../util/operation_group.js");
const feature_detection_js_1 = require("../util/feature_detection.js");
const indent_js_1 = require("./indent.js");
// This will be set to a {lineWise: bool, text: [string]} object, so
// that, when pasting, we know what kind of selections the copied
// text was made out of.
exports.lastCopied = null;
function setLastCopied(newLastCopied) {
    exports.lastCopied = newLastCopied;
}
exports.setLastCopied = setLastCopied;
function applyTextInput(cm, inserted, deleted, sel, origin) {
    let doc = cm.doc;
    cm.display.shift = false;
    if (!sel)
        sel = doc.sel;
    let recent = +new Date - 200;
    let paste = origin == "paste" || cm.state.pasteIncoming > recent;
    let textLines = (0, feature_detection_js_1.splitLinesAuto)(inserted), multiPaste = null;
    // When pasting N lines into N selections, insert one line per selection
    if (paste && sel.ranges.length > 1) {
        if (exports.lastCopied && exports.lastCopied.text.join("\n") == inserted) {
            if (sel.ranges.length % exports.lastCopied.text.length == 0) {
                multiPaste = [];
                for (let i = 0; i < exports.lastCopied.text.length; i++)
                    multiPaste.push(doc.splitLines(exports.lastCopied.text[i]));
            }
        }
        else if (textLines.length == sel.ranges.length && cm.options.pasteLinesPerSelection) {
            multiPaste = (0, misc_js_1.map)(textLines, l => [l]);
        }
    }
    let updateInput = cm.curOp.updateInput;
    // Normal behavior is to insert the new text into every selection
    for (let i = sel.ranges.length - 1; i >= 0; i--) {
        let range = sel.ranges[i];
        let from = range.from(), to = range.to();
        if (range.empty()) {
            if (deleted && deleted > 0) // Handle deletion
                from = (0, pos_js_1.Pos)(from.line, from.ch - deleted);
            else if (cm.state.overwrite && !paste) // Handle overwrite
                to = (0, pos_js_1.Pos)(to.line, Math.min((0, utils_line_js_1.getLine)(doc, to.line).text.length, to.ch + (0, misc_js_1.lst)(textLines).length));
            else if (paste && exports.lastCopied && exports.lastCopied.lineWise && exports.lastCopied.text.join("\n") == textLines.join("\n"))
                from = to = (0, pos_js_1.Pos)(from.line, 0);
        }
        let changeEvent = { from: from, to: to, text: multiPaste ? multiPaste[i % multiPaste.length] : textLines,
            origin: origin || (paste ? "paste" : cm.state.cutIncoming > recent ? "cut" : "+input") };
        (0, changes_js_1.makeChange)(cm.doc, changeEvent);
        (0, operation_group_js_1.signalLater)(cm, "inputRead", cm, changeEvent);
    }
    if (inserted && !paste)
        triggerElectric(cm, inserted);
    (0, scrolling_js_1.ensureCursorVisible)(cm);
    if (cm.curOp.updateInput < 2)
        cm.curOp.updateInput = updateInput;
    cm.curOp.typing = true;
    cm.state.pasteIncoming = cm.state.cutIncoming = -1;
}
exports.applyTextInput = applyTextInput;
function handlePaste(e, cm) {
    let pasted = e.clipboardData && e.clipboardData.getData("Text");
    if (pasted) {
        e.preventDefault();
        if (!cm.isReadOnly() && !cm.options.disableInput)
            (0, operations_js_1.runInOp)(cm, () => applyTextInput(cm, pasted, 0, null, "paste"));
        return true;
    }
}
exports.handlePaste = handlePaste;
function triggerElectric(cm, inserted) {
    // When an 'electric' character is inserted, immediately trigger a reindent
    if (!cm.options.electricChars || !cm.options.smartIndent)
        return;
    let sel = cm.doc.sel;
    for (let i = sel.ranges.length - 1; i >= 0; i--) {
        let range = sel.ranges[i];
        if (range.head.ch > 100 || (i && sel.ranges[i - 1].head.line == range.head.line))
            continue;
        let mode = cm.getModeAt(range.head);
        let indented = false;
        if (mode.electricChars) {
            for (let j = 0; j < mode.electricChars.length; j++)
                if (inserted.indexOf(mode.electricChars.charAt(j)) > -1) {
                    indented = (0, indent_js_1.indentLine)(cm, range.head.line, "smart");
                    break;
                }
        }
        else if (mode.electricInput) {
            if (mode.electricInput.test((0, utils_line_js_1.getLine)(cm.doc, range.head.line).text.slice(0, range.head.ch)))
                indented = (0, indent_js_1.indentLine)(cm, range.head.line, "smart");
        }
        if (indented)
            (0, operation_group_js_1.signalLater)(cm, "electricInput", cm, range.head.line);
    }
}
exports.triggerElectric = triggerElectric;
function copyableRanges(cm) {
    let text = [], ranges = [];
    for (let i = 0; i < cm.doc.sel.ranges.length; i++) {
        let line = cm.doc.sel.ranges[i].head.line;
        let lineRange = { anchor: (0, pos_js_1.Pos)(line, 0), head: (0, pos_js_1.Pos)(line + 1, 0) };
        ranges.push(lineRange);
        text.push(cm.getRange(lineRange.anchor, lineRange.head));
    }
    return { text: text, ranges: ranges };
}
exports.copyableRanges = copyableRanges;
function disableBrowserMagic(field, spellcheck, autocorrect, autocapitalize) {
    field.setAttribute("autocorrect", autocorrect ? "" : "off");
    field.setAttribute("autocapitalize", autocapitalize ? "" : "off");
    field.setAttribute("spellcheck", !!spellcheck);
}
exports.disableBrowserMagic = disableBrowserMagic;
function hiddenTextarea() {
    let te = (0, dom_js_1.elt)("textarea", null, null, "position: absolute; bottom: -1em; padding: 0; width: 1px; height: 1em; min-height: 1em; outline: none");
    let div = (0, dom_js_1.elt)("div", [te], null, "overflow: hidden; position: relative; width: 3px; height: 0px;");
    // The textarea is kept positioned near the cursor to prevent the
    // fact that it'll be scrolled into view on input from scrolling
    // our fake cursor out of view. On webkit, when wrap=off, paste is
    // very slow. So make the area wide instead.
    if (browser_js_1.webkit)
        te.style.width = "1000px";
    else
        te.setAttribute("wrap", "off");
    // If border: 0; -- iOS fails to open keyboard (issue #1287)
    if (browser_js_1.ios)
        te.style.border = "1px solid black";
    disableBrowserMagic(te);
    return div;
}
exports.hiddenTextarea = hiddenTextarea;
