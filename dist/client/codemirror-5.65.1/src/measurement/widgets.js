"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventInWidget = exports.widgetHeight = void 0;
const dom_js_1 = require("../util/dom.js");
const event_js_1 = require("../util/event.js");
function widgetHeight(widget) {
    if (widget.height != null)
        return widget.height;
    let cm = widget.doc.cm;
    if (!cm)
        return 0;
    if (!(0, dom_js_1.contains)(document.body, widget.node)) {
        let parentStyle = "position: relative;";
        if (widget.coverGutter)
            parentStyle += "margin-left: -" + cm.display.gutters.offsetWidth + "px;";
        if (widget.noHScroll)
            parentStyle += "width: " + cm.display.wrapper.clientWidth + "px;";
        (0, dom_js_1.removeChildrenAndAdd)(cm.display.measure, (0, dom_js_1.elt)("div", [widget.node], null, parentStyle));
    }
    return widget.height = widget.node.parentNode.offsetHeight;
}
exports.widgetHeight = widgetHeight;
// Return true when the given mouse event happened in a widget
function eventInWidget(display, e) {
    for (let n = (0, event_js_1.e_target)(e); n != display.wrapper; n = n.parentNode) {
        if (!n || (n.nodeType == 1 && n.getAttribute("cm-ignore-events") == "true") ||
            (n.parentNode == display.sizer && n != display.mover))
            return true;
    }
}
exports.eventInWidget = eventInWidget;
