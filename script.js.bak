"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Get references to important HTML elements by their IDs
const uploadBtn = document.getElementById("uploadBtn"); // Upload Button
const fileInput = document.getElementById("fileInput"); // File input field
const resultsF = document.getElementById("results"); // Results area (preformatted text block)
// Add a click event listener to the Upload button
uploadBtn.addEventListener("click", async (e) => {
    // Get the first file selected by the user
    const file = fileInput.files?.[0];
    if (!file) {
        alert("No file selected"); // Show alert if no file is selected
        return;
    }
    // Create formData object to send file data to backend
    const formData = new FormData();
    formData.append("file", file); // Append the selected file under the key "file"
    try {
        // Send the file to the backend at POST /upload
        const response = await fetch("/api/upload", {
            method: "POST", // POST = send data to the backend
            body: formData, // Attach file data
        });
        // Handle error if the backend does not return success
        if (!response.ok) {
            const errorText = await response.text(); // Extract error message from the backend
            resultsF.textContent = `Error ${response.status}: ${errorText}`; // Show error in results area
            return;
        }
        // Convert the backend's JSON response into a JS object
        const result = await response.json();
        // Show the parsed result inside the <pre id="results"> element in a pretty JSON format
        // Convert the JS object "result" into a JSON string
        // First arg (result): the object to stringify
        // Second arg (null): no filtering, include all properties
        // Third arg (2): pretty-print with 2 spaces for indentation
        resultsF.textContent = JSON.stringify(result, null, 2);
        // Catch any errors during the upload/fetch process
    }
    catch (err) {
        // Show an error message in the results area
        resultsF.textContent = `Upload failed: ${err.message}`;
    }
});
//# sourceMappingURL=script.js.map