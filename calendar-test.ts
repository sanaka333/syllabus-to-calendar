// Import the 'fs' (file system) module from Node.js
// This lets us read/write files on the computer
import fs from "fs";

// Import the 'path' module from Node.js
// Helps us safely work with file and folder paths (OS independent)
import path from "path";

// Import the 'http' module from Node.js
// Lets us create a simple local server (needed for OAuth redirect handling)
import http from "http";

// Import the 'googleapis' library
// This contains all the Google API clients (Calendar, Drive, Gmail, etc.)
import { google } from "googleapis";

// Import the 'open' package
// Lets us automatically open a URL in the default web browser (so user doesn't need to copy-paste)
import open from "open";

// Define the absolute path to the credentials.json file
// process.cwd() = "current working directory" (the folder where you run the command from)
// Using process.cwd() only works if you always run the program from the project folder
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

// Define the absolute path to the token.json file
// path.join() = safely builds a file path 
// This file will store the user's OAuth tokens once they've logged in
const TOKENS_PATH = path.join(process.cwd(), "token.json");

// Read the credentials.json file synchronously (blocking)
// fs.readFileSync(..., "utf-8") -> loads the file content as text
// JSON.parse(...) -> converts that text into a JavaScript object 
const credentials = JSON.parse(fs.readFileSync("credentials.json", "utf-8"));

// Extract specific fields from credentials.web
// client_id = unique app ID from Google
// client_secret = password-like value for your app
// redirect_uris = list of redirect URLs registered in Google Cloud console
const { client_id, client_secret, redirect_uris } = credentials.web;

// Create an OAuth2 client object using Google's library
// Parameters: (client_id, client_secret, first redirect URI)
// redirect_uris[0] = the first URL listed in credentials.json
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// Why do we need tokens?
// - Google Calendar API needs proof that the user allowed access
// - The access_token is what lets us:
//     Read events
//     Add new events
//     Update existing events
//     Delete events
// - Without tokens, the API would reject the request as "unauthorized"
// - refresh_token ensures we can keep doing this without asking the user
//   to log in again each time

// access_token = short-lived key (usually 1 hour)
//   - Sent with every API request to prove identity
//   - Expires quickly for security
//
// refresh_token = long-lived key
//   - Lets the app request new access_tokens automatically
//   - User doesn’t need to log in again
//   - Only issued the first time (or when 'prompt: "consent"' is used)
//
// Together:
//   - App uses access_token until it expires
//   - Then uses refresh_token to grab a fresh access_token silently
//   - This way, the app stays authorized even if user is offline

// Check if "token.json" already exists in the project folder
// (fs.existsSync returns true if the file is found, false otherwise)
if(fs.existsSync(TOKENS_PATH)){

    // If token.json exists, read the file immediately and wait until it's done 
    // (the program pauses here until the file is fully loaded).
    // fs.readFileSync("token.json", "utf-8") -> returns the file contents as a string
    // JSON.parse(...) -> converts that string into a usable JS object
    const tokens = JSON.parse(fs.readFileSync("token.json", "utf-8"));

    // Set those tokens (access + refresh) as the current credentials
    // This means we don't need to ask the user to log in again
    oAuth2Client.setCredentials(tokens);

    // Log confirmation message in the terminal
    console.log("Loaded tokens from token.json");

    // Call our custom function to fetch and display calendar events
    listEvents();
}
else{
    // If no token.json is found, we must start a new login flow
    // This will generate a new token.json after user authentication
    getAccessToken();
}

