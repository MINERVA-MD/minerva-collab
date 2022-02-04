"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectInput = exports.joinClasses = exports.addClass = exports.activeElt = exports.contains = exports.range = exports.eltP = exports.elt = exports.removeChildrenAndAdd = exports.removeChildren = exports.rmClass = exports.classTest = void 0;
const browser_js_1 = require("./browser.js");
function classTest(cls) { return new RegExp("(^|\\s)" + cls + "(?:$|\\s)\\s*"); }
exports.classTest = classTest;
let rmClass = function (node, cls) {
    let current = node.className;
    let match = classTest(cls).exec(current);
    if (match) {
        let after = current.slice(match.index + match[0].length);
        node.className = current.slice(0, match.index) + (after ? match[1] + after : "");
    }
};
exports.rmClass = rmClass;
function removeChildren(e) {
    for (let count = e.childNodes.length; count > 0; --count)
        e.removeChild(e.firstChild);
    return e;
}
exports.removeChildren = removeChildren;
function removeChildrenAndAdd(parent, e) {
    return removeChildren(parent).appendChild(e);
}
exports.removeChildrenAndAdd = removeChildrenAndAdd;
function elt(tag, content, className, style) {
    let e = document.createElement(tag);
    if (className)
        e.className = className;
    if (style)
        e.style.cssText = style;
    if (typeof content == "string")
        e.appendChild(document.createTextNode(content));
    else if (content)
        for (let i = 0; i < content.length; ++i)
            e.appendChild(content[i]);
    return e;
}
exports.elt = elt;
// wrapper for elt, which removes the elt from the accessibility tree
function eltP(tag, content, className, style) {
    let e = elt(tag, content, className, style);
    e.setAttribute("role", "presentation");
    return e;
}
exports.eltP = eltP;
if (document.createRange)
    exports.range = function (node, start, end, endNode) {
        let r = document.createRange();
        r.setEnd(endNode || node, end);
        r.setStart(node, start);
        return r;
    };
else
    exports.range = function (node, start, end) {
        let r = document.body.createTextRange();
        try {
            r.moveToElementText(node.parentNode);
        }
        catch (e) {
            return r;
        }
        r.collapse(true);
        r.moveEnd("character", end);
        r.moveStart("character", start);
        return r;
    };
function contains(parent, child) {
    if (child.nodeType == 3) // Android browser always returns false when child is a textnode
        child = child.parentNode;
    if (parent.contains)
        return parent.contains(child);
    do {
        if (child.nodeType == 11)
            child = child.host;
        if (child == parent)
            return true;
    } while (child = child.parentNode);
}
exports.contains = contains;
function activeElt() {
    // IE and Edge may throw an "Unspecified Error" when accessing document.activeElement.
    // IE < 10 will throw when accessed while the page is loading or in an iframe.
    // IE > 9 and Edge will throw when accessed in an iframe if document.body is unavailable.
    let activeElement;
    try {
        activeElement = document.activeElement;
    }
    catch (e) {
        activeElement = document.body || null;
    }
    while (activeElement && activeElement.shadowRoot && activeElement.shadowRoot.activeElement)
        activeElement = activeElement.shadowRoot.activeElement;
    return activeElement;
}
exports.activeElt = activeElt;
function addClass(node, cls) {
    let current = node.className;
    if (!classTest(cls).test(current))
        node.className += (current ? " " : "") + cls;
}
exports.addClass = addClass;
function joinClasses(a, b) {
    let as = a.split(" ");
    for (let i = 0; i < as.length; i++)
        if (as[i] && !classTest(as[i]).test(b))
            b += " " + as[i];
    return b;
}
exports.joinClasses = joinClasses;
let selectInput = function (node) { node.select(); };
exports.selectInput = selectInput;
if (browser_js_1.ios) // Mobile Safari apparently has a bug where select() is broken.
    exports.selectInput = function (node) { node.selectionStart = 0; node.selectionEnd = node.value.length; };
else if (browser_js_1.ie) // Suppress mysterious IE10 errors
    exports.selectInput = function (node) { try {
        node.select();
    }
    catch (_e) { } };
