// Part 1: Array of Quote Objects
const quotes = [
  { id: 0, author: "Oscar Wilde", quote: "Be yourself; everyone else is already taken.", likes: 0 },
  { id: 1, author: "Albert Einstein", quote: "Two things are infinite: the universe and human stupidity.", likes: 0 },
  { id: 2, author: "Frank Zappa", quote: "So many books, so little time.", likes: 0 },
  { id: 3, author: "Oscar Wilde", quote: "To live is the rarest thing in the world. Most people exist, that is all.", likes: 0 }
];

let lastQuoteId = null;
let currentQuote = null;

// DOM Elements
const generateBtn = document.getElementById("generate-btn");
const quoteText = document.getElementById("quote-text");
const quoteAuthor = document.getElementById("quote-author");
const quoteLikes = document.getElementById("quote-likes");
const statsOutput = document.getElementById("stats-output");

// Part 1: Retrieve and display random quote without repeating twice in a row
const generateQuote = () => {
  if (quotes.length === 0) return;

  let randomIndex;
  // If more than 1 quote exists, ensure it doesn't repeat consecutively
  if (quotes.length > 1) {
    do {
      randomIndex = Math.floor(Math.random() * quotes.length);
    } while (quotes[randomIndex].id === lastQuoteId);
  } else {
    randomIndex = 0;
  }

  currentQuote = quotes[randomIndex];
  lastQuoteId = currentQuote.id;
  displayCurrentQuote();
  statsOutput.textContent = ""; // Reset stats output
};

const displayCurrentQuote = () => {
  if (!currentQuote) return;
  quoteText.textContent = `"${currentQuote.quote}"`;
  quoteAuthor.textContent = `— ${currentQuote.author}`;
  quoteLikes.textContent = `Likes: ${currentQuote.likes}`;
};

generateBtn.addEventListener("click", generateQuote);

// Part 2: Add Quote Form
const addQuoteForm = document.getElementById("add-quote-form");
addQuoteForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const quoteInput = document.getElementById("new-quote");
  const authorInput = document.getElementById("new-author");

  const newQuoteObj = {
    id: quotes.length, // Increment ID based on array length
    quote: quoteInput.value.trim(),
    author: authorInput.value.trim(),
    likes: 0
  };

  quotes.push(newQuoteObj);
  alert("Quote added successfully!");
  
  quoteInput.value = "";
  authorInput.value = "";
});

// Part 2: Interactive Buttons
document.getElementById("btn-char-with-space").addEventListener("click", () => {
  if (!currentQuote) return;
  statsOutput.textContent = `Character count (with spaces): ${currentQuote.quote.length}`;
});

document.getElementById("btn-char-no-space").addEventListener("click", () => {
  if (!currentQuote) return;
  const count = currentQuote.quote.replace(/\s+/g, "").length;
  statsOutput.textContent = `Character count (without spaces): ${count}`;
});

document.getElementById("btn-word-count").addEventListener("click", () => {
  if (!currentQuote) return;
  const wordCount = currentQuote.quote.trim().split(/\s+/).length;
  statsOutput.textContent = `Word count: ${wordCount}`;
});

document.getElementById("btn-like").addEventListener("click", () => {
  if (!currentQuote) return;
  currentQuote.likes += 1;
  displayCurrentQuote();
});

// Part 3: Filter Form & Previous/Next Navigation
let filteredQuotes = [];
let filteredIndex = 0;

const filterForm = document.getElementById("filter-author-form");
const filterDisplay = document.getElementById("filter-display");
const filteredQuoteText = document.getElementById("filtered-quote-text");
const filteredQuoteAuthor = document.getElementById("filtered-quote-author");

filterForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const authorSearch = document.getElementById("filter-author-input").value.trim().toLowerCase();

  filteredQuotes = quotes.filter(q => q.author.toLowerCase().includes(authorSearch));

  if (filteredQuotes.length > 0) {
    filteredIndex = 0;
    filterDisplay.style.display = "block";
    showFilteredQuote();
  } else {
    filterDisplay.style.display = "none";
    alert("No quotes found for this author.");
  }
});

const showFilteredQuote = () => {
  const item = filteredQuotes[filteredIndex];
  filteredQuoteText.textContent = `"${item.quote}"`;
  filteredQuoteAuthor.textContent = `— ${item.author}`;
};

document.getElementById("btn-prev").addEventListener("click", () => {
  if (filteredQuotes.length === 0) return;
  filteredIndex = (filteredIndex - 1 + filteredQuotes.length) % filteredQuotes.length;
  showFilteredQuote();
});

document.getElementById("btn-next").addEventListener("click", () => {
  if (filteredQuotes.length === 0) return;
  filteredIndex = (filteredIndex + 1) % filteredQuotes.length;
  showFilteredQuote();
});