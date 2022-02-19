import { Update } from "@codemirror/collab";
import { Text } from "@codemirror/text";
import { ChangeSet } from "@codemirror/state";

import { ClientChanges } from "../src/types/CodeMirror";
import DocumentAuthority from "../src/models/contentModel";
import Client from "socket.io-client";
import { io } from "../server";
import socket from "../src/controller/socket";
import { Server, Socket } from "socket.io";

// TESTS
describe("Initializing new document authority", () => {
    const doc = new DocumentAuthority(undefined);
    test("Blank document", () => {
        console.log(doc.doc);
        expect(doc.doc).toEqual(Text.of([""]));
    });

    test("Empty update history", () => {
        expect(doc.getUpdates().length).toEqual(0);
    });
});

describe("Initialize document authority with existing data", () => {
    const { doc, updates } = mockDocumentAuthority();

    test("Document has been seeded by constructor", () => {
        expect(doc.doc).toEqual(Text.of(["sdf"]));
    });

    test("Updates seeded by constructor", () => {
        expect(doc.getUpdates()).toBe(updates);
    });
});

// HELPERS
function mockDocumentAuthority(
    mockument: string[] = ["sdf"],
    serializedChanges: any = [[[0, "s"]], [1, [0, "d"]], [2, [0, "f"]]]
) {
    const deserializedChanges: ChangeSet[] = serializedChanges.map(
        (u: Array<number | string>) => {
            return ChangeSet.fromJSON(u);
        }
    );
    const updates: Update[] = [];
    deserializedChanges.forEach((u) => {
        updates.push({ changes: u, clientID: "ci9k21" });
    });

    return {
        doc: new DocumentAuthority(mockument, updates),
        updates,
        mockument,
        serializedChanges,
    };
}
