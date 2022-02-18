import { Update } from "@codemirror/collab";

export type CodeMirrorOps = {
    from: { line: number; ch: number; sticky: null | string };
    to: { line: number; ch: number; sticky: null | string };
    text: string[];
    removed: string[];
    origin: string;
};

export type ClientChanges = {
    version: number;
    updates: {
        updateJSON: any;
        clientID: string;
    }[];
};
