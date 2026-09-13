// Global variable to track the currently displayed Pokémon ID
let currentPokemonId = 1;

// 1. DOM Elements
const displayContent = document.getElementById('display-content');
const randomBtn = document.getElementById('random-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// 2. Event Listeners
randomBtn.addEventListener('click', getRandomPokemon);
prevBtn.addEventListener('click', getPreviousPokemon);
nextBtn.addEventListener('click', getNextPokemon);

// Fetch Pokémon by ID or Name
async function fetchPokemon(idOrName) {
  showLoading();
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${idOrName}`);
    if (!res.ok) throw new Error("Pokemon not found");

    const data = await res.json();
    currentPokemonId = data.id; // Update global state
    displayPokemon(data);
  } catch (error) {
    displayError();
  }
}

// 3. Button Actions
async function getRandomPokemon() {
  const randomId = Math.floor(Math.random() * 898) + 1; // Generation 1-8 range
  await fetchPokemon(randomId);
}

async function getPreviousPokemon() {
  if (currentPokemonId <= 1) return;
  await fetchPokemon(currentPokemonId - 1);
}

async function getNextPokemon() {
  await fetchPokemon(currentPokemonId + 1);
}

// 4. UI Display Helpers
function displayPokemon(data) {
  const types = data.types.map(t => t.type.name).join(', ');
  const sprite = data.sprites.front_default || data.sprites.other['official-artwork'].front_default;

  displayContent.innerHTML = `
    <img src="${sprite}" alt="${data.name}">
    <div class="pokemon-info">
      <h2>${data.name} (#${data.id})</h2>
      <p><strong>Height:</strong> ${data.height / 10} m</p>
      <p><strong>Weight:</strong> ${data.weight / 10} kg</p>
      <p><strong>Type:</strong> ${types}</p>
    </div>
  `;
}

function showLoading() {
  displayContent.innerHTML = `
    <div class="loading-spinner">
      <i class="fa-solid fa-spinner fa-spin"></i>
    </div>
    <p>Loading Pokémon...</p>
  `;
}

function displayError() {
  displayContent.innerHTML = `<p>Oh no! That Pokemon isn't available...</p>`;
}