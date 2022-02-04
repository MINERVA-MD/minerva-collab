import wasm from "../pkg/md4rs_src";

export default function parseFunc(content: string) {
    return wasm.parse(content);
}

console.log(parseFunc("# this is a test"));
