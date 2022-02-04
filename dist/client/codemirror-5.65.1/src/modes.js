"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startState = exports.innerMode = exports.copyState = exports.extendMode = exports.modeExtensions = exports.getMode = exports.resolveMode = exports.defineMIME = exports.defineMode = exports.mimeModes = exports.modes = void 0;
const misc_js_1 = require("./util/misc.js");
// Known modes, by name and by MIME
exports.modes = {}, exports.mimeModes = {};
// Extra arguments are stored as the mode's dependencies, which is
// used by (legacy) mechanisms like loadmode.js to automatically
// load a mode. (Preferred mechanism is the require/define calls.)
function defineMode(name, mode) {
    if (arguments.length > 2)
        mode.dependencies = Array.prototype.slice.call(arguments, 2);
    exports.modes[name] = mode;
}
exports.defineMode = defineMode;
function defineMIME(mime, spec) {
    exports.mimeModes[mime] = spec;
}
exports.defineMIME = defineMIME;
// Given a MIME type, a {name, ...options} config object, or a name
// string, return a mode config object.
function resolveMode(spec) {
    if (typeof spec == "string" && exports.mimeModes.hasOwnProperty(spec)) {
        spec = exports.mimeModes[spec];
    }
    else if (spec && typeof spec.name == "string" && exports.mimeModes.hasOwnProperty(spec.name)) {
        let found = exports.mimeModes[spec.name];
        if (typeof found == "string")
            found = { name: found };
        spec = (0, misc_js_1.createObj)(found, spec);
        spec.name = found.name;
    }
    else if (typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+xml$/.test(spec)) {
        return resolveMode("application/xml");
    }
    else if (typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+json$/.test(spec)) {
        return resolveMode("application/json");
    }
    if (typeof spec == "string")
        return { name: spec };
    else
        return spec || { name: "null" };
}
exports.resolveMode = resolveMode;
// Given a mode spec (anything that resolveMode accepts), find and
// initialize an actual mode object.
function getMode(options, spec) {
    spec = resolveMode(spec);
    let mfactory = exports.modes[spec.name];
    if (!mfactory)
        return getMode(options, "text/plain");
    let modeObj = mfactory(options, spec);
    if (exports.modeExtensions.hasOwnProperty(spec.name)) {
        let exts = exports.modeExtensions[spec.name];
        for (let prop in exts) {
            if (!exts.hasOwnProperty(prop))
                continue;
            if (modeObj.hasOwnProperty(prop))
                modeObj["_" + prop] = modeObj[prop];
            modeObj[prop] = exts[prop];
        }
    }
    modeObj.name = spec.name;
    if (spec.helperType)
        modeObj.helperType = spec.helperType;
    if (spec.modeProps)
        for (let prop in spec.modeProps)
            modeObj[prop] = spec.modeProps[prop];
    return modeObj;
}
exports.getMode = getMode;
// This can be used to attach properties to mode objects from
// outside the actual mode definition.
exports.modeExtensions = {};
function extendMode(mode, properties) {
    let exts = exports.modeExtensions.hasOwnProperty(mode) ? exports.modeExtensions[mode] : (exports.modeExtensions[mode] = {});
    (0, misc_js_1.copyObj)(properties, exts);
}
exports.extendMode = extendMode;
function copyState(mode, state) {
    if (state === true)
        return state;
    if (mode.copyState)
        return mode.copyState(state);
    let nstate = {};
    for (let n in state) {
        let val = state[n];
        if (val instanceof Array)
            val = val.concat([]);
        nstate[n] = val;
    }
    return nstate;
}
exports.copyState = copyState;
// Given a mode and a state (for that mode), find the inner mode and
// state at the position that the state refers to.
function innerMode(mode, state) {
    let info;
    while (mode.innerMode) {
        info = mode.innerMode(state);
        if (!info || info.mode == mode)
            break;
        state = info.state;
        mode = info.mode;
    }
    return info || { mode: mode, state: state };
}
exports.innerMode = innerMode;
function startState(mode, a1, a2) {
    return mode.startState ? mode.startState(a1, a2) : true;
}
exports.startState = startState;
