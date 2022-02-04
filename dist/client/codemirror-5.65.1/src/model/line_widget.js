"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLineWidget = exports.LineWidget = void 0;
const operations_js_1 = require("../display/operations.js");
const scrolling_js_1 = require("../display/scrolling.js");
const view_tracking_js_1 = require("../display/view_tracking.js");
const spans_js_1 = require("../line/spans.js");
const utils_line_js_1 = require("../line/utils_line.js");
const widgets_js_1 = require("../measurement/widgets.js");
const changes_js_1 = require("./changes.js");
const event_js_1 = require("../util/event.js");
const operation_group_js_1 = require("../util/operation_group.js");
// Line widgets are block elements displayed above or below a line.
class LineWidget {
    constructor(doc, node, options) {
        if (options)
            for (let opt in options)
                if (options.hasOwnProperty(opt))
                    this[opt] = options[opt];
        this.doc = doc;
        this.node = node;
    }
    clear() {
        let cm = this.doc.cm, ws = this.line.widgets, line = this.line, no = (0, utils_line_js_1.lineNo)(line);
        if (no == null || !ws)
            return;
        for (let i = 0; i < ws.length; ++i)
            if (ws[i] == this)
                ws.splice(i--, 1);
        if (!ws.length)
            line.widgets = null;
        let height = (0, widgets_js_1.widgetHeight)(this);
        (0, utils_line_js_1.updateLineHeight)(line, Math.max(0, line.height - height));
        if (cm) {
            (0, operations_js_1.runInOp)(cm, () => {
                adjustScrollWhenAboveVisible(cm, line, -height);
                (0, view_tracking_js_1.regLineChange)(cm, no, "widget");
            });
            (0, operation_group_js_1.signalLater)(cm, "lineWidgetCleared", cm, this, no);
        }
    }
    changed() {
        let oldH = this.height, cm = this.doc.cm, line = this.line;
        this.height = null;
        let diff = (0, widgets_js_1.widgetHeight)(this) - oldH;
        if (!diff)
            return;
        if (!(0, spans_js_1.lineIsHidden)(this.doc, line))
            (0, utils_line_js_1.updateLineHeight)(line, line.height + diff);
        if (cm) {
            (0, operations_js_1.runInOp)(cm, () => {
                cm.curOp.forceUpdate = true;
                adjustScrollWhenAboveVisible(cm, line, diff);
                (0, operation_group_js_1.signalLater)(cm, "lineWidgetChanged", cm, this, (0, utils_line_js_1.lineNo)(line));
            });
        }
    }
}
exports.LineWidget = LineWidget;
(0, event_js_1.eventMixin)(LineWidget);
function adjustScrollWhenAboveVisible(cm, line, diff) {
    if ((0, spans_js_1.heightAtLine)(line) < ((cm.curOp && cm.curOp.scrollTop) || cm.doc.scrollTop))
        (0, scrolling_js_1.addToScrollTop)(cm, diff);
}
function addLineWidget(doc, handle, node, options) {
    let widget = new LineWidget(doc, node, options);
    let cm = doc.cm;
    if (cm && widget.noHScroll)
        cm.display.alignWidgets = true;
    (0, changes_js_1.changeLine)(doc, handle, "widget", line => {
        let widgets = line.widgets || (line.widgets = []);
        if (widget.insertAt == null)
            widgets.push(widget);
        else
            widgets.splice(Math.min(widgets.length, Math.max(0, widget.insertAt)), 0, widget);
        widget.line = line;
        if (cm && !(0, spans_js_1.lineIsHidden)(doc, line)) {
            let aboveVisible = (0, spans_js_1.heightAtLine)(line) < doc.scrollTop;
            (0, utils_line_js_1.updateLineHeight)(line, line.height + (0, widgets_js_1.widgetHeight)(widget));
            if (aboveVisible)
                (0, scrolling_js_1.addToScrollTop)(cm, widget.height);
            cm.curOp.forceUpdate = true;
        }
        return true;
    });
    if (cm)
        (0, operation_group_js_1.signalLater)(cm, "lineWidgetAdded", cm, widget, typeof handle == "number" ? handle : (0, utils_line_js_1.lineNo)(handle));
    return widget;
}
exports.addLineWidget = addLineWidget;
