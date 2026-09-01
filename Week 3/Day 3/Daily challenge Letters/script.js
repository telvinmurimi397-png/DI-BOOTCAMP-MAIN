const inputField = document.getElementById("lettersOnly");

// Using the 'input' event to strip out non-letter characters in real-time
inputField.addEventListener("input", function (event) {
  // Regular Expression: [^a-zA-Z] matches any character that is NOT an uppercase or lowercase letter
  // replace() swaps any non-letter character with an empty string
  event.target.value = event.target.value.replace(/[^a-zA-Z]/g, "");
});