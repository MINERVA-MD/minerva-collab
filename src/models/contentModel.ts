import { text } from "express";

let textData: string[];

export function insertChar(position: number, character: string) {
  if (textData) {
    textData.splice(position, 0, character);
  } else {
    textData = [character];
  }
  return textData.join("");
}

export function deleteChar(position: number) {
  if (textData && textData.length !== 0) {
    textData.splice(position - 1, 1);
    return textData.join("");
  }
  return textData;
}
