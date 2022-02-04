"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_buble_1 = __importDefault(require("@rollup/plugin-buble"));
exports.default = [
    {
        input: "src/codemirror.js",
        output: {
            banner: `// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// This is CodeMirror (https://codemirror.net), a code editor
// implemented in JavaScript on top of the browser's DOM.
//
// You can find some technical background for some of the code below
// at http://marijnhaverbeke.nl/blog/#cm-internals .
`,
            format: "umd",
            file: "lib/codemirror.js",
            name: "CodeMirror"
        },
        plugins: [(0, plugin_buble_1.default)({ namedFunctionExpressions: false })]
    },
    {
        input: ["src/addon/runmode/runmode-standalone.js"],
        output: {
            format: "iife",
            file: "addon/runmode/runmode-standalone.js",
            name: "CodeMirror",
            freeze: false, // IE8 doesn't support Object.freeze.
        },
        plugins: [(0, plugin_buble_1.default)({ namedFunctionExpressions: false })]
    },
    {
        input: ["src/addon/runmode/runmode.node.js"],
        output: {
            format: "cjs",
            file: "addon/runmode/runmode.node.js",
            name: "CodeMirror",
            freeze: false, // IE8 doesn't support Object.freeze.
        },
        plugins: [(0, plugin_buble_1.default)({ namedFunctionExpressions: false })]
    },
];
