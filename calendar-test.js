"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var content = fs_1.default.readFileSync("credentials.json", "utf-8");
var credentials = JSON.parse(content);
console.log(credentials);
