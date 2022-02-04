"use strict";
// EDITOR CONSTRUCTOR
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeMirror = void 0;
const CodeMirror_js_1 = require("./CodeMirror.js");
var CodeMirror_js_2 = require("./CodeMirror.js");
Object.defineProperty(exports, "CodeMirror", { enumerable: true, get: function () { return CodeMirror_js_2.CodeMirror; } });
const event_js_1 = require("../util/event.js");
const misc_js_1 = require("../util/misc.js");
const options_js_1 = require("./options.js");
(0, options_js_1.defineOptions)(CodeMirror_js_1.CodeMirror);
const methods_js_1 = __importDefault(require("./methods.js"));
(0, methods_js_1.default)(CodeMirror_js_1.CodeMirror);
const Doc_js_1 = __importDefault(require("../model/Doc.js"));
// Set up methods on CodeMirror's prototype to redirect to the editor's document.
let dontDelegate = "iter insert remove copy getEditor constructor".split(" ");
for (let prop in Doc_js_1.default.prototype)
    if (Doc_js_1.default.prototype.hasOwnProperty(prop) && (0, misc_js_1.indexOf)(dontDelegate, prop) < 0)
        CodeMirror_js_1.CodeMirror.prototype[prop] = (function (method) {
            return function () { return method.apply(this.doc, arguments); };
        })(Doc_js_1.default.prototype[prop]);
(0, event_js_1.eventMixin)(Doc_js_1.default);
// INPUT HANDLING
const ContentEditableInput_js_1 = __importDefault(require("../input/ContentEditableInput.js"));
const TextareaInput_js_1 = __importDefault(require("../input/TextareaInput.js"));
CodeMirror_js_1.CodeMirror.inputStyles = { "textarea": TextareaInput_js_1.default, "contenteditable": ContentEditableInput_js_1.default };
// MODE DEFINITION AND QUERYING
const modes_js_1 = require("../modes.js");
// Extra arguments are stored as the mode's dependencies, which is
// used by (legacy) mechanisms like loadmode.js to automatically
// load a mode. (Preferred mechanism is the require/define calls.)
CodeMirror_js_1.CodeMirror.defineMode = function (name /*, mode, …*/) {
    if (!CodeMirror_js_1.CodeMirror.defaults.mode && name != "null")
        CodeMirror_js_1.CodeMirror.defaults.mode = name;
    modes_js_1.defineMode.apply(this, arguments);
};
CodeMirror_js_1.CodeMirror.defineMIME = modes_js_1.defineMIME;
// Minimal default mode.
CodeMirror_js_1.CodeMirror.defineMode("null", () => ({ token: stream => stream.skipToEnd() }));
CodeMirror_js_1.CodeMirror.defineMIME("text/plain", "null");
// EXTENSIONS
CodeMirror_js_1.CodeMirror.defineExtension = (name, func) => {
    CodeMirror_js_1.CodeMirror.prototype[name] = func;
};
CodeMirror_js_1.CodeMirror.defineDocExtension = (name, func) => {
    Doc_js_1.default.prototype[name] = func;
};
const fromTextArea_js_1 = require("./fromTextArea.js");
CodeMirror_js_1.CodeMirror.fromTextArea = fromTextArea_js_1.fromTextArea;
const legacy_js_1 = require("./legacy.js");
(0, legacy_js_1.addLegacyProps)(CodeMirror_js_1.CodeMirror);
CodeMirror_js_1.CodeMirror.version = "5.65.1";
