const form = document.getElementById("sunrise-form");
const resultsDiv = document.getElementById("results");

async function fetchSunrise(lat, lng) {
  const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results.sunrise;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const lat1 = document.getElementById("lat1").value;
  const lng1 = document.getElementById("lng1").value;
  const lat2 = document.getElementById("lat2").value;
  const lng2 = document.getElementById("lng2").value;

  resultsDiv.textContent = "Fetching sunrise times...";

  try {
    const [sunrise1, sunrise2] = await Promise.all([
      fetchSunrise(lat1, lng1),
      fetchSunrise(lat2, lng2)
    ]);

    resultsDiv.innerHTML = `
      <p>City 1 Sunrise: ${sunrise1} (UTC)</p>
      <p>City 2 Sunrise: ${sunrise2} (UTC)</p>
    `;
  } catch (error) {
    console.error("Error fetching sunrise data:", error);
    resultsDiv.textContent = "Failed to retrieve sunrise times. Please try again.";
  }
});