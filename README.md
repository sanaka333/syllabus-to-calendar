# Syllabus to Calendar

## Setup Instructions

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

## Explanation of Approach
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
