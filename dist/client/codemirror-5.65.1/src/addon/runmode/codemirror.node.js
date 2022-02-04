"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const StringStream_js_1 = __importDefault(require("../../util/StringStream.js"));
const modeMethods = __importStar(require("../../modes.js"));
const misc_js_1 = require("../../util/misc.js");
// Copy StringStream and mode methods into exports (CodeMirror) object.
exports.StringStream = StringStream_js_1.default;
exports.countColumn = misc_js_1.countColumn;
for (var exported in modeMethods)
    exports[exported] = modeMethods[exported];
// Shim library CodeMirror with the minimal CodeMirror defined above.
require.cache[require.resolve("../../lib/codemirror")] = require.cache[require.resolve("./runmode.node")];
require.cache[require.resolve("../../addon/runmode/runmode")] = require.cache[require.resolve("./runmode.node")];
// Minimal default mode.
exports.defineMode("null", () => ({ token: stream => stream.skipToEnd() }));
exports.defineMIME("text/plain", "null");
exports.registerHelper = exports.registerGlobalHelper = Math.min;
exports.splitLines = function (string) { return string.split(/\r?\n|\r/); };
exports.defaults = { indentUnit: 2 };
