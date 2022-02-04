"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetModeState = exports.loadMode = void 0;
const modes_js_1 = require("../modes.js");
const highlight_worker_js_1 = require("./highlight_worker.js");
const view_tracking_js_1 = require("./view_tracking.js");
// Used to get the editor into a consistent state again when options change.
function loadMode(cm) {
    cm.doc.mode = (0, modes_js_1.getMode)(cm.options, cm.doc.modeOption);
    resetModeState(cm);
}
exports.loadMode = loadMode;
function resetModeState(cm) {
    cm.doc.iter(line => {
        if (line.stateAfter)
            line.stateAfter = null;
        if (line.styles)
            line.styles = null;
    });
    cm.doc.modeFrontier = cm.doc.highlightFrontier = cm.doc.first;
    (0, highlight_worker_js_1.startWorker)(cm, 100);
    cm.state.modeGen++;
    if (cm.curOp)
        (0, view_tracking_js_1.regChange)(cm);
}
exports.resetModeState = resetModeState;
