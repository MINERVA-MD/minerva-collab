"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromTextArea = void 0;
const CodeMirror_js_1 = require("./CodeMirror.js");
const dom_js_1 = require("../util/dom.js");
const event_js_1 = require("../util/event.js");
const misc_js_1 = require("../util/misc.js");
function fromTextArea(textarea, options) {
    options = options ? (0, misc_js_1.copyObj)(options) : {};
    options.value = textarea.value;
    if (!options.tabindex && textarea.tabIndex)
        options.tabindex = textarea.tabIndex;
    if (!options.placeholder && textarea.placeholder)
        options.placeholder = textarea.placeholder;
    // Set autofocus to true if this textarea is focused, or if it has
    // autofocus and no other element is focused.
    if (options.autofocus == null) {
        let hasFocus = (0, dom_js_1.activeElt)();
        options.autofocus = hasFocus == textarea ||
            textarea.getAttribute("autofocus") != null && hasFocus == document.body;
    }
    function save() { textarea.value = cm.getValue(); }
    let realSubmit;
    if (textarea.form) {
        (0, event_js_1.on)(textarea.form, "submit", save);
        // Deplorable hack to make the submit method do the right thing.
        if (!options.leaveSubmitMethodAlone) {
            let form = textarea.form;
            realSubmit = form.submit;
            try {
                let wrappedSubmit = form.submit = () => {
                    save();
                    form.submit = realSubmit;
                    form.submit();
                    form.submit = wrappedSubmit;
                };
            }
            catch (e) { }
        }
    }
    options.finishInit = cm => {
        cm.save = save;
        cm.getTextArea = () => textarea;
        cm.toTextArea = () => {
            cm.toTextArea = isNaN; // Prevent this from being ran twice
            save();
            textarea.parentNode.removeChild(cm.getWrapperElement());
            textarea.style.display = "";
            if (textarea.form) {
                (0, event_js_1.off)(textarea.form, "submit", save);
                if (!options.leaveSubmitMethodAlone && typeof textarea.form.submit == "function")
                    textarea.form.submit = realSubmit;
            }
        };
    };
    textarea.style.display = "none";
    let cm = (0, CodeMirror_js_1.CodeMirror)(node => textarea.parentNode.insertBefore(node, textarea.nextSibling), options);
    return cm;
}
exports.fromTextArea = fromTextArea;
