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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
exports.__esModule = true;
// Import the express framework to build the web server
var express_1 = require("express");
// Import multer to handle file uploads (like PDFs from the frontend)
var multer_1 = require("multer");
// Import pdf-parse library to extract text content from PDF files
var pdf_parse_1 = require("pdf-parse");
// Import the OpenAI library to connect with the OpenAI API
var openai_1 = require("openai");
// Import CORS middleware to allow frontend (running on another port) to talk to backend
var cors_1 = require("cors");
// Import Node.js path module to work with file and directory paths
var path_1 = require("path");
// Create an Express application instance
var app = (0, express_1["default"])();
// Enable CORS (Cross-Origin Resource Sharing) so frontend requests from different origins are allowed
app.use((0, cors_1["default"])());
// Build an absolute path to the "public" folder
// process.cwd() = current working directory (project root)
// path.join(...) = safely join "project root" + "public"
var publicPath = path_1["default"].join(process.cwd(), "public");
// Allow Express to serve static frontend files (HTML, CSS, JS) directly from this folder.
// This lets the browser load index.html, styles.css or script.js without extra routes
// In other words, Express also works as a simple web server for our frontend assets
app.use(express_1["default"].static(publicPath));
// Configure Multer middleware to handle file uploads
// - Use memoryStorage() instead of writing files to disk
// - This means uploaded PDFs are stored directly in memory as a Buffer
// - Avoids issues on platforms like Vercel where the file system is read-only
var storage = multer_1["default"].memoryStorage();
var upload = (0, multer_1["default"])({ storage: storage });
// Load environment variables from the .env file into process.env
// In production (Vercel), env vars come from the dashboard instead.
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}
// Initialize the OpenAI client with the API key stored in .env
var client = new openai_1["default"].OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
// GET = the frontend asks the backend for data
// POST = the frontend sends data to the backend
// req (Request) = when the frontend sends a request to the backend
// res (Response) = when the backend sends a response back to the frontend
// Define a GET endpoint for the root URL ("/")
// req = the incoming request from the frontend
// res = the response we send back to the frontend
app.get("/", function (req, res) {
    // Send the index.html file when the frontend accesses the root URL
    res.sendFile(path_1["default"].join(publicPath, "index.html"));
});
// Start the Express server on port 3000
app.listen(3000, function () {
    // Log a message so we know the server is running
    console.log("Server running at http://localhost:3000");
});
// Define a POST endpoint at "/upload" to handle file uploads
// "upload.single('file')" tells multer to accept a single file upload with field name "file"
// The handler function is marked "async" so we can use "await" inside (for example, waiting for PDF parsing or API calls)
app.post("/api/upload", upload.single("file"), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var dataBuffer, data, response, rawText, tasks, err_1;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                // If no file was uploaded, return an error response to the frontend
                if (!req.file) {
                    return [2 /*return*/, res.status(400).json({ error: "No File Uploaded!" })];
                }
                _c.label = 1;
            case 1:
                _c.trys.push([1, 4, , 5]);
                // Log the uploaded file info (filename, path, size, etc.)
                console.log("Uploaded file:", req.file);
                dataBuffer = req.file.buffer;
                return [4 /*yield*/, (0, pdf_parse_1["default"])(dataBuffer)];
            case 2:
                data = _c.sent();
                return [4 /*yield*/, client.chat.completions.create({
                        model: "gpt-4.1-mini",
                        response_format: { type: "json_object" },
                        messages: [
                            {
                                role: "system",
                                content: "You are an assistant that extracts tasks and deadlines from syllabi."
                            },
                            {
                                role: "user",
                                content: "Extract all assignments, readings, and exams from this syllabus. \n                    Output as JSON.\n\n".concat(data.text)
                            },
                        ]
                    })];
            case 3:
                response = _c.sent();
                rawText = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                // If nothing came back from the AI, return a 500 error to the frontend
                if (!rawText) {
                    return [2 /*return*/, res.status(500).json({ error: "No content returned from AI" })];
                }
                tasks = typeof rawText === "string" ? JSON.parse(rawText) : rawText;
                // Send the parsed tasks back to the frontend as a JSON response
                return [2 /*return*/, res.json(tasks)];
            case 4:
                err_1 = _c.sent();
                // If any error happens, log it on the backend
                console.error("Backend error:", err_1.message);
                // Return a 500 error response with the error message to the frontend
                return [2 /*return*/, res.status(500).json({ error: err_1.message })];
            case 5: return [2 /*return*/];
        }
    });
}); });
