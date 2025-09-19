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

// Import the 'googleapis' library
// This contains all the Google API clients (Calendar, Drive, Gmail, etc.)
import { google } from "googleapis";

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

// Define the absolute path to the credentials.json file
// process.cwd() = "current working directory" (the folder where you run the command from)
// Using process.cwd() only works if you always run the program from the project folder
// No longer needed — credentials now come from environment variables
// const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

// Define the absolute path to the token.json file
// path.join() = safely builds a file path 
// This file will store the user's OAuth tokens once they've logged in
const TOKENS_PATH = path.join(process.cwd(), "token.json");

// Load Google API credentials from environment variables (set in Vercel dashboard)
// - client_id and client_secret come from your Google Cloud app
// - redirect_uris must match the one you configured in Google Cloud + Vercel
// - token_uri and auth_uri are fixed Google endpoints
const credentials = {
  installed: {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uris: [process.env.GOOGLE_REDIRECT_URI],
    token_uri: "https://oauth2.googleapis.com/token",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
  },
};

// Extract specific fields from credentials.web
// client_id = unique app ID from Google
// client_secret = password-like value for your app
// redirect_uris = list of redirect URLs registered in Google Cloud console
const { client_id, client_secret, redirect_uris } = credentials.installed;

// Create an OAuth2 client object using Google's library
// Parameters: (client_id, client_secret, first redirect URI)
// redirect_uris[0] = the first URL listed in credentials.json
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// Check if "token.json" already exists in the project folder
// (fs.existsSync returns true if the file is found, false otherwise)
if (fs.existsSync(TOKENS_PATH)) {

  // If token.json exists, read the file immediately and wait until it's done 
  // (the program pauses here until the file is fully loaded).
  // fs.readFileSync("token.json", "utf-8") -> returns the file contents as a string
  // JSON.parse(...) -> converts that string into a usable JS object
  const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf-8"));

  // Set those tokens (access + refresh) as the current credentials
  // This means we don't need to ask the user to log in again
  oAuth2Client.setCredentials(tokens);

  // Log confirmation message in the terminal
  console.log("Loaded Google tokens from token.json");
} else {
  // If token.json does NOT exist:
  // - It means the app has not yet gone through the OAuth2 login flow
  // - Without token.json, the app has no access/refresh tokens to talk to Google Calendar API
  // - So we cannot authenticate or make any calendar requests
  console.error("token.json not found. Run calendar-test.ts first.");

  // Exit the Node.js process with status code 1 (error)
  // - process.exit(0) = success/normal exit
  // - process.exit(1) = failure/error exit
  // This prevents the server from running in an invalid state without credentials
  process.exit(1);
}

// Function: isValidDate
// Purpose: Check if a given string is a valid date
function isValidDate(d: string) {
  // Date.parse(d):
  //   - Attempts to convert the string `d` into a timestamp (milliseconds since Jan 1, 1970).
  //   - If the string looks like a real date (e.g., "2024-10-14"), it returns a number (the timestamp).
  //   - If the string is NOT a valid date (e.g., "hello" or "2024-99-99"), it returns NaN.

  // isNaN(...):
  //   - Checks if the value is "NaN" (Not a Number).
  //   - If the value is NaN, it means the date string could NOT be parsed into a valid date.

  // '!isNaN(...)':
  //   - Negates the result.
  //   - So if Date.parse(d) is a valid number → !isNaN(...) = true (valid date).
  //   - If Date.parse(d) is NaN → !isNaN(...) = false (invalid date).
  return !isNaN(Date.parse(d));
}

