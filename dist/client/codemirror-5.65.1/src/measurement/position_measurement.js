"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findViewIndex = exports.posFromMouse = exports.estimateLineHeights = exports.estimateHeight = exports.compensateForHScroll = exports.getDimensions = exports.charWidth = exports.textHeight = exports.wrappedLineExtentChar = exports.coordsChar = exports.estimateCoords = exports.cursorCoords = exports.charCoords = exports.fromCoordSystem = exports.intoCoordSystem = exports.clearCaches = exports.clearLineMeasurementCache = exports.clearLineMeasurementCacheFor = exports.nodeAndOffsetInLineMap = exports.measureCharPrepared = exports.prepareMeasureForLine = exports.findViewForLine = exports.measureChar = exports.mapFromLineView = exports.displayHeight = exports.displayWidth = exports.scrollGap = exports.paddingH = exports.paddingVert = exports.paddingTop = void 0;
const line_data_js_1 = require("../line/line_data.js");
const pos_js_1 = require("../line/pos.js");
const spans_js_1 = require("../line/spans.js");
const utils_line_js_1 = require("../line/utils_line.js");
const bidi_js_1 = require("../util/bidi.js");
const browser_js_1 = require("../util/browser.js");
const dom_js_1 = require("../util/dom.js");
const event_js_1 = require("../util/event.js");
const feature_detection_js_1 = require("../util/feature_detection.js");
const misc_js_1 = require("../util/misc.js");
const update_line_js_1 = require("../display/update_line.js");
const widgets_js_1 = require("./widgets.js");
// POSITION MEASUREMENT
function paddingTop(display) { return display.lineSpace.offsetTop; }
exports.paddingTop = paddingTop;
function paddingVert(display) { return display.mover.offsetHeight - display.lineSpace.offsetHeight; }
exports.paddingVert = paddingVert;
function paddingH(display) {
    if (display.cachedPaddingH)
        return display.cachedPaddingH;
    let e = (0, dom_js_1.removeChildrenAndAdd)(display.measure, (0, dom_js_1.elt)("pre", "x", "CodeMirror-line-like"));
    let style = window.getComputedStyle ? window.getComputedStyle(e) : e.currentStyle;
    let data = { left: parseInt(style.paddingLeft), right: parseInt(style.paddingRight) };
    if (!isNaN(data.left) && !isNaN(data.right))
        display.cachedPaddingH = data;
    return data;
}
exports.paddingH = paddingH;
function scrollGap(cm) { return misc_js_1.scrollerGap - cm.display.nativeBarWidth; }
exports.scrollGap = scrollGap;
function displayWidth(cm) {
    return cm.display.scroller.clientWidth - scrollGap(cm) - cm.display.barWidth;
}
exports.displayWidth = displayWidth;
function displayHeight(cm) {
    return cm.display.scroller.clientHeight - scrollGap(cm) - cm.display.barHeight;
}
exports.displayHeight = displayHeight;
// Ensure the lineView.wrapping.heights array is populated. This is
// an array of bottom offsets for the lines that make up a drawn
// line. When lineWrapping is on, there might be more than one
// height.
function ensureLineHeights(cm, lineView, rect) {
    let wrapping = cm.options.lineWrapping;
    let curWidth = wrapping && displayWidth(cm);
    if (!lineView.measure.heights || wrapping && lineView.measure.width != curWidth) {
        let heights = lineView.measure.heights = [];
        if (wrapping) {
            lineView.measure.width = curWidth;
            let rects = lineView.text.firstChild.getClientRects();
            for (let i = 0; i < rects.length - 1; i++) {
                let cur = rects[i], next = rects[i + 1];
                if (Math.abs(cur.bottom - next.bottom) > 2)
                    heights.push((cur.bottom + next.top) / 2 - rect.top);
            }
        }
        heights.push(rect.bottom - rect.top);
    }
}
// Find a line map (mapping character offsets to text nodes) and a
// measurement cache for the given line number. (A line view might
// contain multiple lines when collapsed ranges are present.)
function mapFromLineView(lineView, line, lineN) {
    if (lineView.line == line)
        return { map: lineView.measure.map, cache: lineView.measure.cache };
    if (lineView.rest) {
        for (let i = 0; i < lineView.rest.length; i++)
            if (lineView.rest[i] == line)
                return { map: lineView.measure.maps[i], cache: lineView.measure.caches[i] };
        for (let i = 0; i < lineView.rest.length; i++)
            if ((0, utils_line_js_1.lineNo)(lineView.rest[i]) > lineN)
                return { map: lineView.measure.maps[i], cache: lineView.measure.caches[i], before: true };
    }
}
exports.mapFromLineView = mapFromLineView;
// Render a line into the hidden node display.externalMeasured. Used
// when measurement is needed for a line that's not in the viewport.
function updateExternalMeasurement(cm, line) {
    line = (0, spans_js_1.visualLine)(line);
    let lineN = (0, utils_line_js_1.lineNo)(line);
    let view = cm.display.externalMeasured = new line_data_js_1.LineView(cm.doc, line, lineN);
    view.lineN = lineN;
    let built = view.built = (0, line_data_js_1.buildLineContent)(cm, view);
    view.text = built.pre;
    (0, dom_js_1.removeChildrenAndAdd)(cm.display.lineMeasure, built.pre);
    return view;
}
// Get a {top, bottom, left, right} box (in line-local coordinates)
// for a given character.
function measureChar(cm, line, ch, bias) {
    return measureCharPrepared(cm, prepareMeasureForLine(cm, line), ch, bias);
}
exports.measureChar = measureChar;
// Find a line view that corresponds to the given line number.
function findViewForLine(cm, lineN) {
    if (lineN >= cm.display.viewFrom && lineN < cm.display.viewTo)
        return cm.display.view[findViewIndex(cm, lineN)];
    let ext = cm.display.externalMeasured;
    if (ext && lineN >= ext.lineN && lineN < ext.lineN + ext.size)
        return ext;
}
exports.findViewForLine = findViewForLine;
// Measurement can be split in two steps, the set-up work that
// applies to the whole line, and the measurement of the actual
// character. Functions like coordsChar, that need to do a lot of
// measurements in a row, can thus ensure that the set-up work is
// only done once.
function prepareMeasureForLine(cm, line) {
    let lineN = (0, utils_line_js_1.lineNo)(line);
    let view = findViewForLine(cm, lineN);
    if (view && !view.text) {
        view = null;
    }
    else if (view && view.changes) {
        (0, update_line_js_1.updateLineForChanges)(cm, view, lineN, getDimensions(cm));
        cm.curOp.forceUpdate = true;
    }
    if (!view)
        view = updateExternalMeasurement(cm, line);
    let info = mapFromLineView(view, line, lineN);
    return {
        line: line, view: view, rect: null,
        map: info.map, cache: info.cache, before: info.before,
        hasHeights: false
    };
}
exports.prepareMeasureForLine = prepareMeasureForLine;
// Given a prepared measurement object, measures the position of an
// actual character (or fetches it from the cache).
function measureCharPrepared(cm, prepared, ch, bias, varHeight) {
    if (prepared.before)
        ch = -1;
    let key = ch + (bias || ""), found;
    if (prepared.cache.hasOwnProperty(key)) {
        found = prepared.cache[key];
    }
    else {
        if (!prepared.rect)
            prepared.rect = prepared.view.text.getBoundingClientRect();
        if (!prepared.hasHeights) {
            ensureLineHeights(cm, prepared.view, prepared.rect);
            prepared.hasHeights = true;
        }
        found = measureCharInner(cm, prepared, ch, bias);
        if (!found.bogus)
            prepared.cache[key] = found;
    }
    return { left: found.left, right: found.right,
        top: varHeight ? found.rtop : found.top,
        bottom: varHeight ? found.rbottom : found.bottom };
}
exports.measureCharPrepared = measureCharPrepared;
let nullRect = { left: 0, right: 0, top: 0, bottom: 0 };
function nodeAndOffsetInLineMap(map, ch, bias) {
    let node, start, end, collapse, mStart, mEnd;
    // First, search the line map for the text node corresponding to,
    // or closest to, the target character.
    for (let i = 0; i < map.length; i += 3) {
        mStart = map[i];
        mEnd = map[i + 1];
        if (ch < mStart) {
            start = 0;
            end = 1;
            collapse = "left";
        }
        else if (ch < mEnd) {
            start = ch - mStart;
            end = start + 1;
        }
        else if (i == map.length - 3 || ch == mEnd && map[i + 3] > ch) {
            end = mEnd - mStart;
            start = end - 1;
            if (ch >= mEnd)
                collapse = "right";
        }
        if (start != null) {
            node = map[i + 2];
            if (mStart == mEnd && bias == (node.insertLeft ? "left" : "right"))
                collapse = bias;
            if (bias == "left" && start == 0)
                while (i && map[i - 2] == map[i - 3] && map[i - 1].insertLeft) {
                    node = map[(i -= 3) + 2];
                    collapse = "left";
                }
            if (bias == "right" && start == mEnd - mStart)
                while (i < map.length - 3 && map[i + 3] == map[i + 4] && !map[i + 5].insertLeft) {
                    node = map[(i += 3) + 2];
                    collapse = "right";
                }
            break;
        }
    }
    return { node: node, start: start, end: end, collapse: collapse, coverStart: mStart, coverEnd: mEnd };
}
exports.nodeAndOffsetInLineMap = nodeAndOffsetInLineMap;
function getUsefulRect(rects, bias) {
    let rect = nullRect;
    if (bias == "left")
        for (let i = 0; i < rects.length; i++) {
            if ((rect = rects[i]).left != rect.right)
                break;
        }
    else
        for (let i = rects.length - 1; i >= 0; i--) {
            if ((rect = rects[i]).left != rect.right)
                break;
        }
    return rect;
}
function measureCharInner(cm, prepared, ch, bias) {
    let place = nodeAndOffsetInLineMap(prepared.map, ch, bias);
    let node = place.node, start = place.start, end = place.end, collapse = place.collapse;
    let rect;
    if (node.nodeType == 3) { // If it is a text node, use a range to retrieve the coordinates.
        for (let i = 0; i < 4; i++) { // Retry a maximum of 4 times when nonsense rectangles are returned
            while (start && (0, misc_js_1.isExtendingChar)(prepared.line.text.charAt(place.coverStart + start)))
                --start;
            while (place.coverStart + end < place.coverEnd && (0, misc_js_1.isExtendingChar)(prepared.line.text.charAt(place.coverStart + end)))
                ++end;
            if (browser_js_1.ie && browser_js_1.ie_version < 9 && start == 0 && end == place.coverEnd - place.coverStart)
                rect = node.parentNode.getBoundingClientRect();
            else
                rect = getUsefulRect((0, dom_js_1.range)(node, start, end).getClientRects(), bias);
            if (rect.left || rect.right || start == 0)
                break;
            end = start;
            start = start - 1;
            collapse = "right";
        }
        if (browser_js_1.ie && browser_js_1.ie_version < 11)
            rect = maybeUpdateRectForZooming(cm.display.measure, rect);
    }
    else { // If it is a widget, simply get the box for the whole widget.
        if (start > 0)
            collapse = bias = "right";
        let rects;
        if (cm.options.lineWrapping && (rects = node.getClientRects()).length > 1)
            rect = rects[bias == "right" ? rects.length - 1 : 0];
        else
            rect = node.getBoundingClientRect();
    }
    if (browser_js_1.ie && browser_js_1.ie_version < 9 && !start && (!rect || !rect.left && !rect.right)) {
        let rSpan = node.parentNode.getClientRects()[0];
        if (rSpan)
            rect = { left: rSpan.left, right: rSpan.left + charWidth(cm.display), top: rSpan.top, bottom: rSpan.bottom };
        else
            rect = nullRect;
    }
    let rtop = rect.top - prepared.rect.top, rbot = rect.bottom - prepared.rect.top;
    let mid = (rtop + rbot) / 2;
    let heights = prepared.view.measure.heights;
    let i = 0;
    for (; i < heights.length - 1; i++)
        if (mid < heights[i])
            break;
    let top = i ? heights[i - 1] : 0, bot = heights[i];
    let result = { left: (collapse == "right" ? rect.right : rect.left) - prepared.rect.left,
        right: (collapse == "left" ? rect.left : rect.right) - prepared.rect.left,
        top: top, bottom: bot };
    if (!rect.left && !rect.right)
        result.bogus = true;
    if (!cm.options.singleCursorHeightPerLine) {
        result.rtop = rtop;
        result.rbottom = rbot;
    }
    return result;
}
// Work around problem with bounding client rects on ranges being
// returned incorrectly when zoomed on IE10 and below.
function maybeUpdateRectForZooming(measure, rect) {
    if (!window.screen || screen.logicalXDPI == null ||
        screen.logicalXDPI == screen.deviceXDPI || !(0, feature_detection_js_1.hasBadZoomedRects)(measure))
        return rect;
    let scaleX = screen.logicalXDPI / screen.deviceXDPI;
    let scaleY = screen.logicalYDPI / screen.deviceYDPI;
    return { left: rect.left * scaleX, right: rect.right * scaleX,
        top: rect.top * scaleY, bottom: rect.bottom * scaleY };
}
function clearLineMeasurementCacheFor(lineView) {
    if (lineView.measure) {
        lineView.measure.cache = {};
        lineView.measure.heights = null;
        if (lineView.rest)
            for (let i = 0; i < lineView.rest.length; i++)
                lineView.measure.caches[i] = {};
    }
}
exports.clearLineMeasurementCacheFor = clearLineMeasurementCacheFor;
function clearLineMeasurementCache(cm) {
    cm.display.externalMeasure = null;
    (0, dom_js_1.removeChildren)(cm.display.lineMeasure);
    for (let i = 0; i < cm.display.view.length; i++)
        clearLineMeasurementCacheFor(cm.display.view[i]);
}
exports.clearLineMeasurementCache = clearLineMeasurementCache;
function clearCaches(cm) {
    clearLineMeasurementCache(cm);
    cm.display.cachedCharWidth = cm.display.cachedTextHeight = cm.display.cachedPaddingH = null;
    if (!cm.options.lineWrapping)
        cm.display.maxLineChanged = true;
    cm.display.lineNumChars = null;
}
exports.clearCaches = clearCaches;
function pageScrollX() {
    // Work around https://bugs.chromium.org/p/chromium/issues/detail?id=489206
    // which causes page_Offset and bounding client rects to use
    // different reference viewports and invalidate our calculations.
    if (browser_js_1.chrome && browser_js_1.android)
        return -(document.body.getBoundingClientRect().left - parseInt(getComputedStyle(document.body).marginLeft));
    return window.pageXOffset || (document.documentElement || document.body).scrollLeft;
}
function pageScrollY() {
    if (browser_js_1.chrome && browser_js_1.android)
        return -(document.body.getBoundingClientRect().top - parseInt(getComputedStyle(document.body).marginTop));
    return window.pageYOffset || (document.documentElement || document.body).scrollTop;
}
function widgetTopHeight(lineObj) {
    let { widgets } = (0, spans_js_1.visualLine)(lineObj), height = 0;
    if (widgets)
        for (let i = 0; i < widgets.length; ++i)
            if (widgets[i].above)
                height += (0, widgets_js_1.widgetHeight)(widgets[i]);
    return height;
}
// Converts a {top, bottom, left, right} box from line-local
// coordinates into another coordinate system. Context may be one of
// "line", "div" (display.lineDiv), "local"./null (editor), "window",
// or "page".
function intoCoordSystem(cm, lineObj, rect, context, includeWidgets) {
    if (!includeWidgets) {
        let height = widgetTopHeight(lineObj);
        rect.top += height;
        rect.bottom += height;
    }
    if (context == "line")
        return rect;
    if (!context)
        context = "local";
    let yOff = (0, spans_js_1.heightAtLine)(lineObj);
    if (context == "local")
        yOff += paddingTop(cm.display);
    else
        yOff -= cm.display.viewOffset;
    if (context == "page" || context == "window") {
        let lOff = cm.display.lineSpace.getBoundingClientRect();
        yOff += lOff.top + (context == "window" ? 0 : pageScrollY());
        let xOff = lOff.left + (context == "window" ? 0 : pageScrollX());
        rect.left += xOff;
        rect.right += xOff;
    }
    rect.top += yOff;
    rect.bottom += yOff;
    return rect;
}
exports.intoCoordSystem = intoCoordSystem;
// Coverts a box from "div" coords to another coordinate system.
// Context may be "window", "page", "div", or "local"./null.
function fromCoordSystem(cm, coords, context) {
    if (context == "div")
        return coords;
    let left = coords.left, top = coords.top;
    // First move into "page" coordinate system
    if (context == "page") {
        left -= pageScrollX();
        top -= pageScrollY();
    }
    else if (context == "local" || !context) {
        let localBox = cm.display.sizer.getBoundingClientRect();
        left += localBox.left;
        top += localBox.top;
    }
    let lineSpaceBox = cm.display.lineSpace.getBoundingClientRect();
    return { left: left - lineSpaceBox.left, top: top - lineSpaceBox.top };
}
exports.fromCoordSystem = fromCoordSystem;
function charCoords(cm, pos, context, lineObj, bias) {
    if (!lineObj)
        lineObj = (0, utils_line_js_1.getLine)(cm.doc, pos.line);
    return intoCoordSystem(cm, lineObj, measureChar(cm, lineObj, pos.ch, bias), context);
}
exports.charCoords = charCoords;
// Returns a box for a given cursor position, which may have an
// 'other' property containing the position of the secondary cursor
// on a bidi boundary.
// A cursor Pos(line, char, "before") is on the same visual line as `char - 1`
// and after `char - 1` in writing order of `char - 1`
// A cursor Pos(line, char, "after") is on the same visual line as `char`
// and before `char` in writing order of `char`
// Examples (upper-case letters are RTL, lower-case are LTR):
//     Pos(0, 1, ...)
//     before   after
// ab     a|b     a|b
// aB     a|B     aB|
// Ab     |Ab     A|b
// AB     B|A     B|A
// Every position after the last character on a line is considered to stick
// to the last character on the line.
function cursorCoords(cm, pos, context, lineObj, preparedMeasure, varHeight) {
    lineObj = lineObj || (0, utils_line_js_1.getLine)(cm.doc, pos.line);
    if (!preparedMeasure)
        preparedMeasure = prepareMeasureForLine(cm, lineObj);
    function get(ch, right) {
        let m = measureCharPrepared(cm, preparedMeasure, ch, right ? "right" : "left", varHeight);
        if (right)
            m.left = m.right;
        else
            m.right = m.left;
        return intoCoordSystem(cm, lineObj, m, context);
    }
    let order = (0, bidi_js_1.getOrder)(lineObj, cm.doc.direction), ch = pos.ch, sticky = pos.sticky;
    if (ch >= lineObj.text.length) {
        ch = lineObj.text.length;
        sticky = "before";
    }
    else if (ch <= 0) {
        ch = 0;
        sticky = "after";
    }
    if (!order)
        return get(sticky == "before" ? ch - 1 : ch, sticky == "before");
    function getBidi(ch, partPos, invert) {
        let part = order[partPos], right = part.level == 1;
        return get(invert ? ch - 1 : ch, right != invert);
    }
    let partPos = (0, bidi_js_1.getBidiPartAt)(order, ch, sticky);
    let other = bidi_js_1.bidiOther;
    let val = getBidi(ch, partPos, sticky == "before");
    if (other != null)
        val.other = getBidi(ch, other, sticky != "before");
    return val;
}
exports.cursorCoords = cursorCoords;
// Used to cheaply estimate the coordinates for a position. Used for
// intermediate scroll updates.
function estimateCoords(cm, pos) {
    let left = 0;
    pos = (0, pos_js_1.clipPos)(cm.doc, pos);
    if (!cm.options.lineWrapping)
        left = charWidth(cm.display) * pos.ch;
    let lineObj = (0, utils_line_js_1.getLine)(cm.doc, pos.line);
    let top = (0, spans_js_1.heightAtLine)(lineObj) + paddingTop(cm.display);
    return { left: left, right: left, top: top, bottom: top + lineObj.height };
}
exports.estimateCoords = estimateCoords;
// Positions returned by coordsChar contain some extra information.
// xRel is the relative x position of the input coordinates compared
// to the found position (so xRel > 0 means the coordinates are to
// the right of the character position, for example). When outside
// is true, that means the coordinates lie outside the line's
// vertical range.
function PosWithInfo(line, ch, sticky, outside, xRel) {
    let pos = (0, pos_js_1.Pos)(line, ch, sticky);
    pos.xRel = xRel;
    if (outside)
        pos.outside = outside;
    return pos;
}
// Compute the character position closest to the given coordinates.
// Input must be lineSpace-local ("div" coordinate system).
function coordsChar(cm, x, y) {
    let doc = cm.doc;
    y += cm.display.viewOffset;
    if (y < 0)
        return PosWithInfo(doc.first, 0, null, -1, -1);
    let lineN = (0, utils_line_js_1.lineAtHeight)(doc, y), last = doc.first + doc.size - 1;
    if (lineN > last)
        return PosWithInfo(doc.first + doc.size - 1, (0, utils_line_js_1.getLine)(doc, last).text.length, null, 1, 1);
    if (x < 0)
        x = 0;
    let lineObj = (0, utils_line_js_1.getLine)(doc, lineN);
    for (;;) {
        let found = coordsCharInner(cm, lineObj, lineN, x, y);
        let collapsed = (0, spans_js_1.collapsedSpanAround)(lineObj, found.ch + (found.xRel > 0 || found.outside > 0 ? 1 : 0));
        if (!collapsed)
            return found;
        let rangeEnd = collapsed.find(1);
        if (rangeEnd.line == lineN)
            return rangeEnd;
        lineObj = (0, utils_line_js_1.getLine)(doc, lineN = rangeEnd.line);
    }
}
exports.coordsChar = coordsChar;
function wrappedLineExtent(cm, lineObj, preparedMeasure, y) {
    y -= widgetTopHeight(lineObj);
    let end = lineObj.text.length;
    let begin = (0, misc_js_1.findFirst)(ch => measureCharPrepared(cm, preparedMeasure, ch - 1).bottom <= y, end, 0);
    end = (0, misc_js_1.findFirst)(ch => measureCharPrepared(cm, preparedMeasure, ch).top > y, begin, end);
    return { begin, end };
}
function wrappedLineExtentChar(cm, lineObj, preparedMeasure, target) {
    if (!preparedMeasure)
        preparedMeasure = prepareMeasureForLine(cm, lineObj);
    let targetTop = intoCoordSystem(cm, lineObj, measureCharPrepared(cm, preparedMeasure, target), "line").top;
    return wrappedLineExtent(cm, lineObj, preparedMeasure, targetTop);
}
exports.wrappedLineExtentChar = wrappedLineExtentChar;
// Returns true if the given side of a box is after the given
// coordinates, in top-to-bottom, left-to-right order.
function boxIsAfter(box, x, y, left) {
    return box.bottom <= y ? false : box.top > y ? true : (left ? box.left : box.right) > x;
}
function coordsCharInner(cm, lineObj, lineNo, x, y) {
    // Move y into line-local coordinate space
    y -= (0, spans_js_1.heightAtLine)(lineObj);
    let preparedMeasure = prepareMeasureForLine(cm, lineObj);
    // When directly calling `measureCharPrepared`, we have to adjust
    // for the widgets at this line.
    let widgetHeight = widgetTopHeight(lineObj);
    let begin = 0, end = lineObj.text.length, ltr = true;
    let order = (0, bidi_js_1.getOrder)(lineObj, cm.doc.direction);
    // If the line isn't plain left-to-right text, first figure out
    // which bidi section the coordinates fall into.
    if (order) {
        let part = (cm.options.lineWrapping ? coordsBidiPartWrapped : coordsBidiPart)(cm, lineObj, lineNo, preparedMeasure, order, x, y);
        ltr = part.level != 1;
        // The awkward -1 offsets are needed because findFirst (called
        // on these below) will treat its first bound as inclusive,
        // second as exclusive, but we want to actually address the
        // characters in the part's range
        begin = ltr ? part.from : part.to - 1;
        end = ltr ? part.to : part.from - 1;
    }
    // A binary search to find the first character whose bounding box
    // starts after the coordinates. If we run across any whose box wrap
    // the coordinates, store that.
    let chAround = null, boxAround = null;
    let ch = (0, misc_js_1.findFirst)(ch => {
        let box = measureCharPrepared(cm, preparedMeasure, ch);
        box.top += widgetHeight;
        box.bottom += widgetHeight;
        if (!boxIsAfter(box, x, y, false))
            return false;
        if (box.top <= y && box.left <= x) {
            chAround = ch;
            boxAround = box;
        }
        return true;
    }, begin, end);
    let baseX, sticky, outside = false;
    // If a box around the coordinates was found, use that
    if (boxAround) {
        // Distinguish coordinates nearer to the left or right side of the box
        let atLeft = x - boxAround.left < boxAround.right - x, atStart = atLeft == ltr;
        ch = chAround + (atStart ? 0 : 1);
        sticky = atStart ? "after" : "before";
        baseX = atLeft ? boxAround.left : boxAround.right;
    }
    else {
        // (Adjust for extended bound, if necessary.)
        if (!ltr && (ch == end || ch == begin))
            ch++;
        // To determine which side to associate with, get the box to the
        // left of the character and compare it's vertical position to the
        // coordinates
        sticky = ch == 0 ? "after" : ch == lineObj.text.length ? "before" :
            (measureCharPrepared(cm, preparedMeasure, ch - (ltr ? 1 : 0)).bottom + widgetHeight <= y) == ltr ?
                "after" : "before";
        // Now get accurate coordinates for this place, in order to get a
        // base X position
        let coords = cursorCoords(cm, (0, pos_js_1.Pos)(lineNo, ch, sticky), "line", lineObj, preparedMeasure);
        baseX = coords.left;
        outside = y < coords.top ? -1 : y >= coords.bottom ? 1 : 0;
    }
    ch = (0, misc_js_1.skipExtendingChars)(lineObj.text, ch, 1);
    return PosWithInfo(lineNo, ch, sticky, outside, x - baseX);
}
function coordsBidiPart(cm, lineObj, lineNo, preparedMeasure, order, x, y) {
    // Bidi parts are sorted left-to-right, and in a non-line-wrapping
    // situation, we can take this ordering to correspond to the visual
    // ordering. This finds the first part whose end is after the given
    // coordinates.
    let index = (0, misc_js_1.findFirst)(i => {
        let part = order[i], ltr = part.level != 1;
        return boxIsAfter(cursorCoords(cm, (0, pos_js_1.Pos)(lineNo, ltr ? part.to : part.from, ltr ? "before" : "after"), "line", lineObj, preparedMeasure), x, y, true);
    }, 0, order.length - 1);
    let part = order[index];
    // If this isn't the first part, the part's start is also after
    // the coordinates, and the coordinates aren't on the same line as
    // that start, move one part back.
    if (index > 0) {
        let ltr = part.level != 1;
        let start = cursorCoords(cm, (0, pos_js_1.Pos)(lineNo, ltr ? part.from : part.to, ltr ? "after" : "before"), "line", lineObj, preparedMeasure);
        if (boxIsAfter(start, x, y, true) && start.top > y)
            part = order[index - 1];
    }
    return part;
}
function coordsBidiPartWrapped(cm, lineObj, _lineNo, preparedMeasure, order, x, y) {
    // In a wrapped line, rtl text on wrapping boundaries can do things
    // that don't correspond to the ordering in our `order` array at
    // all, so a binary search doesn't work, and we want to return a
    // part that only spans one line so that the binary search in
    // coordsCharInner is safe. As such, we first find the extent of the
    // wrapped line, and then do a flat search in which we discard any
    // spans that aren't on the line.
    let { begin, end } = wrappedLineExtent(cm, lineObj, preparedMeasure, y);
    if (/\s/.test(lineObj.text.charAt(end - 1)))
        end--;
    let part = null, closestDist = null;
    for (let i = 0; i < order.length; i++) {
        let p = order[i];
        if (p.from >= end || p.to <= begin)
            continue;
        let ltr = p.level != 1;
        let endX = measureCharPrepared(cm, preparedMeasure, ltr ? Math.min(end, p.to) - 1 : Math.max(begin, p.from)).right;
        // Weigh against spans ending before this, so that they are only
        // picked if nothing ends after
        let dist = endX < x ? x - endX + 1e9 : endX - x;
        if (!part || closestDist > dist) {
            part = p;
            closestDist = dist;
        }
    }
    if (!part)
        part = order[order.length - 1];
    // Clip the part to the wrapped line.
    if (part.from < begin)
        part = { from: begin, to: part.to, level: part.level };
    if (part.to > end)
        part = { from: part.from, to: end, level: part.level };
    return part;
}
let measureText;
// Compute the default text height.
function textHeight(display) {
    if (display.cachedTextHeight != null)
        return display.cachedTextHeight;
    if (measureText == null) {
        measureText = (0, dom_js_1.elt)("pre", null, "CodeMirror-line-like");
        // Measure a bunch of lines, for browsers that compute
        // fractional heights.
        for (let i = 0; i < 49; ++i) {
            measureText.appendChild(document.createTextNode("x"));
            measureText.appendChild((0, dom_js_1.elt)("br"));
        }
        measureText.appendChild(document.createTextNode("x"));
    }
    (0, dom_js_1.removeChildrenAndAdd)(display.measure, measureText);
    let height = measureText.offsetHeight / 50;
    if (height > 3)
        display.cachedTextHeight = height;
    (0, dom_js_1.removeChildren)(display.measure);
    return height || 1;
}
exports.textHeight = textHeight;
// Compute the default character width.
function charWidth(display) {
    if (display.cachedCharWidth != null)
        return display.cachedCharWidth;
    let anchor = (0, dom_js_1.elt)("span", "xxxxxxxxxx");
    let pre = (0, dom_js_1.elt)("pre", [anchor], "CodeMirror-line-like");
    (0, dom_js_1.removeChildrenAndAdd)(display.measure, pre);
    let rect = anchor.getBoundingClientRect(), width = (rect.right - rect.left) / 10;
    if (width > 2)
        display.cachedCharWidth = width;
    return width || 10;
}
exports.charWidth = charWidth;
// Do a bulk-read of the DOM positions and sizes needed to draw the
// view, so that we don't interleave reading and writing to the DOM.
function getDimensions(cm) {
    let d = cm.display, left = {}, width = {};
    let gutterLeft = d.gutters.clientLeft;
    for (let n = d.gutters.firstChild, i = 0; n; n = n.nextSibling, ++i) {
        let id = cm.display.gutterSpecs[i].className;
        left[id] = n.offsetLeft + n.clientLeft + gutterLeft;
        width[id] = n.clientWidth;
    }
    return { fixedPos: compensateForHScroll(d),
        gutterTotalWidth: d.gutters.offsetWidth,
        gutterLeft: left,
        gutterWidth: width,
        wrapperWidth: d.wrapper.clientWidth };
}
exports.getDimensions = getDimensions;
// Computes display.scroller.scrollLeft + display.gutters.offsetWidth,
// but using getBoundingClientRect to get a sub-pixel-accurate
// result.
function compensateForHScroll(display) {
    return display.scroller.getBoundingClientRect().left - display.sizer.getBoundingClientRect().left;
}
exports.compensateForHScroll = compensateForHScroll;
// Returns a function that estimates the height of a line, to use as
// first approximation until the line becomes visible (and is thus
// properly measurable).
function estimateHeight(cm) {
    let th = textHeight(cm.display), wrapping = cm.options.lineWrapping;
    let perLine = wrapping && Math.max(5, cm.display.scroller.clientWidth / charWidth(cm.display) - 3);
    return line => {
        if ((0, spans_js_1.lineIsHidden)(cm.doc, line))
            return 0;
        let widgetsHeight = 0;
        if (line.widgets)
            for (let i = 0; i < line.widgets.length; i++) {
                if (line.widgets[i].height)
                    widgetsHeight += line.widgets[i].height;
            }
        if (wrapping)
            return widgetsHeight + (Math.ceil(line.text.length / perLine) || 1) * th;
        else
            return widgetsHeight + th;
    };
}
exports.estimateHeight = estimateHeight;
function estimateLineHeights(cm) {
    let doc = cm.doc, est = estimateHeight(cm);
    doc.iter(line => {
        let estHeight = est(line);
        if (estHeight != line.height)
            (0, utils_line_js_1.updateLineHeight)(line, estHeight);
    });
}
exports.estimateLineHeights = estimateLineHeights;
// Given a mouse event, find the corresponding position. If liberal
// is false, it checks whether a gutter or scrollbar was clicked,
// and returns null if it was. forRect is used by rectangular
// selections, and tries to estimate a character position even for
// coordinates beyond the right of the text.
function posFromMouse(cm, e, liberal, forRect) {
    let display = cm.display;
    if (!liberal && (0, event_js_1.e_target)(e).getAttribute("cm-not-content") == "true")
        return null;
    let x, y, space = display.lineSpace.getBoundingClientRect();
    // Fails unpredictably on IE[67] when mouse is dragged around quickly.
    try {
        x = e.clientX - space.left;
        y = e.clientY - space.top;
    }
    catch (e) {
        return null;
    }
    let coords = coordsChar(cm, x, y), line;
    if (forRect && coords.xRel > 0 && (line = (0, utils_line_js_1.getLine)(cm.doc, coords.line).text).length == coords.ch) {
        let colDiff = (0, misc_js_1.countColumn)(line, line.length, cm.options.tabSize) - line.length;
        coords = (0, pos_js_1.Pos)(coords.line, Math.max(0, Math.round((x - paddingH(cm.display).left) / charWidth(cm.display)) - colDiff));
    }
    return coords;
}
exports.posFromMouse = posFromMouse;
// Find the view element corresponding to a given line. Return null
// when the line isn't visible.
function findViewIndex(cm, n) {
    if (n >= cm.display.viewTo)
        return null;
    n -= cm.display.viewFrom;
    if (n < 0)
        return null;
    let view = cm.display.view;
    for (let i = 0; i < view.length; i++) {
        n -= view[i].size;
        if (n < 0)
            return i;
    }
}
exports.findViewIndex = findViewIndex;
