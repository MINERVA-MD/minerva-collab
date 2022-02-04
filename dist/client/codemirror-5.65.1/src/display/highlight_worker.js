"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWorker = void 0;
const highlight_js_1 = require("../line/highlight.js");
const modes_js_1 = require("../modes.js");
const misc_js_1 = require("../util/misc.js");
const operations_js_1 = require("./operations.js");
const view_tracking_js_1 = require("./view_tracking.js");
// HIGHLIGHT WORKER
function startWorker(cm, time) {
    if (cm.doc.highlightFrontier < cm.display.viewTo)
        cm.state.highlight.set(time, (0, misc_js_1.bind)(highlightWorker, cm));
}
exports.startWorker = startWorker;
function highlightWorker(cm) {
    let doc = cm.doc;
    if (doc.highlightFrontier >= cm.display.viewTo)
        return;
    let end = +new Date + cm.options.workTime;
    let context = (0, highlight_js_1.getContextBefore)(cm, doc.highlightFrontier);
    let changedLines = [];
    doc.iter(context.line, Math.min(doc.first + doc.size, cm.display.viewTo + 500), line => {
        if (context.line >= cm.display.viewFrom) { // Visible
            let oldStyles = line.styles;
            let resetState = line.text.length > cm.options.maxHighlightLength ? (0, modes_js_1.copyState)(doc.mode, context.state) : null;
            let highlighted = (0, highlight_js_1.highlightLine)(cm, line, context, true);
            if (resetState)
                context.state = resetState;
            line.styles = highlighted.styles;
            let oldCls = line.styleClasses, newCls = highlighted.classes;
            if (newCls)
                line.styleClasses = newCls;
            else if (oldCls)
                line.styleClasses = null;
            let ischange = !oldStyles || oldStyles.length != line.styles.length ||
                oldCls != newCls && (!oldCls || !newCls || oldCls.bgClass != newCls.bgClass || oldCls.textClass != newCls.textClass);
            for (let i = 0; !ischange && i < oldStyles.length; ++i)
                ischange = oldStyles[i] != line.styles[i];
            if (ischange)
                changedLines.push(context.line);
            line.stateAfter = context.save();
            context.nextLine();
        }
        else {
            if (line.text.length <= cm.options.maxHighlightLength)
                (0, highlight_js_1.processLine)(cm, line.text, context);
            line.stateAfter = context.line % 5 == 0 ? context.save() : null;
            context.nextLine();
        }
        if (+new Date > end) {
            startWorker(cm, cm.options.workDelay);
            return true;
        }
    });
    doc.highlightFrontier = context.line;
    doc.modeFrontier = Math.max(doc.modeFrontier, context.line);
    if (changedLines.length)
        (0, operations_js_1.runInOp)(cm, () => {
            for (let i = 0; i < changedLines.length; i++)
                (0, view_tracking_js_1.regLineChange)(cm, changedLines[i], "text");
        });
}
