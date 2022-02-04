"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureRightClick = exports.flipCtrlCmd = exports.windows = exports.chromeOS = exports.mac = exports.mobile = exports.android = exports.ios = exports.phantom = exports.mac_geMountainLion = exports.safari = exports.presto = exports.chrome = exports.webkit = exports.ie_version = exports.ie = exports.gecko = void 0;
// Kludges for bugs and behavior differences that can't be feature
// detected are enabled based on userAgent etc sniffing.
let userAgent = navigator.userAgent;
let platform = navigator.platform;
exports.gecko = /gecko\/\d/i.test(userAgent);
let ie_upto10 = /MSIE \d/.test(userAgent);
let ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(userAgent);
let edge = /Edge\/(\d+)/.exec(userAgent);
exports.ie = ie_upto10 || ie_11up || edge;
exports.ie_version = exports.ie && (ie_upto10 ? document.documentMode || 6 : +(edge || ie_11up)[1]);
exports.webkit = !edge && /WebKit\//.test(userAgent);
let qtwebkit = exports.webkit && /Qt\/\d+\.\d+/.test(userAgent);
exports.chrome = !edge && /Chrome\//.test(userAgent);
exports.presto = /Opera\//.test(userAgent);
exports.safari = /Apple Computer/.test(navigator.vendor);
exports.mac_geMountainLion = /Mac OS X 1\d\D([8-9]|\d\d)\D/.test(userAgent);
exports.phantom = /PhantomJS/.test(userAgent);
exports.ios = exports.safari && (/Mobile\/\w+/.test(userAgent) || navigator.maxTouchPoints > 2);
exports.android = /Android/.test(userAgent);
// This is woefully incomplete. Suggestions for alternative methods welcome.
exports.mobile = exports.ios || exports.android || /webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(userAgent);
exports.mac = exports.ios || /Mac/.test(platform);
exports.chromeOS = /\bCrOS\b/.test(userAgent);
exports.windows = /win/i.test(platform);
let presto_version = exports.presto && userAgent.match(/Version\/(\d*\.\d*)/);
if (presto_version)
    presto_version = Number(presto_version[1]);
if (presto_version && presto_version >= 15) {
    exports.presto = false;
    exports.webkit = true;
}
// Some browsers use the wrong event properties to signal cmd/ctrl on OS X
exports.flipCtrlCmd = exports.mac && (qtwebkit || exports.presto && (presto_version == null || presto_version < 12.11));
exports.captureRightClick = exports.gecko || (exports.ie && exports.ie_version >= 9);
