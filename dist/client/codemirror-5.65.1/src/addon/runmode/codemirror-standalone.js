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
const misc_js_1 = require("../../util/misc.js");
const modeMethods = __importStar(require("../../modes.js"));
// declare global: globalThis, CodeMirror
// Create a minimal CodeMirror needed to use runMode, and assign to root.
var root = typeof globalThis !== 'undefined' ? globalThis : window;
root.CodeMirror = {};
// Copy StringStream and mode methods into CodeMirror object.
CodeMirror.StringStream = StringStream_js_1.default;
for (var exported in modeMethods)
    CodeMirror[exported] = modeMethods[exported];
// Minimal default mode.
CodeMirror.defineMode("null", () => ({ token: stream => stream.skipToEnd() }));
CodeMirror.defineMIME("text/plain", "null");
CodeMirror.registerHelper = CodeMirror.registerGlobalHelper = Math.min;
CodeMirror.splitLines = function (string) { return string.split(/\r?\n|\r/); };
CodeMirror.countColumn = misc_js_1.countColumn;
CodeMirror.defaults = { indentUnit: 2 };
exports.default = CodeMirror;