// Function to get a new access + refresh token from Google
function getAccessToken(){

    // Generate the Google OAuth2 URL (where the user grants permission)
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline", // ask Google for a refresh token as well
        prompt: "consent", // forces Google to always show the consent screen
        scope: ["https://www.googleapis.com/auth/calendar"], // request access to Google Calendar
    });

    // Print the URL to the console (backup, in case auto-open fails)
    console.log("Authorize this app by visiting this URL:", authUrl);

    // Auto-open the URL in the default browser (so user can log in)
    open(authUrl); 

     // Start a local HTTP server to handle Google's OAuth callback
     // - http.createServer(...) takes a callback function (req, res) → this is a Node.js
     //   "callback" meaning: a function that runs whenever the server gets a request.
     // - In OAuth terms, "callback" means the redirect URI where Google sends the user
     //   back after login, along with a temporary ?code=12345 in the URL.
     // - So here we are using a *callback function* to listen for the *OAuth callback URL*.
     //   Example: http://localhost:3000/?code=12345
    const server = http.createServer(async (req, res) => {

        // Check if the requests contains "?code=" (Google sends it back here)
        // req.url.indexOf("/oauth2callback?code=")
        //   → indexOf() searches for the given substring in req.url
        //   → If found, it returns the position (0, 1, 2, ...)
        //   → If NOT found, it returns -1
        //
        // So `> -1` means: "Did we find '/oauth2callback?code=' somewhere in the URL?"
        //   - If true → the URL contains the authorization code from Google
        //   - If false → the URL doesn't contain the code yet
        if (req.url && req.url.indexOf("/oauth2callback?code=") > -1) {

        // Parse the URL (tell Node we expect it at localhost:3000)
        // new URL(req.url, "http://localhost:3000")
        // - req.url = only the path + query (example: "/?code=12345")
        // - URL(...) needs a *full* URL, so we pass "http://localhost:3000" as the base.
        //   That tells Node: "assume any incoming request belongs to localhost:3000".
        // - Result: urlParams is a full URL object → "http://localhost:3000/?code=12345"
        const urlParams = new URL(req.url, "http://localhost:3000");

        // Extract the "code" parameter (the one-time authorization code)
        const code = urlParams.searchParams.get("code");

        // Send a response back to the browser (user sees this)
        res.end("Authorization successful! You can close this window.");
        
        // Close the local server. 
        // This server’s only job was to catch the redirect from Google after the user approved access. 
        // Google sends the user to the redirect URI (e.g., http://localhost:3000/?code=...),
        // which contains the one-time authorization code in the URL. 
        // Once we’ve captured that code, the server is no longer needed.
        server.close();

        if (code) {
            // If Google sent back an authorization code in the redirect URL...

            // Exchange that one-time authorization code for actual tokens:
            // - access_token (short-lived, ~1 hour)
            // - refresh_token (long-lived, lets us get new access tokens without asking the user again)
            const { tokens } = await oAuth2Client.getToken(code);

             // Store the tokens inside our OAuth2 client instance so all future API calls are authenticated
            oAuth2Client.setCredentials(tokens);

        // Save tokens to file so the user doesn’t have to log in again next time
        fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens));

        // Helpful log: confirms tokens were saved locally
        console.log("Tokens stored to token.json");

        // Example API call: fetches and displays calendar events to prove authentication worked
        listEvents();
      }
    }
  });

  // Start listening on port 3000 so Google can redirect the user back here
  server.listen(3000, () => {
    // Log so you know the server is live and ready to catch the redirect with the code
    console.log("Server running at http://localhost:3000");
  });
}

// Define an async function (because we'll use "await" inside)
async function listEvents() {
  
  // Create a Google Calendar API client (v3) using our authenticated OAuth2 client
  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

  // Request a list of upcoming events from the user's primary calendar
  const res = await calendar.events.list({
    calendarId: "primary",  // "primary" = the main Google Calendar
    timeMin: new Date().toISOString(),  // Only return events starting *after now*
    maxResults: 10, // Limit to 10 events
    singleEvents: true, // Expand recurring events (e.g. weekly meetings) into individual dates instead of one series rule
    orderBy: "startTime", // Sort events by start time
  });

  // Extract the events array from the API response
  const events = res.data.items;

  // If there are no events, log a message and stop the function
  if (!events || events.length === 0) {
    console.log("No upcoming events found.");
    return;
  }

  // Otherwise, log a header message
  console.log("Upcoming events:");

  // Loop through each event and print its start time and summary
  events.forEach((event) => {
    // If event has a specific start time → use it
    // If it's an all-day event → use just the date
    const start = event.start?.dateTime || event.start?.date;
    console.log(`${start} - ${event.summary}`);
  });
}