// Function: addEvent
// Purpose: Add a new event to Google Calendar using the provided title, description, and date.
async function addEvent(title: string, description: string, date: string) {
  // Create a Google Calendar client
  // - google.calendar() initializes the Calendar API client.
  // - version: "v3" means we’re using version 3 of the Calendar API.
  // - auth: oAuth2Client is the authorized client (with access token + refresh token).
  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

  // Validate the date before creating the event
  // - If the date string is invalid (e.g., "hello" or "2024-99-99"), skip this event.
  // - This prevents "Invalid time value" errors when trying to insert into Google Calendar.
  if (!isValidDate(date)) {
    console.error(`Skipping invalid date: ${date}`);
    return;
  }

  // Define the start and end times of the event
  // - new Date(`${date}T10:00:00-07:00`) creates a Date object at 10:00 AM PST/PDT (UTC-7 offset).
  // - toISOString() converts the Date object into the exact string format Google Calendar expects.
  // - The end time is set to 11:00 AM (1 hour later).
  const start = new Date(`${date}T10:00:00-07:00`).toISOString();
  const end = new Date(`${date}T11:00:00-07:00`).toISOString();

  // Build the event object
  // - summary: the event title (what shows up in the calendar).
  // - description: extra details about the event (like readings or exam info).
  // - start / end: specify exact date/time and the timezone.
  //   - Google Calendar requires both start and end values.
  const event = {
    summary: title,
    description,
    start: { dateTime: start, timeZone: "America/Los_Angeles" },
    end: { dateTime: end, timeZone: "America/Los_Angeles" },
  };

  try {
    const res = await calendar.events.insert({
      // "primary" = the main Google Calendar of the authorized account.
      // You could also use a specific calendar ID.
      calendarId: "primary",

      // requestBody = the actual event data we want to send to Google Calendar.
      // This object MUST follow Google's Event resource format.
      // { summary, description, start {dateTime, timeZone}, end {dateTime, timeZone} }
      requestBody: event,
    });
    console.log(`Added: ${title} (${date})`);
    return res.data; // Return the event Google Calendar actually created.
  } catch (err: any) {
    console.error("Error adding event:", err.message);
    throw err; // Throw an error if the event can't be added
  }
}

// GET = the frontend asks the backend for data
// POST = the frontend sends data to the backend

// req (Request) = when the frontend sends a request to the backend
// res (Response) = when the backend sends a response back to the frontend

// Define a GET endpoint for the root URL ("/")
// req = the incoming request from the frontend
// res = the response we send back to the frontend
app.get("/", (req: Request, res: Response) => {
  // Send the index.html file when the frontend accesses the root URL
  res.sendFile(path.join(__dirname, "index.html"));  
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
    // - Multer provides the file contents directly in memory as req.file.buffer
    // - This buffer is the raw binary form of the uploaded PDF (not text yet)
    // - We will pass this buffer to pdf-parse to extract plain text later
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
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" }, // enforce valid JSON
      messages: [
      {
        role: "system",
        content: "You are an assistant that extracts tasks and deadlines from syllabi. Always return valid JSON only."
      },
      {
        role: "user",
        content: `Extract ALL key events from the syllabus, including:
                  - Weekly readings
                  - Assignments and project due dates
                  - Quizzes, midterms, and finals

                  Return them in this structure:
                  {
                    "events": [
                      { "title": "Week 1 Readings", "description": "Pages 1-50", "date": "2024-09-02" },
                      { "title": "Assignment 1 Due", "description": "Submit case brief", "date": "2024-09-10" },
                      { "title": "Midterm Exam", "description": "Covers Weeks 1-5", "date": "2024-10-15" }
                    ]
                  }
                  ${data.text}`
        // data.text = the raw syllabus text extracted by pdf-parse
        // Including it here gives the model the actual content to analyze,
        // so it can pull assignments, readings, and exams from the real PDF text
      }
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

    // Check if tasks.events exists and is an array
    if (tasks.events && Array.isArray(tasks.events)) {
      // Loop through each event object inside tasks.events
      for (const e of tasks.events) {
        // Print the event object to the console
        console.log("Adding event:", e); 

        // Call addEvent function with event data (title, description, date)
        // "await" ensures each addEvent finishes before moving to the next one
        await addEvent(e.title, e.description, e.date);
      }
    }

    // Send the parsed tasks back to the frontend as a JSON response
    return res.json(tasks);
  } catch (err: any) {
    // If any error happens, log it on the backend
    console.error("Backend error:", err.message);

    // Return a 500 error response with the error message to the frontend
    return res.status(500).json({ error: err.message });
  }
});



