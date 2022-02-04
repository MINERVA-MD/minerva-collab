"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seeCollapsedSpans = exports.seeReadOnlySpans = exports.sawCollapsedSpans = exports.sawReadOnlySpans = void 0;
// Optimize some code when these features are not used.
exports.sawReadOnlySpans = false, exports.sawCollapsedSpans = false;
function seeReadOnlySpans() {
    exports.sawReadOnlySpans = true;
}
exports.seeReadOnlySpans = seeReadOnlySpans;
function seeCollapsedSpans() {
    exports.sawCollapsedSpans = true;
}
exports.seeCollapsedSpans = seeCollapsedSpans;
