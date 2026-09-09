const apiKey = "hpvZycW22qCjn5cRM1xtWB8NKq4dQ2My";
const form = document.getElementById("search-form");
const categoryInput = document.getElementById("category-input");
const deleteAllBtn = document.getElementById("delete-all-btn");
const gifContainer = document.getElementById("gif-container");

// Function to fetch a random GIF based on user category
async function fetchRandomGif(category) {
  const url = `https://api.giphy.com/v1/gifs/random?tag=${encodeURIComponent(category)}&api_key=${apiKey}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.data && data.data.images) {
      const gifUrl = data.data.images.original.url;
      appendGifToDom(gifUrl, category);
    } else {
      alert("No GIF found for that category!");
    }
  } catch (error) {
    console.error("Error fetching GIF:", error);
  }
}

// Function to append GIF and individual DELETE button to the DOM
function appendGifToDom(gifUrl, category) {
  const gifWrapper = document.createElement("div");
  gifWrapper.classList.add("gif-item");

  const img = document.createElement("img");
  img.src = gifUrl;
  img.alt = category;

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "DELETE";

  // Individual DELETE functionality
  deleteBtn.addEventListener("click", () => {
    gifWrapper.remove();
  });

  gifWrapper.appendChild(img);
  gifWrapper.appendChild(deleteBtn);
  gifContainer.appendChild(gifWrapper);
}

// Form submit event handler
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const category = categoryInput.value.trim();

  if (category) {
    fetchRandomGif(category);
    categoryInput.value = "";
  }
});

// DELETE ALL functionality
deleteAllBtn.addEventListener("click", () => {
  gifContainer.innerHTML = "";
});