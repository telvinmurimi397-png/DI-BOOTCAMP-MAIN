// 1. DOM Elements
const contentDiv = document.getElementById('content');
const button = document.getElementById('find-btn');

// 2. Event Listener
button.addEventListener('click', getRandomCharacter);

// 3. Main Function
async function getRandomCharacter() {
  // Display loading state with FontAwesome spinner
  showLoading();

  // Generate random character ID between 1 and 83
  const randomId = Math.floor(Math.random() * 83) + 1;

  try {
    // Fetch character details
    const res = await fetch(`https://www.swapi.tech/api/people/${randomId}`);
    if (!res.ok) throw new Error("Character not found");

    const data = await res.json();
    const character = data.result.properties;

    // Fetch homeworld name using the homeworld URL provided in the character details
    const homeworldName = await getHomeworld(character.homeworld);

    // Display character info
    displayCharacter(character, homeworldName);

  } catch (error) {
    displayError();
  }
}

// Fetch Homeworld Function
async function getHomeworld(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return "Unknown";
    const data = await res.json();
    return data.result.properties.name;
  } catch {
    return "Unknown";
  }
}

// Display Character Info
function displayCharacter(character, homeworld) {
  contentDiv.innerHTML = `
    <div class="character-info">
      <h2>${character.name}</h2>
      <p><strong>Height:</strong> ${character.height} cm</p>
      <p><strong>Gender:</strong> ${character.gender}</p>
      <p><strong>Birth Year:</strong> ${character.birth_year}</p>
      <p><strong>Home World:</strong> ${homeworld}</p>
    </div>
  `;
}

// Loading Message
function showLoading() {
  contentDiv.innerHTML = `
    <div class="loading-spinner">
      <i class="fa-solid fa-spinner fa-spin"></i>
    </div>
    <p>Loading...</p>
  `;
}

// Error Message
function displayError() {
  contentDiv.innerHTML = `<p>Oh No! That person isn't available.</p>`;
}