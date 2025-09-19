# Syllabus to Calendar

## Setup Instructions:

1) Clone the repository:
   ```
      git clone https://github.com/YOUR-USERNAME/syllabus-to-calendar.git
      cd syllabus-to-calendar
   ```

2) Install dependencies:
   ```
      npm install
   ```

3) Update your `package.json` to include a `dev` script:

     ```json
     "scripts": {
       "dev": "ts-node index.ts",
       "test": "echo \"Error: no test specified\" && exit 1"
     }
     ```
4) Create a .env file in the root directory with the following key:
   ```
      OPENAI_API_KEY=your_api_key_here
   ```

5) Run the app:
   ```
      npm run dev
   ```

6) (Optional) Use the sample syllabi provided in the test-files/ folder to test the application.

---

## Explanation of Approach:
The goal of this project was to take a syllabus in PDF format and transform it into a structured calendar. The approach involved the following steps:
1) File Upload:
   - The user uploads a syllabus in PDF format.  
   - The file is handled by Multer middleware and saved in the `uploads/` folder.  
   - These files are considered temporary working files used only for processing and are ignored in version control (`.gitignore`).
   
2) Text Extraction:  
   - When a user uploads a PDF syllabus, the file is received as raw binary data.  
   - A library such as `pdf-parse` converts this binary into raw text.  
   - The extracted text is then cleaned by removing unnecessary whitespace, line breaks, and formatting artifacts to prepare it for LLM processing.

3) LLM Processing:
   - The cleaned syllabus text is sent to a Large Language Model (OpenAI/Claude).  
   - The LLM analyzes the content and generates structured output that looks like JSON.  
   - This output includes key fields such as dates, titles, and descriptions of assignments or exams.  
   - However, the LLM usually returns this data as a raw string rather than an actual JSON object.

4) JSON Parsing and Response:
   - The backend takes the raw string returned by the LLM and parses it into a valid JSON object using `JSON.parse()`.  
   - Once parsed, the backend can directly access fields like `date`, `title`, and `description` without extra text processing.  
   - This JSON object is then sent back to the frontend as the response, where it can be displayed or used for further features.

5) Testing:
   - Two sample syllabus files (`Dawson-Syllabus-Fall-2024.pdf` and `Syllabus-1950.pdf`) are included in the `test-files/` folder.  
   - These files are provided to demonstrate the upload, extraction, and conversion workflow without requiring users to supply their own syllabus immediately.

---

# Bonus: Google Calendar API Integration

## Setup Instructions:
1) Enable Google Calendar API (per user):
      - Each user who wants to run this project with their own Google Calendar must create a Google Cloud project:
           - Go to the Google Cloud Console.
           - Create a new project (or use an existing one).
           - Enable the Google Calendar API.
           - Generate OAuth 2.0 Client ID credentials and download the `credentials.json` file.

2) Store your credentials:
      - Save the `credentials.json` file in the project root (or wherever your code expects it).
      - Add it to `.gitignore` so it’s never pushed to GitHub.

3) Install dependencies:
    ```
    npm install
    npm install googleapis
    ```
   
4) Authenticate:
      - Run the app once.
      - You’ll be asked to log in with your Google account and approve access.
      - The app will save a token for future requests (so you don’t have to log in every time).

## Explanation of Approach:
1) App starts the process:
      - Your app has a `client_id` and `client_secret` inside `credentials.json`.
      - These act as your app’s ID card when talking to Google.

2) App redirects the user to Google:
      - It sends the client ID, requested scope (`https://www.googleapis.com/auth/calendar`), and a redirect URI.
      - Google shows a consent screen.

3) User grants permission:
      - The user clicks Allow to let the app manage their calendar.

4) Google sends back a code:
      - Redirects the user back to your app’s redirect URI with an authorization code (a one-time ticket).

5) App exchanges the code for tokens:
   - Your app sends the code + client secret back to Google.
     - Google responds with:
       - Access token → allows API calls (valid ~1 hour).
       - Refresh token → allows your app to get new access tokens without asking the user again.

6) Your app saves the tokens:
   - Tokens are usually stored in a file like `token.json`.
   - Next time the app runs:
     - If valid tokens exist → **skip login**.
     - If expired → use the **refresh token** to get a new access token automatically.

7. Now the app can call the Calendar API
   - Every request you send to Google Calendar must include the access token in the header:

      ```http
      Authorization: Bearer <ACCESS_TOKEN>
      ```
   - Google verifies the token. If valid, your app can insert events, list events, update, or delete them.
    

