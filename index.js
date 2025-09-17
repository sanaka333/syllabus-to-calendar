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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
// Import the express framework to build the web server
var express_1 = require("express");
// Import multer to handle file uploads (like PDFs from the frontend)
var multer_1 = require("multer");
// Import pdf-parse library to extract text content from PDF files
var pdf_parse_1 = require("pdf-parse");
// Import the Node.js file system module to read and write files
var fs_1 = require("fs");
// Import dotenv to load environment variables from a .env file
var dotenv_1 = require("dotenv");
// Import the OpenAI library to connect with the OpenAI API
var openai_1 = require("openai");
// Import CORS middleware to allow frontend (running on another port) to talk to backend
var cors_1 = require("cors");
// Import Node.js path module to work with file and directory paths
var path_1 = require("path");
// Create an Express application instance
var app = (0, express_1.default)();
// Enable CORS (Cross-Origin Resource Sharing) so frontend requests from different origins are allowed
app.use((0, cors_1.default)());
// Allow Express to serve static frontend files (HTML, CSS, JS) directly from this folder.
// This lets the browser load index.html, styles.css or script.js without extra routes
// In other words, Express also works as a simple web server for our frontend assets
app.use(express_1.default.static(path_1.default.join(__dirname)));
// Configure Multer middleware to handle file uploads, storing them in the "uploads/" folder
var upload = (0, multer_1.default)({ dest: "uploads/" });
// Initialize the OpenAI client with the API key stored in .env
var client = new openai_1.default.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
// Load environment variables 
dotenv_1.default.config();
console.log("API Key is: " + ((_a = process.env.OPENAI_API_KEY) === null || _a === void 0 ? void 0 : _a.slice(0, 5)));
// GET = the frontend asks the backend for data
// POST = the frontend sends data to the backend
// req (Request) = when the browser sends a request to the server
// res (Response) = when the server sends a response back to the browser
app.get("/", function (req, res) {
    res.sendFile(path_1.default.join(__dirname, "index.html")); // <-- no public
});
app.listen(3000, function () {
    console.log("Server running at http://localhost:3000");
});
app.post("/upload", upload.single("file"), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var dataBuffer, data, response, rawText, tasks, err_1;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                if (!req.file) {
                    return [2 /*return*/, res.status(400).json({ error: "No File Uploaded!" })];
                }
                _c.label = 1;
            case 1:
                _c.trys.push([1, 4, , 5]);
                console.log("Uploaded file:", req.file);
                dataBuffer = fs_1.default.readFileSync(req.file.path);
                return [4 /*yield*/, (0, pdf_parse_1.default)(dataBuffer)];
            case 2:
                data = _c.sent();
                return [4 /*yield*/, client.chat.completions.create({
                        model: "gpt-4.1-mini",
                        response_format: { type: "json_object" },
                        messages: [
                            {
                                role: "system",
                                content: "You are an assistant that extracts tasks and deadlines from syllabi.",
                            },
                            {
                                role: "user",
                                content: "Extract all assignments, readings, and exams from this syllabus. \n                    Output as JSON.\n\n".concat(data.text),
                            },
                        ],
                    })];
            case 3:
                response = _c.sent();
                rawText = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                console.log("Raw AI response:", rawText);
                if (!rawText) {
                    return [2 /*return*/, res.status(500).json({ error: "No content returned from AI" })];
                }
                tasks = typeof rawText === "string" ? JSON.parse(rawText) : rawText;
                console.log("Parsed tasks:", tasks);
                return [2 /*return*/, res.json(tasks)];
            case 4:
                err_1 = _c.sent();
                console.error("Backend error:", err_1.message);
                return [2 /*return*/, res.status(500).json({ error: err_1.message })];
            case 5: return [2 /*return*/];
        }
    });
}); });
