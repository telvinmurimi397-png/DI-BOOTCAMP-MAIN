// ==========================================
// Exercise 1: Calculate the Tip
// ==========================================

// Ensure tip section is hidden on load
document.getElementById("totalTip").style.display = "none";

// Event handler for calculate button click
document.getElementById("calculate").onclick = calculateTip;

function calculateTip() {
  const billAmount = document.getElementById("billAmt").value;
  const serviceQuality = document.getElementById("serviceQual").value;
  let numberOfPeople = document.getElementById("numOfPeople").value;

  // Validation: Check if required inputs are provided
  if (serviceQuality === "0" || billAmount === "") {
    alert("Please enter values for bill amount and service quality!");
    return;
  }

  // Handle number of people default logic
  if (numberOfPeople === "" || parseInt(numberOfPeople) < 1) {
    numberOfPeople = 1;
    document.getElementById("each").style.display = "none";
  } else {
    document.getElementById("each").style.display = "inline";
  }

  // Calculate tip per person
  let total = (parseFloat(billAmount) * parseFloat(serviceQuality)) / parseInt(numberOfPeople);
  total = total.toFixed(2);

  // Display results
  document.getElementById("totalTip").style.display = "block";
  document.getElementById("tip").textContent = total;
}


// ==========================================
// Exercise 2: Validate the Email
// ==========================================

const emailForm = document.getElementById("emailForm");

emailForm.addEventListener("submit", function(event) {
  event.preventDefault();
  const emailValue = document.getElementById("emailInput").value;

  const isValidWithoutRegex = validateWithoutRegex(emailValue);
  const isValidWithRegex = validateWithRegex(emailValue);

  if (isValidWithoutRegex && isValidWithRegex) {
    alert("Email address is valid!");
  } else {
    alert("Please enter a valid email address.");
  }
});

// Solution Part 1: Without Regex
function validateWithoutRegex(email) {
  const atIndex = email.indexOf("@");
  const dotIndex = email.lastIndexOf(".");

  // Checks for:
  // 1. '@' symbol exists and is not the first character
  // 2. '.' exists after '@' with at least one character in between
  // 3. '.' is not the last character
  return (
    atIndex > 0 &&
    dotIndex > atIndex + 1 &&
    dotIndex < email.length - 1
  );
}

// Solution Part 2: With Regex
function validateWithRegex(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}


// ==========================================
// Exercise 3: Get User's Geolocation Coordinates
// ==========================================

const geoBtn = document.getElementById("getGeoBtn");
const geoOutput = document.getElementById("geoOutput");

geoBtn.addEventListener("click", getLocation);

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition, showError);
  } else {
    geoOutput.textContent = "Geolocation is not supported by this browser.";
  }
}

function showPosition(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;
  
  geoOutput.innerHTML = `
    <p>Latitude: ${lat}</p>
    <p>Longitude: ${lon}</p>
  `;
}

function showError(error) {
  geoOutput.textContent = `Unable to retrieve location (${error.message})`;
}