// Exercise 1: Find the numbers divisible by 23
function displayNumbersDivisible(divisor = 23) {
    let sum = 0;
    let divisibleNumbers = [];

    for (let i = 0; i <= 500; i++) {
        if (i % divisor === 0) {
            divisibleNumbers.push(i);
            sum += i;
        }
    }

    console.log(`Outcome : ${divisibleNumbers.join(" ")}`);
    console.log(`Sum : ${sum}`);
}

// Default execution (divisible by 23)
displayNumbersDivisible();

// Bonus examples:
// displayNumbersDivisible(3);
// displayNumbersDivisible(45);

// Exercise 2: Shopping List
const stock = {
    banana: 6,
    apple: 0,
    pear: 12,
    orange: 32,
    blueberry: 1
};

const prices = {
    banana: 4,
    apple: 2,
    pear: 1,
    orange: 1.5,
    blueberry: 10
};

const shoppingList = ["banana", "orange", "apple"];

function myBill() {
    let total = 0;

    for (const item of shoppingList) {
        if (item in stock && stock[item] > 0) {
            total += prices[item];
            stock[item] -= 1; // Bonus requirement
        }
    }

    return total;
}

console.log("Total Bill:", myBill());

// Exercise 3: What's in my wallet?
function changeEnough(itemPrice, amountOfChange) {
    const coinValues = [0.25, 0.10, 0.05, 0.01];

    const totalChange = amountOfChange.reduce((total, count, index) => {
        return total + (count * coinValues[index]);
    }, 0);

    return totalChange >= itemPrice;
}

// Test cases
console.log(changeEnough(4.25, [25, 20, 5, 0])); // true
console.log(changeEnough(14.11, [2, 100, 0, 0])); // false
console.log(changeEnough(0.75, [0, 0, 20, 5])); // true

// Exercise 4: Vacations Costs
function hotelCost(nights) {
    while (isNaN(nights) || nights === null || nights === "") {
        nights = prompt("How many nights would you like to stay?");
    }
    return Number(nights) * 140;
}

function planeRideCost(destination) {
    while (!destination || typeof destination !== "string" || !isNaN(destination)) {
        destination = prompt("What is your destination?");
    }

    destination = destination.trim().toLowerCase();
    if (destination === "london") return 183;
    if (destination === "paris") return 220;
    return 300;
}

function rentalCarCost(days) {
    while (isNaN(days) || days === null || days === "") {
        days = prompt("How many days would you like to rent the car?");
    }

    let numDays = Number(days);
    let total = numDays * 40;
    if (numDays > 10) {
        total *= 0.95; // 5% discount
    }
    return total;
}

function totalVacationCost() {
    // Prompting done inside totalVacationCost (Bonus requirement)
    const nights = prompt("How many nights will you stay at the hotel?");
    const destination = prompt("What is your destination?");
    const days = prompt("How many days will you rent a car?");

    const hCost = hotelCost(nights);
    const pCost = planeRideCost(destination);
    const cCost = rentalCarCost(days);

    console.log(`The car cost: $${cCost}, the hotel cost: $${hCost}, the plane tickets cost: $${pCost}.`);
    return hCost + pCost + cCost;
}

// Execute calculation
// console.log("Total Vacation Cost:", totalVacationCost());

// Exercise 5: Users
if (typeof document !== "undefined") {
    // 2. DOM Manipulations
    const containerDiv = document.getElementById("container");
    console.log(containerDiv);

    const lists = document.querySelectorAll(".list");
    lists[0].children[1].textContent = "Richard";

    lists[1].children[1].remove();

    const myName = "Alex";
    lists.forEach(ul => {
        ul.firstElementChild.textContent = myName;
    });

    // 3. Class Manipulations
    lists.forEach(ul => ul.classList.add("student_list"));
    lists[0].classList.add("university", "attendance");

    // 4. Style Manipulations
    containerDiv.style.backgroundColor = "lightblue";
    containerDiv.style.padding = "10px";

    const listItems = document.querySelectorAll("li");
    listItems.forEach(li => {
        if (li.textContent === "Dan") {
            li.style.display = "none";
        }
        if (li.textContent === "Richard") {
            li.style.border = "1px solid black";
        }
    });

    document.body.style.fontSize = "18px";

    if (containerDiv.style.backgroundColor === "lightblue") {
        const users = Array.from(lists[0].children).map(li => li.textContent);
        alert(`Hello ${users[0]} and ${users[1]}`);
    }
}

// Exercise 6: Change the navbar
if (typeof document !== "undefined") {
    const navBar = document.getElementById("navBar");
    navBar.setAttribute("id", "socialNetworkNavigation");

    const ul = navBar.querySelector("ul");
    const newLi = document.createElement("li");
    const textNode = document.createTextNode("Logout");
    newLi.appendChild(textNode);
    ul.appendChild(newLi);

    const firstItem = ul.firstElementChild;
    const lastItem = ul.lastElementChild;

    console.log("First link text:", firstItem.textContent.trim());
    console.log("Last link text:", lastItem.textContent.trim());
}

// Exercise 7: My Book List
if (typeof document !== "undefined") {
    const allBooks = [
        {
            title: "The Hobbit",
            author: "J.R.R. Tolkien",
            image: "https://via.placeholder.com/100?text=The+Hobbit",
            alreadyRead: true
        },
        {
            title: "Dune",
            author: "Frank Herbert",
            image: "https://via.placeholder.com/100?text=Dune",
            alreadyRead: false
        }
    ];

    const listBooksSection = document.querySelector(".listBooks");

    allBooks.forEach(book => {
        const bookDiv = document.createElement("div");

        const p = document.createElement("p");
        p.textContent = `${book.title} written by ${book.author}`;

        if (book.alreadyRead) {
            p.style.color = "red";
        }

        const img = document.createElement("img");
        img.src = book.image;
        img.style.width = "100px";

        bookDiv.appendChild(p);
        bookDiv.appendChild(img);
        listBooksSection.appendChild(bookDiv);
    });
}