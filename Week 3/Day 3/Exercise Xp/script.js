// ==========================================
// Exercise 1: Change the article
// ==========================================

// 1. Retrieve the h1 and console.log it
const article = document.querySelector("article");
const h1 = article.querySelector("h1");
console.log(h1);

// 2. Remove the last paragraph in the <article> tag
const paragraphs = article.querySelectorAll("p");
if (paragraphs.length > 0) {
  paragraphs[paragraphs.length - 1].remove();
}

// 3. Change h2 background color to red on click
const h2 = article.querySelector("h2");
h2.addEventListener("click", () => {
  h2.style.backgroundColor = "red";
});

// 4. Hide h3 on click
const h3 = article.querySelector("h3");
h3.addEventListener("click", () => {
  h3.style.display = "none";
});

// 5. Button to make paragraph text bold
const boldBtn = document.getElementById("boldBtn");
boldBtn.addEventListener("click", () => {
  const allParagraphs = article.querySelectorAll("p");
  allParagraphs.forEach(p => {
    p.style.fontWeight = "bold";
  });
});

// BONUS 1: Random font size on h1 hover (0 to 100px)
h1.addEventListener("mouseover", () => {
  const randomSize = Math.floor(Math.random() * 101);
  h1.style.fontSize = `${randomSize}px`;
});

// BONUS 2: Hover 2nd paragraph to fade out
if (paragraphs[1]) {
  paragraphs[1].addEventListener("mouseover", () => {
    paragraphs[1].classList.add("fade-out");
  });
}


// ==========================================
// Exercise 2: Work with forms
// ==========================================

// 1. Retrieve form and console.log it
const userForm = document.getElementById("userForm");
console.log(userForm);

// 2. Retrieve inputs by id and console.log them
const fnameInput = document.getElementById("fname");
const lnameInput = document.getElementById("lname");
console.log(fnameInput, lnameInput);

// 3. Retrieve inputs by name attribute and console.log them
const fnameByName = document.getElementsByName("firstname")[0];
const lnameByName = document.getElementsByName("lastname")[0];
console.log(fnameByName, lnameByName);

// 4. Handle submit event
userForm.addEventListener("submit", (event) => {
  // event.preventDefault() stops the default form submission action, 
  // preventing the page from reloading so we can handle data using JavaScript.
  event.preventDefault();

  const fnameVal = fnameInput.value.trim();
  const lnameVal = lnameInput.value.trim();

  if (fnameVal !== "" && lnameVal !== "") {
    const ul = document.querySelector(".usersAnswer");
    ul.innerHTML = ""; // Clear existing list items

    const liFirst = document.createElement("li");
    liFirst.textContent = fnameVal;

    const liLast = document.createElement("li");
    liLast.textContent = lnameVal;

    ul.appendChild(liFirst);
    ul.appendChild(liLast);
  } else {
    alert("Please fill in both first name and last name fields.");
  }
});


// ==========================================
// Exercise 3: Transform the sentence
// ==========================================

let allBoldItems;

function getBoldItems() {
  allBoldItems = document.querySelectorAll("#targetPara strong");
}

function highlight() {
  allBoldItems.forEach(item => {
    item.style.color = "blue";
  });
}

function returnItemsToDefault() {
  allBoldItems.forEach(item => {
    item.style.color = "black";
  });
}

// Collect all bold elements first
getBoldItems();

const targetPara = document.getElementById("targetPara");
targetPara.addEventListener("mouseover", highlight);
targetPara.addEventListener("mouseout", returnItemsToDefault);


// ==========================================
// Exercise 4: Volume of a sphere
// ==========================================

const sphereForm = document.getElementById("MyForm");

sphereForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const radiusInput = document.getElementById("radius").value;
  const radius = parseFloat(radiusInput);

  if (!isNaN(radius) && radius >= 0) {
    // Formula for volume of sphere: V = (4/3) * pi * r^3
    const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
    document.getElementById("volume").value = volume.toFixed(2);
  } else {
    alert("Please enter a valid positive number for radius.");
  }
});