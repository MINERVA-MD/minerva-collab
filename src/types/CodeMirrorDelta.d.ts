export type CodeMirrorDelta = {
  from: { line: number; ch: number; sticky: null | string };
  to: { line: number; ch: number; sticky: null | string };
  text: string[];
  removed: string[];
  origin: string;
};
