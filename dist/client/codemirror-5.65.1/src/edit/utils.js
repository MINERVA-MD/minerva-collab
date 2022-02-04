"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.themeChanged = void 0;
const position_measurement_js_1 = require("../measurement/position_measurement.js");
function themeChanged(cm) {
    cm.display.wrapper.className = cm.display.wrapper.className.replace(/\s*cm-s-\S+/g, "") +
        cm.options.theme.replace(/(^|\s)\s*/g, " cm-s-");
    (0, position_measurement_js_1.clearCaches)(cm);
}
exports.themeChanged = themeChanged;
