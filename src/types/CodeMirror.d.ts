import { Update } from "@codemirror/collab";

export type ClientChanges = {
    version: number;
    updates: {
        updateJSON: any;
        clientID: string;
    }[];
};
