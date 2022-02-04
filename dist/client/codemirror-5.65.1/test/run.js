#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var lint = require("./lint");
var files = new (require('node-static').Server)();
var server = require('http').createServer(function (req, res) {
    req.addListener('end', function () {
        files.serve(req, res, function (err /*, result */) {
            if (err) {
                console.error(err);
                process.exit(1);
            }
        });
    }).resume();
}).addListener('error', function (err) {
    throw err;
}).listen(3000, (() => __awaiter(void 0, void 0, void 0, function* () {
    const puppeteer = require('puppeteer');
    const browser = yield puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = yield browser.newPage();
    page.on('console', msg => console.log("console:", msg.text()));
    page.on('dialog', (dialog) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(dialog.message());
        yield dialog.dismiss();
    }));
    page.evaluateOnNewDocument(() => window.automatedTests = true);
    yield page.goto('http://localhost:3000/test/index.html#' + (process.argv[2] || ""));
    while (1) {
        if (yield page.evaluate(() => window.done))
            break;
        yield sleep(200);
    }
    let [failed, errors] = yield page.evaluate(() => [window.failed, window.errored]);
    for (let error of errors)
        console.log(error);
    console.log(yield page.evaluate(() => document.getElementById('output').innerText + "\n" +
        document.getElementById('status').innerText));
    process.exit(failed > 0 || errors.length || !lint.ok ? 1 : 0);
    yield browser.close();
}))());
function sleep(n) { return new Promise(acc => setTimeout(acc, n)); }
