const form = document.getElementById("libform");
const storySpan = document.getElementById("story");
const shuffleBtn = document.getElementById("shuffle-button");

// Define an array of story templates
const storyTemplates = [
  (noun, adj, person, verb, place) => 
    `One day, ${person} decided to ${verb} at ${place} with a very ${adj} ${noun}.`,
  (noun, adj, person, verb, place) => 
    `In the middle of ${place}, ${person} found a ${adj} ${noun} and couldn't resist the urge to ${verb}!`,
  (noun, adj, person, verb, place) => 
    `Legend has it that ${person} once visited ${place} just to ${verb} with a massive ${adj} ${noun}.`,
  (noun, adj, person, verb, place) => 
    `When ${person} arrived in ${place}, everyone was holding a ${adj} ${noun} while attempting to ${verb}.`
];

// Function to collect input values and validate them
function getInputs() {
  const noun = document.getElementById("noun").value.trim();
  const adjective = document.getElementById("adjective").value.trim();
  const person = document.getElementById("person").value.trim();
  const verb = document.getElementById("verb").value.trim();
  const place = document.getElementById("place").value.trim();

  if (!noun || !adjective || !person || !verb || !place) {
    alert("Please fill in all input fields before generating a story!");
    return null;
  }

  return { noun, adjective, person, verb, place };
}

// Generate a random story from templates
function generateStory() {
  const inputs = getInputs();
  if (!inputs) return;

  const { noun, adjective, person, verb, place } = inputs;
  const randomIndex = Math.floor(Math.random() * storyTemplates.length);
  
  storySpan.textContent = storyTemplates[randomIndex](noun, adjective, person, verb, place);
}

// Event listener for form submission
form.addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent page refresh
  generateStory();
});

// Bonus: Shuffle button event listener
shuffleBtn.addEventListener("click", function () {
  generateStory();
});