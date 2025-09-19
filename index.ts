// Import the express framework to build the web server
import express from "express";

// Import Request and Response types for better TypeScript type safety
// - Request: typed object that represents the incoming HTTP request from the frontend
//   (includes params, body, query, headers, uploaded files, etc.).
// - Response: typed object that represents the HTTP response we send back to the frontend
//   (includes methods like .json(), .status(), .send()).
// Using these types improves TypeScript type safety, ensures better autocompletion,
// and prevents mistakes when handling req/res objects in routes.
import type { Request, Response } from "express";

// Import multer to handle file uploads (like PDFs from the frontend)
import multer from "multer";

// Import pdf-parse library to extract text content from PDF files
import PdfParse from "pdf-parse";

// Import the Node.js file system module to read and write files
import fs from "fs";

// Import dotenv to load environment variables from a .env file
import dotenv from "dotenv";

// Import the OpenAI library to connect with the OpenAI API
import openai from "openai";

// Import CORS middleware to allow frontend (running on another port) to talk to backend
import cors from "cors";

// Import Node.js path module to work with file and directory paths
import path from "path";

// Create an Express application instance
const app = express();

// Enable CORS (Cross-Origin Resource Sharing) so frontend requests from different origins are allowed
app.use(cors());

// Allow Express to serve static frontend files (HTML, CSS, JS) directly from this folder.
// This lets the browser load index.html, styles.css or script.js without extra routes
// In other words, Express also works as a simple web server for our frontend assets
app.use(express.static(path.join(__dirname)));

// Configure Multer middleware to handle file uploads
// - Use memoryStorage() instead of writing files to disk
// - This means uploaded PDFs are stored directly in memory as a Buffer
// - Avoids issues on platforms like Vercel where the file system is read-only
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Load environment variables from the .env file into process.env
// In production (Vercel), env vars come from the dashboard instead.
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Initialize the OpenAI client with the API key stored in .env
const client = new openai.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// GET = the frontend asks the backend for data
// POST = the frontend sends data to the backend

// req (Request) = when the frontend sends a request to the backend
// res (Response) = when the backend sends a response back to the frontend

// Define a GET endpoint for the root URL ("/")
// req = the incoming request from the frontend
// res = the response we send back to the frontend
app.get("/", (req: Request, res: Response) => {
  // Send the index.html file when the frontend accesses the root URL
  res.sendFile(path.join(__dirname, "public/"));  
});

// Start the Express server on port 3000
app.listen(3000, () => {
    // Log a message so we know the server is running
    console.log("Server running at http://localhost:3000");
});

// Define a POST endpoint at "/upload" to handle file uploads
// "upload.single('file')" tells multer to accept a single file upload with field name "file"
// The handler function is marked "async" so we can use "await" inside (for example, waiting for PDF parsing or API calls)
app.post("/upload", upload.single("file"), async (req: Request, res: Response) => {

  // If no file was uploaded, return an error response to the frontend
  if (!req.file) {
    return res.status(400).json({ error: "No File Uploaded!" });
  }

  try {
    // Log the uploaded file info (filename, path, size, etc.)
    console.log("Uploaded file:", req.file);

    // Read the uploaded PDF into a buffer (raw binary data)
     const dataBuffer = req.file.buffer;

    // Use pdf-parse to extract text from the PDF buffer
    // - The "buffer" contains the raw binary data of the uploaded PDF
    // - pdf-parse converts that binary into plain text (the entire PDF contents)
    // - This includes everything: headings, paragraphs, assignments, notes, etc.
    // - It does NOT know what's important — it just dumps all text
    // - Later, the OpenAI API is used to filter this raw text into useful JSON
    const data = await PdfParse(dataBuffer);

    // Send the extracted PDF text to OpenAI to organize it into structured JSON
    // - The model takes the raw syllabus text and pulls out useful parts
    // - Example: assignments, readings, and exams returned as a JSON object
    // - This makes the data predictable and easy for the frontend to work with
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",  // Use GPT-4.1-mini model
      response_format: { type: "json_object" },  // Force the output to be valid JSON
      messages: [
        {
          role: "system", // System role = defines how the model should behave and what rules to follow
          content: "You are an assistant that extracts tasks and deadlines from syllabi.",
        },
        {
          role: "user", // User role is where we send the actual prompt
          content: `Extract all assignments, readings, and exams from this syllabus. 
                    Output as JSON.\n\n${data.text}`,
          // data.text = the raw syllabus text extracted by pdf-parse
          // Including it here gives the model the actual content to analyze,
          // so it can pull assignments, readings, and exams from the real PDF text
        },
      ],
    });

    // Extract the AI's response content (the text or JSON returned by OpenAI)
    const rawText = response.choices[0]?.message?.content;

    // If nothing came back from the AI, return a 500 error to the frontend
    if (!rawText) {
      return res.status(500).json({ error: "No content returned from AI" });
    }

    // If the AI response is a string, parse it into JSON.
    // Otherwise, assume it's already JSON and use it directly.
    const tasks = typeof rawText === "string" ? JSON.parse(rawText) : rawText;

    // Send the parsed tasks back to the frontend as a JSON response
    return res.json(tasks);
  } catch (err: any) {
    // If any error happens, log it on the backend
    console.error("Backend error:", err.message);

    // Return a 500 error response with the error message to the frontend
    return res.status(500).json({ error: err.message });
  }
});

